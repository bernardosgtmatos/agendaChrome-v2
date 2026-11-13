const { Op } = require('sequelize')
const Agendamento = require('../model/AgendamentoModel')
const { horarios_devolução } = require('../model/HorariosModel')

async function finalizarAgendamentosPassados() {
  const agora = new Date()
  const hoje = agora.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
  const agoraHora = agora.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo',
  })

  const [agendamentos, devolucoes] = await Promise.all([
    Agendamento.findAll({
      where: {
        status: { [Op.in]: ['Pendente', 'Em progresso'] },
        date: { [Op.lte]: hoje },
      },
      attributes: ['id', 'date', 'data_devolucao', 'status'],
    }),
    horarios_devolução.findAll({
      attributes: ['id', 'horarios_devolução'],
    }),
  ])

  const mapDevolucao = new Map(
    devolucoes.map((item) => [String(item.id), item['horarios_devolução']]),
  )

  const idsParaFinalizar = []
  for (const agendamento of agendamentos) {
    let finalizar = false
    if (String(agendamento.date) < hoje) {
      finalizar = true
    } else if (String(agendamento.date) === hoje) {
      const horarioDevolucao = mapDevolucao.get(String(agendamento.data_devolucao))
      if (horarioDevolucao && agoraHora >= String(horarioDevolucao)) {
        finalizar = true
      }
    }
    if (finalizar) idsParaFinalizar.push(agendamento.id)
  }

  if (idsParaFinalizar.length === 0) return 0

  await Agendamento.update(
    { status: 'Finalizado' },
    { where: { id: { [Op.in]: idsParaFinalizar } } },
  )

  return idsParaFinalizar.length
}

module.exports = { finalizarAgendamentosPassados }
