import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getJson, postJson } from '../../lib/api.ts'
import { useAuth } from '../../lib/useAuth.ts'
import './AgendamentoForm.css'

type Opcao = { id: string; rotulo: string }

type Opcoes = {
  retirada: Opcao[]
  devolucao: Opcao[]
  turmas: Opcao[]
  locais: Opcao[]
}

type HorarioRetirada = { id: string; horario_retirada: string }
type HorarioDevolucao = { id: string; 'horarios_devolução': string }
type Turma = { id: string; serie: string }
type Local = { id: string; nome: string }

type OcupacaoLocal = {
  ocupado: boolean
  por: {
    agendamento_id: string
    retirada: string
    devolucao: string
    quantidade: number
    status: string
  } | null
  retirada: string
  devolucao: string
}

type Disponibilidade = {
  total: number
  ocupado: number
  disponivel: number
  retirada: string
  devolucao: string
  local: OcupacaoLocal | null
}

type DadosFormulario = {
  date: string
  data_retirada: string
  data_devolucao: string
  turma: string
  Local: string
  quantidade: string
  observacao: string
}

type Sucesso = { texto: string; agendamentoId?: string }

const OPCOES_VAZIAS: Opcoes = {
  retirada: [],
  devolucao: [],
  turmas: [],
  locais: [],
}

type SlotDia = { nome: string; inicio: string; fim: string; rotulo: string }

const SLOTS_DO_DIA: SlotDia[] = [
  { nome: '1º Aula', inicio: '07:00', fim: '07:50', rotulo: '07:00 - 07:50' },
  { nome: '2º Aula', inicio: '07:50', fim: '08:40', rotulo: '07:50 - 08:40' },
  { nome: '3º Aula', inicio: '09:00', fim: '09:50', rotulo: '09:00 - 9:50' },
  { nome: '4º Aula', inicio: '09:50', fim: '10:40', rotulo: '09:50 - 10:40' },
  { nome: '5º Aula', inicio: '10:40', fim: '11:30', rotulo: '10:40 - 11:30' },
  { nome: '6º Aula', inicio: '12:20', fim: '13:10', rotulo: '12:20 - 13:10' },
  { nome: '7º Aula', inicio: '13:10', fim: '14:00', rotulo: '13:30 - 14:00' },
]

type LinhaTabela = {
  slot: SlotDia
  total: number | null
  ocupado: number | null
  disponivel: number | null
  carregando: boolean
  semHorario: boolean
  erro: boolean
}

type CelulaLocal = {
  localId: string
  ocupado: boolean | null
  por: OcupacaoLocal['por']
  carregando: boolean
  erro: boolean
  semHorario: boolean
}

type LinhaMatriz = {
  slot: SlotDia
  celulas: CelulaLocal[]
  semHorario: boolean
}

type AbaPainel = 'agendamentos' | 'locais'

function hoje(): string {
  const agora = new Date()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${mes}-${dia}`
}

function dadosIniciais(): DadosFormulario {
  return {
    date: hoje(),
    data_retirada: '',
    data_devolucao: '',
    turma: '',
    Local: '',
    quantidade: '',
    observacao: '',
  }
}

function rotuloDa(opcoes: Opcao[], id: string): string | undefined {
  return opcoes.find((opcao) => opcao.id === id)?.rotulo
}

function idPorHorario(opcoes: Opcao[], hhmm: string): string | null {
  const exato = opcoes.find((o) => o.rotulo.slice(0, 5) === hhmm)
  return exato ? exato.id : null
}

function formatarData(iso: string): string {
  const [a, m, d] = iso.split('-')
  if (!a || !m || !d) return iso
  return `${d}/${m}/${a}`
}

type PropsSelecao = {
  id: string
  rotulo: string
  valor: string
  opcoes: Opcao[]
  vazio: string
  desabilitado: boolean
  aoMudar: (valor: string) => void
}

function Selecao({ id, rotulo, valor, opcoes, vazio, desabilitado, aoMudar }: PropsSelecao) {
  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      <select
        id={id}
        value={valor}
        disabled={desabilitado}
        onChange={(evento) => aoMudar(evento.target.value)}
        required
      >
        <option value="">{vazio}</option>
        {opcoes.map((opcao) => (
          <option key={opcao.id} value={opcao.id}>
            {opcao.rotulo}
          </option>
        ))}
      </select>
    </div>
  )
}

function AgendamentoForm() {
  const { usuario, sair } = useAuth()
  const navigate = useNavigate()
  const [dados, setDados] = useState<DadosFormulario>(dadosIniciais)
  const [opcoes, setOpcoes] = useState<Opcoes>(OPCOES_VAZIAS)
  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<Sucesso | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const [disponibilidade, setDisponibilidade] = useState<Disponibilidade | null>(null)
  const [tabela, setTabela] = useState<LinhaTabela[]>([])
  const [aba, setAba] = useState<AbaPainel>('agendamentos')
  const [tabelaLocais, setTabelaLocais] = useState<LinhaMatriz[]>([])

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      try {
        const [retirada, devolucao, turmas, locais] = await Promise.all([
          getJson<HorarioRetirada[]>('events/listHorario_ret'),
          getJson<HorarioDevolucao[]>('events/listHorario_devol'),
          getJson<Turma[]>('events/listTurmas'),
          getJson<Local[]>('events/listLocal'),
        ])
        if (cancelado) return
        setOpcoes({
          retirada: retirada.map((horario) => ({ id: horario.id, rotulo: horario.horario_retirada })),
          devolucao: devolucao.map((horario) => ({ id: horario.id, rotulo: horario['horarios_devolução'] })),
          turmas: turmas.map((turma) => ({ id: turma.id, rotulo: turma.serie })),
          locais: locais.map((item) => ({ id: item.id, rotulo: item.nome })),
        })
      } catch (falha) {
        if (cancelado) return
        setErroCarregamento(
          falha instanceof Error
            ? `não foi possível carregar as listas do formulário: ${falha.message}`
            : 'não foi possível carregar as listas do formulário',
        )
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [])

  function atualizar(campo: keyof DadosFormulario, valor: string) {
    setDados((atual) => ({ ...atual, [campo]: valor }))
  }

  function limpar() {
    setDados(dadosIniciais())
    setDisponibilidade(null)
    setErro(null)
    setSucesso(null)
  }

  async function aoSair() {
    setSaindo(true)
    try {
      await sair()
    } finally {
      setSaindo(false)
      navigate('/login', { replace: true })
    }
  }

  useEffect(() => {
    if (!dados.date || opcoes.retirada.length === 0 || opcoes.devolucao.length === 0) {
      return
    }
    let cancelado = false

    async function carregarTabela() {
      if (!cancelado) {
        setTabela(
          SLOTS_DO_DIA.map((slot) => {
            const semHorario = !idPorHorario(opcoes.retirada, slot.inicio) || !idPorHorario(opcoes.devolucao, slot.fim)
            return {
              slot,
              total: null,
              ocupado: null,
              disponivel: null,
              carregando: !semHorario,
              semHorario,
              erro: false,
            }
          }),
        )
      }

      const resultados = await Promise.allSettled(
        SLOTS_DO_DIA.map((slot) => {
          const retId = idPorHorario(opcoes.retirada, slot.inicio)
          const devId = idPorHorario(opcoes.devolucao, slot.fim)
          if (!retId || !devId) return Promise.reject(new Error('horário ausente'))
          const params = new URLSearchParams({
            date: dados.date,
            data_retirada: retId,
            data_devolucao: devId,
          })
          return getJson<Disponibilidade>(`events/disponibilidade?${params.toString()}`)
        }),
      )
      if (cancelado) return
      setTabela(
        SLOTS_DO_DIA.map((slot, i) => {
          const r = resultados[i]
          const semHorario = !idPorHorario(opcoes.retirada, slot.inicio) || !idPorHorario(opcoes.devolucao, slot.fim)
          if (semHorario || r.status === 'rejected') {
            return { slot, total: null, ocupado: null, disponivel: null, carregando: false, semHorario, erro: !semHorario }
          }
          return {
            slot,
            total: r.value.total,
            ocupado: r.value.ocupado,
            disponivel: r.value.disponivel,
            carregando: false,
            semHorario: false,
            erro: false,
          }
        }),
      )
    }

    carregarTabela()
    return () => {
      cancelado = true
    }
  }, [dados.date, opcoes.retirada, opcoes.devolucao])

  useEffect(() => {
    if (aba !== 'locais') return
    if (!dados.date || opcoes.retirada.length === 0 || opcoes.devolucao.length === 0) return
    if (opcoes.locais.length === 0) return
    let cancelado = false

    async function carregarMatriz() {
      if (!cancelado) {
        setTabelaLocais(
          SLOTS_DO_DIA.map((slot) => {
            const semHorario = !idPorHorario(opcoes.retirada, slot.inicio) || !idPorHorario(opcoes.devolucao, slot.fim)
            return {
              slot,
              semHorario,
              celulas: opcoes.locais.map((l) => ({
                localId: l.id,
                ocupado: null,
                por: null,
                carregando: !semHorario,
                erro: false,
                semHorario,
              })),
            }
          }),
        )
      }
      const pares: { retId: string | null; devId: string | null; localId: string }[] = []
      for (const slot of SLOTS_DO_DIA) {
        const retId = idPorHorario(opcoes.retirada, slot.inicio)
        const devId = idPorHorario(opcoes.devolucao, slot.fim)
        for (const l of opcoes.locais) {
          pares.push({ retId, devId, localId: l.id })
        }
      }
      const resultados = await Promise.allSettled(
        pares.map((p) => {
          if (!p.retId || !p.devId) return Promise.reject(new Error('horário ausente'))
          const params = new URLSearchParams({
            date: dados.date,
            data_retirada: p.retId,
            data_devolucao: p.devId,
            local_id: p.localId,
          })
          return getJson<Disponibilidade>(`events/disponibilidade?${params.toString()}`)
        }),
      )
      if (cancelado) return
      let k = 0
      setTabelaLocais(
        SLOTS_DO_DIA.map((slot) => {
          const semHorario = !idPorHorario(opcoes.retirada, slot.inicio) || !idPorHorario(opcoes.devolucao, slot.fim)
          const celulas = opcoes.locais.map((l) => {
            const r = resultados[k++]
            if (semHorario || r.status === 'rejected') {
              return { localId: l.id, ocupado: null, por: null, carregando: false, erro: !semHorario, semHorario }
            }
            return {
              localId: l.id,
              ocupado: r.value.local ? r.value.local.ocupado : false,
              por: r.value.local ? r.value.local.por : null,
              carregando: false,
              erro: false,
              semHorario: false,
            }
          })
          return { slot, celulas, semHorario }
        }),
      )
    }

    carregarMatriz()
    return () => {
      cancelado = true
    }
  }, [aba, dados.date, opcoes.retirada, opcoes.devolucao, opcoes.locais])

  useEffect(() => {
    if (!dados.date || !dados.data_retirada || !dados.data_devolucao) {
      return
    }
    let cancelado = false
    const params = new URLSearchParams({
      date: dados.date,
      data_retirada: dados.data_retirada,
      data_devolucao: dados.data_devolucao,
      ...(dados.Local ? { local_id: dados.Local } : {}),
    })
    getJson<Disponibilidade>(`events/disponibilidade?${params.toString()}`)
      .then((info) => {
        if (!cancelado) setDisponibilidade(info)
      })
      .catch(() => {
        if (!cancelado) setDisponibilidade(null)
      })
    return () => {
      cancelado = true
    }
  }, [dados.date, dados.data_retirada, dados.data_devolucao, dados.Local])

  const intervaloCompleto = Boolean(dados.date && dados.data_retirada && dados.data_devolucao)
  const disp = intervaloCompleto ? disponibilidade : null

  function validar(): string | null {
    if (!dados.date) return 'Informe a data do agendamento.'
    if (!dados.data_retirada) return 'Selecione a aula de retirada.'
    if (!dados.data_devolucao) return 'Selecione a aula de devolução.'
    if (!dados.turma) return 'Selecione a turma.'
    if (!dados.Local) return 'Selecione o local.'

    const quantidade = Number(dados.quantidade)
    if (dados.quantidade.trim() === '' || !Number.isInteger(quantidade) || quantidade <= 0) {
      return 'A quantidade de chromebooks deve ser um número inteiro maior que zero.'
    }

    const retirada = rotuloDa(opcoes.retirada, dados.data_retirada)
    const devolucao = rotuloDa(opcoes.devolucao, dados.data_devolucao)
    if (retirada && devolucao && devolucao <= retirada) {
      return `A devolução (${devolucao}) precisa ser depois da retirada (${retirada}).`
    }

    if (disp && quantidade > disp.disponivel) {
      return `Só há ${disp.disponivel} chromebooks disponíveis neste intervalo.`
    }

    if (disp?.local?.ocupado) {
      const nomeLocal = rotuloDa(opcoes.locais, dados.Local) ?? 'Este local'
      const por = disp.local.por
      return `${nomeLocal} já está ocupado neste intervalo${por ? ` (${por.retirada}–${por.devolucao})` : ''}. Escolha outro local ou horário.`
    }

    return null
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setSucesso(null)

    const problema = validar()
    if (problema) {
      setErro(problema)
      return
    }

    setErro(null)
    setEnviando(true)

    try {
      const corpo = await postJson<{ message?: string; agendamento_id?: string }>(
        'usuario/NovoAgendamento',
        {
          date: dados.date,
          data_retirada: dados.data_retirada,
          data_devolucao: dados.data_devolucao,
          turma: dados.turma,
          Local: dados.Local,
          quantidade: Number(dados.quantidade),
          observacao: dados.observacao.trim(),
        },
      )

      setSucesso({
        texto: corpo?.message ?? 'Agendamento realizado com sucesso.',
        agendamentoId: corpo?.agendamento_id,
      })
      setDados(dadosIniciais())
      setDisponibilidade(null)
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? `não foi possível falar com a API: ${falha.message}`
          : 'erro inesperado ao tentar o agendamento',
      )
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) {
    return <p className="agendar-aviso">Carregando listas...</p>
  }

  if (erroCarregamento) {
    return <p className="agendar-aviso agendar-aviso--erro">{erroCarregamento}</p>
  }

  const inicial = (usuario?.nome ?? 'U').trim().charAt(0).toUpperCase() || 'U'

  return (
    <main className="agendar">
      <header className="agendar-topo">
        <h1>AgendaChrome</h1>
        <div className="agendar-usuario">
          <span className="agendar-avatar" aria-hidden="true">{inicial}</span>
          <span className="agendar-nome">{usuario?.nome ?? 'Usuário'}</span>
          <button
            type="button"
            className="agendar-engrenagem"
            onClick={aoSair}
            disabled={saindo}
            title="Sair"
            aria-label="Sair"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="agendar-barra">
        <span className="agendar-barra__rotulo">Visualizar disponibilidade para:</span>
        <label className="agendar-data">
          <span>{formatarData(dados.date)}</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <input
            type="date"
            value={dados.date}
            disabled={enviando}
            onChange={(e) => atualizar('date', e.target.value)}
            aria-label="Data da disponibilidade"
          />
        </label>
      </div>

      <div className="agendar-barra agendar-barra--abas">
        <span className="agendar-barra__rotulo">Visualizar disponibilidade para:</span>
        <div className="agendar-abas" role="tablist" aria-label="Tipo de disponibilidade">
          <button
            type="button"
            role="tab"
            aria-selected={aba === 'agendamentos'}
            className={`agendar-aba${aba === 'agendamentos' ? ' agendar-aba--ativa' : ''}`}
            onClick={() => setAba('agendamentos')}
          >
            Agendamentos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={aba === 'locais'}
            className={`agendar-aba${aba === 'locais' ? ' agendar-aba--ativa' : ''}`}
            onClick={() => setAba('locais')}
          >
            Locais
          </button>
        </div>
      </div>

      <div className="agendar-grid">
        <section className="agendar-painel" aria-label="Disponibilidade">
          {aba === 'agendamentos' && (
            <div role="tabpanel" aria-label="Disponibilidade por aula">
              <table className="agendar-tabela">
                <thead>
                  <tr>
                    <th scope="col">Horário</th>
                    <th scope="col">Disponibilidade</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tabela.map((linha) => {
                    const st = linha.disponivel === null || linha.total === null
                      ? 'vazio'
                      : linha.disponivel <= 0
                        ? 'indisponivel'
                        : linha.disponivel < 10
                          ? 'critico'
                          : linha.disponivel <= linha.total / 2
                            ? 'limitado'
                            : 'disponivel'
                    const pct = linha.total && linha.total > 0 && linha.disponivel !== null
                      ? Math.round((linha.disponivel / linha.total) * 100)
                      : 0
                    return (
                      <tr key={linha.slot.nome}>
                        <td><span className="celula">{linha.slot.nome} ({linha.slot.rotulo})</span></td>
                        <td>
                          {linha.carregando && <span className="celula">Carregando…</span>}
                          {!linha.carregando && (linha.semHorario || linha.erro) && <span className="celula">—</span>}
                          {!linha.carregando && !linha.semHorario && !linha.erro && (
                            <span className="celula celula--qtd">
                              <strong>{linha.disponivel}/{linha.total}</strong>
                              <span
                                className={`mini-barra mini-barra--${st}`}
                                role="progressbar"
                                aria-valuenow={pct}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`Disponíveis ${linha.slot.nome}`}
                              >
                                <i style={{ width: `${pct}%` }} />
                              </span>
                            </span>
                          )}
                        </td>
                        <td>
                          {linha.carregando && <span className="estado estado--vazio">…</span>}
                          {!linha.carregando && (linha.semHorario || linha.erro) && <span className="estado estado--vazio">—</span>}
                          {!linha.carregando && !linha.semHorario && !linha.erro && (
                            <span className={`estado estado--${st}`}>
                              {st === 'disponivel' && 'Disponível'}
                              {st === 'limitado' && 'Limitado'}
                              {st === 'critico' && 'Indisponível'}
                              {st === 'indisponivel' && 'Indisponível'}
                              {st === 'vazio' && '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {aba === 'locais' && (
            <div role="tabpanel" aria-label="Disponibilidade por local">
              <table className="agendar-tabela agendar-tabela--matriz">
                <thead>
                  <tr>
                    <th scope="col">Horário</th>
                    <th scope="col" colSpan={Math.max(opcoes.locais.length, 1)}>Disponibilidade</th>
                  </tr>
                </thead>
                <tbody>
                  {tabelaLocais.map((linha) => (
                    <tr key={linha.slot.nome}>
                      <td><span className="celula">{linha.slot.nome} ({linha.slot.rotulo})</span></td>
                      {linha.celulas.map((cel) => {
                        const nome = rotuloDa(opcoes.locais, cel.localId) ?? ''
                        return (
                          <td key={cel.localId}>
                            {cel.carregando && <span className="celula">…</span>}
                            {!cel.carregando && (cel.erro || cel.semHorario) && <span className="celula">—</span>}
                            {!cel.carregando && !cel.erro && !cel.semHorario && cel.ocupado !== null && (
                              <span
                                className={`celula celula--local ${cel.ocupado ? 'celula--ocupado' : 'celula--livre'}`}
                                title={cel.ocupado && cel.por ? `Ocupado ${cel.por.retirada}–${cel.por.devolucao}` : 'Livre'}
                              >
                                {nome}
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="agendar-coluna-form">
        <section className="agendar-painel agendar-painel--form" aria-labelledby="agendar-titulo">
          <h2 id="agendar-titulo">Agendar</h2>

          {erro && <p className="alerta alerta--erro">{erro}</p>}
          {sucesso && (
            <p className="alerta alerta--sucesso">
              {sucesso.texto}
              {sucesso.agendamentoId && (
                <>
                  {' '}
                  Protocolo: <strong>{sucesso.agendamentoId}</strong>
                </>
              )}
            </p>
          )}

          <form onSubmit={enviar} noValidate>
            <div className="campo campo--cheio">
              <label htmlFor="professor">Professor*</label>
              <input id="professor" type="text" value={usuario?.nome ?? ''} disabled readOnly />
            </div>

            <div className="form-duplo">
              <div className="campo">
                <label htmlFor="quantidade">Quantidade*</label>
                <input
                  id="quantidade"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={disp?.disponivel ?? undefined}
                  step={1}
                  value={dados.quantidade}
                  disabled={enviando}
                  onChange={(e) => atualizar('quantidade', e.target.value)}
                  required
                />
              </div>
              <div className="campo">
                <label htmlFor="date">Data de Agendamento*</label>
                <input
                  id="date"
                  type="date"
                  value={dados.date}
                  disabled={enviando}
                  onChange={(e) => atualizar('date', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-duplo">
              <Selecao
                id="turma"
                rotulo="Turma*"
                valor={dados.turma}
                opcoes={opcoes.turmas}
                vazio="Selecione"
                desabilitado={enviando}
                aoMudar={(v) => atualizar('turma', v)}
              />
              <Selecao
                id="data_retirada"
                rotulo="Aula de Retirada*"
                valor={dados.data_retirada}
                opcoes={opcoes.retirada}
                vazio="Selecione"
                desabilitado={enviando}
                aoMudar={(v) => atualizar('data_retirada', v)}
              />
            </div>

            <div className="form-duplo">
              <Selecao
                id="Local"
                rotulo="Local*"
                valor={dados.Local}
                opcoes={opcoes.locais}
                vazio="Selecione"
                desabilitado={enviando}
                aoMudar={(v) => atualizar('Local', v)}
              />
              <Selecao
                id="data_devolucao"
                rotulo="Aula de Devolução*"
                valor={dados.data_devolucao}
                opcoes={opcoes.devolucao}
                vazio="Selecione"
                desabilitado={enviando}
                aoMudar={(v) => atualizar('data_devolucao', v)}
              />
            </div>

            <div className="campo campo--cheio">
              <label htmlFor="observacao">Observações* (opcional)</label>
              <textarea
                id="observacao"
                rows={4}
                maxLength={255}
                value={dados.observacao}
                disabled={enviando}
                onChange={(e) => atualizar('observacao', e.target.value)}
              />
            </div>

            <div className="form-acoes">
              <button type="submit" className="btn btn--primario" disabled={enviando}>
                {enviando ? 'Enviando…' : 'Novo Agendamento'}
              </button>
              <button type="button" className="btn btn--secundario" onClick={limpar} disabled={enviando}>
                Limpar
              </button>
            </div>
          </form>
        </section>

        <Link to="/agendamentos" className="agendar-ver-lista">
          Ver Lista de agendamentos <span aria-hidden="true">⟶</span>
        </Link>
        </div>
      </div>
    </main>
  )
}

export default AgendamentoForm
