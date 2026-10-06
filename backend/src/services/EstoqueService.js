// Regra central do estoque (pool único de 36, bloqueio por intervalo sobreposto,
// devolução automática por horário — sem cron, sem tabela de saldo).
//
// Definições travadas:
// - Estoque calculado: disponivel = ESTOQUE_TOTAL - SUM(quantidade sobreposta no mesmo date)
// - Sobreposição: [retExist, devExist) cruza [retNovo, devNovo)
// - Fora da soma: status 'Cancelado'. 'Pendente'/'Em progresso'/'Finalizado' ocupam no dia.
// - Passou de date+hora_devolucao, a reserva sai da soma sozinha (leitura filtra por date).
const { ESTOQUE_TOTAL } = require('../config/estoque');
const { horario_retirada, horarios_devolução } = require('../model/HorariosModel');
const Agendamento = require('../model/AgendamentoModel');

const STATUS_OCUPANTES = ['Pendente', 'Em progresso', 'Finalizado'];

async function resolveIntervalo(data_retirada, data_devolucao) {
  const [ret, dev] = await Promise.all([
    horario_retirada.findOne({ where: { id: data_retirada } }),
    horarios_devolução.findOne({ where: { id: data_devolucao } }),
  ]);
  if (!ret || !dev) {
    const e = new Error(!ret ? 'Horario de retirada inexistente!' : 'Horario de devolução inexistente');
    e.status = 404;
    throw e;
  }
  // TIME vem como "HH:MM:SS" (zero-padded) — comparação lexicográfica equivale à cronológica.
  const retT = ret.horario_retirada;
  const devT = dev['horarios_devolução'];
  if (!retT || !devT) {
    const e = new Error('Horário sem valor TIME no banco.');
    e.status = 500;
    throw e;
  }
  if (devT <= retT) {
    const e = new Error(`A devolução (${devT}) precisa ser depois da retirada (${retT}).`);
    e.status = 400;
    throw e;
  }
  return { retT, devT };
}

async function getOcupacao(date, data_retirada, data_devolucao, opts = {}) {
  const { retT, devT } = await resolveIntervalo(data_retirada, data_devolucao);

  const [rets, devs, ags] = await Promise.all([
    horario_retirada.findAll({ transaction: opts.transaction || undefined }),
    horarios_devolução.findAll({ transaction: opts.transaction || undefined }),
    Agendamento.findAll({
      where: { date, status: STATUS_OCUPANTES },
      attributes: ['data_retirada', 'data_devolucao', 'quantidade'],
      transaction: opts.transaction || undefined,
    }),
  ]);

  const mapR = new Map(rets.map((r) => [String(r.id), r.horario_retirada]));
  const mapD = new Map(devs.map((d) => [String(d.id), d['horarios_devolução']]));

  let ocupado = 0;
  for (const a of ags) {
    const r = mapR.get(String(a.data_retirada));
    const d = mapD.get(String(a.data_devolucao));
    if (!r || !d) continue;
    if (r < devT && d > retT) ocupado += Number(a.quantidade) || 0;
  }

  return {
    total: ESTOQUE_TOTAL,
    ocupado,
    disponivel: ESTOQUE_TOTAL - ocupado,
    retirada: retT,
    devolucao: devT,
  };
}

async function checkDisponibilidade(date, data_retirada, data_devolucao, quantidade, opts = {}) {
  const info = await getOcupacao(date, data_retirada, data_devolucao, opts);
  if (Number(quantidade) > info.disponivel) {
    const e = new Error(
      `Estoque insuficiente neste intervalo: pedido ${quantidade}, disponível ${info.disponivel} de ${info.total} (ocupado ${info.ocupado}).`
    );
    e.status = 409;
    e.detalhe = info;
    throw e;
  }
  return info;
}

module.exports = { ESTOQUE_TOTAL, STATUS_OCUPANTES, getOcupacao, checkDisponibilidade, resolveIntervalo };
