import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJson, postJson } from '../../lib/api.ts'
import { useAuth } from '../../lib/useAuth.ts'
import './MeuPainel.css'

const VAZIO = '—'
const LIMITE_PAGINA = 10

type Agendamento = {
  id: string
  usuario_id: string
  date: string
  data_retirada: string
  data_devolucao: string
  quantidade: number
  turma: string
  local_id: string
  observacao: string | null
  status: string
  createdAt?: string
}

type HorarioRetirada = { id: string; horario_retirada: string }
type HorarioDevolucao = { id: string; 'horarios_devolução': string }
type Turma = { id: string; serie: string }
type Local = { id: string; nome: string | null; categoria?: string; tipo?: string }
type Usuario = { id: string; nome: string; email: string }

type Referencias = {
  retirada: HorarioRetirada[]
  devolucao: HorarioDevolucao[]
  turmas: Turma[]
  locais: Local[]
  usuarios: Usuario[]
}

const REFERENCIAS_VAZIAS: Referencias = {
  retirada: [],
  devolucao: [],
  turmas: [],
  locais: [],
  usuarios: [],
}

type MetaPaginacao = {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

type RespostaPaginada<T> = {
  meta: MetaPaginacao
  lista: T[]
}

type Resumo = {
  total: number
  pendente: number
  emProgresso: number
  finalizado: number
  cancelado: number
  proximos: number
  proximoId: string | null
}

const META_INICIAL: MetaPaginacao = {
  total: 0,
  page: 1,
  limit: LIMITE_PAGINA,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
}

function hoje(): string {
  const agora = new Date()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${mes}-${dia}`
}

function amanha(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

function formatarData(valor: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return VAZIO
  return data.toLocaleDateString('pt-BR')
}

function indexar<T extends { id: string }>(
  itens: T[],
  extrair: (item: T) => string | null | undefined,
): Map<string, string> {
  const mapa = new Map<string, string>()
  for (const item of itens) {
    const valor = extrair(item)
    if (valor) mapa.set(item.id, valor)
  }
  return mapa
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function parseIso(iso: string): { ano: number; mes: number; dia: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  return { ano: Number(m[1]), mes: Number(m[2]) - 1, dia: Number(m[3]) }
}

function paraIso(ano: number, mes: number, dia: number): string {
  return `${String(ano).padStart(4, '0')}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

function buscarMeusAgendamentos(
  pagina: number,
  filtrosAtuais: { q: string; turma: string; local: string; status: string },
): Promise<RespostaPaginada<Agendamento>> {
  const params = new URLSearchParams()
  params.set('p', String(pagina))
  params.set('l', String(LIMITE_PAGINA))
  if (filtrosAtuais.q.trim()) params.set('q', filtrosAtuais.q.trim())
  if (filtrosAtuais.turma !== 'todos') params.set('turma', filtrosAtuais.turma)
  if (filtrosAtuais.local !== 'todos') params.set('local', filtrosAtuais.local)
  if (filtrosAtuais.status !== 'todos') params.set('status', filtrosAtuais.status)
  return getJson<RespostaPaginada<Agendamento>>(`usuario/meusAgendamentos?${params.toString()}`)
}

function MeuPainel() {
  const { usuario } = useAuth()

  const [referencias, setReferencias] = useState<Referencias>(REFERENCIAS_VAZIAS)
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [todos, setTodos] = useState<Agendamento[]>([])
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [meta, setMeta] = useState<MetaPaginacao>(META_INICIAL)
  const [page, setPage] = useState(1)
  const paginaDestinoRef = useRef<HTMLInputElement>(null)

  const [carregandoReferencias, setCarregandoReferencias] = useState(true)
  const [carregandoPagina, setCarregandoPagina] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  const [cancelandoId, setCancelandoId] = useState<string | null>(null)
  const [cancelamentoPendenteId, setCancelamentoPendenteId] = useState<string | null>(null)
  const [observacaoModal, setObservacaoModal] = useState<string | null>(null)
  const [gruposFechados, setGruposFechados] = useState<Set<string>>(new Set())

  const [busca, setBusca] = useState('')
  const [filtros, setFiltros] = useState({
    q: '',
    turma: 'todos',
    local: 'todos',
    status: 'todos',
  })

  const [diaSelecionado, setDiaSelecionado] = useState<string>(hoje())
  const [mesVisivel, setMesVisivel] = useState<{ ano: number; mes: number }>(() => {
    const h = parseIso(hoje())
    return h ? { ano: h.ano, mes: h.mes } : { ano: new Date().getFullYear(), mes: new Date().getMonth() }
  })

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      try {
        const [retirada, devolucao, turmas, locais, usuarios, resumoResp, todosResp] = await Promise.all([
          getJson<HorarioRetirada[]>('events/listHorario_ret'),
          getJson<HorarioDevolucao[]>('events/listHorario_devol'),
          getJson<Turma[]>('events/listTurmas'),
          getJson<Local[]>('events/listLocal'),
          getJson<Usuario[]>('events/listUsers'),
          getJson<Resumo>('usuario/resumoAgendamentos'),
          getJson<RespostaPaginada<Agendamento>>('usuario/meusAgendamentos?p=1&l=500'),
        ])
        if (cancelado) return
        setReferencias({ retirada, devolucao, turmas, locais, usuarios })
        setResumo(resumoResp)
        setTodos(todosResp.lista)
      } catch (falha) {
        if (cancelado) return
        setErroCarregamento(
          falha instanceof Error ? `não foi possível carregar seus dados: ${falha.message}` : 'não foi possível carregar seus dados',
        )
      } finally {
        if (!cancelado) setCarregandoReferencias(false)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [])

  useEffect(() => {
    let cancelado = false
    let ajustandoPagina = false

    buscarMeusAgendamentos(page, filtros)
      .then((resposta) => {
        if (cancelado) return
        if (resposta.lista.length === 0 && page > 1 && resposta.meta.totalPages > 0) {
          ajustandoPagina = true
          setPage(resposta.meta.totalPages)
          return
        }
        setAgendamentos(resposta.lista)
        setMeta(resposta.meta)
      })
      .catch((falha) => {
        if (cancelado) return
        setErroCarregamento(
          falha instanceof Error ? `não foi possível carregar seus agendamentos: ${falha.message}` : 'não foi possível carregar seus agendamentos',
        )
      })
      .finally(() => {
        if (!cancelado && !ajustandoPagina) setCarregandoPagina(false)
      })

    return () => {
      cancelado = true
    }
  }, [page, filtros])

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setFiltros((atual) => {
        if (atual.q === busca) return atual
        return { ...atual, q: busca }
      })
      setPage(1)
    }, 400)
    return () => clearTimeout(temporizador)
  }, [busca])

  useEffect(() => {
    if (!observacaoModal) return
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setObservacaoModal(null)
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [observacaoModal])

  useEffect(() => {
    if (!cancelamentoPendenteId) return
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setCancelamentoPendenteId(null)
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [cancelamentoPendenteId])

  const rotulos = {
    usuarios: indexar(referencias.usuarios, (u) => u.nome),
    turmas: indexar(referencias.turmas, (t) => t.serie),
    locais: indexar(referencias.locais, (item) => item.nome),
    retirada: indexar(referencias.retirada, (h) => h.horario_retirada),
    devolucao: indexar(referencias.devolucao, (h) => h['horarios_devolução']),
  }

  const rotuloDe = (mapa: Map<string, string>, id: string) => mapa.get(id) ?? VAZIO

  const linhas = agendamentos.map((agendamento) => {
    const observacao = agendamento.observacao?.trim()
    return {
      id: agendamento.id,
      protocolo: agendamento.id.slice(0, 8),
      dataIso: agendamento.date,
      data: formatarData(agendamento.date),
      retirada: rotuloDe(rotulos.retirada, agendamento.data_retirada),
      devolucao: rotuloDe(rotulos.devolucao, agendamento.data_devolucao),
      quantidade: agendamento.quantidade,
      turma: rotuloDe(rotulos.turmas, agendamento.turma),
      local: rotuloDe(rotulos.locais, agendamento.local_id),
      observacao: observacao ? observacao : VAZIO,
      status: agendamento.status ?? VAZIO,
      cancelado: agendamento.status === 'Cancelado',
      finalizado: agendamento.status === 'Finalizado',
    }
  })

  const grupos = Array.from(
    linhas.reduce((mapa, linha) => {
      if (!mapa.has(linha.dataIso)) mapa.set(linha.dataIso, [])
      mapa.get(linha.dataIso)!.push(linha)
      return mapa
    }, new Map<string, typeof linhas>()),
  )
    .map(([iso, itens]) => ({ iso, data: formatarData(iso), itens }))
    .sort((a, b) => b.iso.localeCompare(a.iso))

  function alternarGrupo(iso: string) {
    setGruposFechados((atual) => {
      const proximo = new Set(atual)
      if (proximo.has(iso)) proximo.delete(iso)
      else proximo.add(iso)
      return proximo
    })
  }

  function alternarTodosGrupos() {
    if (grupos.length === 0) return
    if (gruposFechados.size === grupos.length) {
      setGruposFechados(new Set())
    } else {
      setGruposFechados(new Set(grupos.map((grupo) => grupo.iso)))
    }
  }

  const contagemPorDia = todos.reduce((mapa, ag) => {
    mapa.set(ag.date, (mapa.get(ag.date) ?? 0) + 1)
    return mapa
  }, new Map<string, number>())

  const agendamentosDoDia = todos
    .filter((ag) => ag.date === diaSelecionado)
    .sort((a, b) => {
      const ra = rotulos.retirada.get(a.data_retirada) ?? ''
      const rb = rotulos.retirada.get(b.data_retirada) ?? ''
      return ra.localeCompare(rb)
    })

  const lembretes = todos
    .filter((ag) => ag.date >= hoje() && (ag.status === 'Pendente' || ag.status === 'Em progresso'))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)

  async function recarregarPaginaAtual() {
    setCarregandoPagina(true)
    try {
      const resposta = await buscarMeusAgendamentos(page, filtros)
      setAgendamentos(resposta.lista)
      setMeta(resposta.meta)
    } finally {
      setCarregandoPagina(false)
    }
  }

  async function recarregarPainel() {
    try {
      const [resumoResp, todosResp] = await Promise.all([
        getJson<Resumo>('usuario/resumoAgendamentos'),
        getJson<RespostaPaginada<Agendamento>>('usuario/meusAgendamentos?p=1&l=500'),
      ])
      setResumo(resumoResp)
      setTodos(todosResp.lista)
    } catch {
      // mantém dados anteriores
    }
  }

  async function cancelar(id: string) {
    setCancelandoId(id)
    setErroCarregamento(null)
    try {
      await postJson('usuario/cancelarAgendamento', { agendamento_id: id })
      await recarregarPaginaAtual()
      await recarregarPainel()
    } catch (falha) {
      setErroCarregamento(
        falha instanceof Error ? falha.message : 'não foi possível cancelar o agendamento',
      )
    } finally {
      setCancelandoId(null)
      setCancelamentoPendenteId(null)
    }
  }

  function irParaPagina(proxima: number) {
    const destino = Math.max(1, proxima)
    if (destino === page) return
    setCarregandoPagina(true)
    setPage(destino)
  }

  function pularParaPagina() {
    const numero = Number(paginaDestinoRef.current?.value ?? '')
    if (!Number.isFinite(numero)) return
    const destino = Math.min(meta.totalPages, Math.max(1, Math.trunc(numero)))
    irParaPagina(destino)
  }

  // calendário
  const primeiroDia = new Date(mesVisivel.ano, mesVisivel.mes, 1).getDay()
  const diasNoMes = new Date(mesVisivel.ano, mesVisivel.mes + 1, 0).getDate()
  const celulas: (number | null)[] = []
  for (let i = 0; i < primeiroDia; i++) celulas.push(null)
  for (let d = 1; d <= diasNoMes; d++) celulas.push(d)

  function selecionarDia(dia: number) {
    setDiaSelecionado(paraIso(mesVisivel.ano, mesVisivel.mes, dia))
  }

  function mesAnterior() {
    setMesVisivel((atual) => {
      const d = new Date(atual.ano, atual.mes - 1, 1)
      return { ano: d.getFullYear(), mes: d.getMonth() }
    })
  }

  function proximoMes() {
    setMesVisivel((atual) => {
      const d = new Date(atual.ano, atual.mes + 1, 1)
      return { ano: d.getFullYear(), mes: d.getMonth() }
    })
  }

  if (carregandoReferencias || (carregandoPagina && agendamentos.length === 0 && todos.length === 0)) {
    return <p className="meu-painel__aviso">Carregando seu painel...</p>
  }

  if (erroCarregamento && todos.length === 0) {
    return <p className="meu-painel__aviso meu-painel__aviso--erro">{erroCarregamento}</p>
  }

  const inicial = (usuario?.nome ?? 'U').trim().charAt(0).toUpperCase() || 'U'

  return (
    <section className="meu-painel">
      <header className="meu-painel__topo">
        <div className="meu-painel__identidade">
          <span className="meu-painel__avatar" aria-hidden="true">{inicial}</span>
          <div>
            <h1>Meus agendamentos</h1>
            <p>{usuario?.nome ?? 'Usuário'} · {usuario?.email ?? ''} · {usuario?.perfil ?? ''}</p>
          </div>
        </div>
        <div className="meu-painel__atalhos">
          <Link to="/agendar" className="meu-painel__botao">Novo agendamento</Link>
          <Link to="/agendamentos" className="meu-painel__botao meu-painel__botao--secundario">Ver todos</Link>
        </div>
      </header>

      {erroCarregamento && (
        <p className="meu-painel__alerta meu-painel__alerta--erro" role="alert">{erroCarregamento}</p>
      )}

      <div className="meu-painel__cards">
        <div className="meu-painel__card">
          <span>Total</span>
          <strong>{resumo?.total ?? todos.length}</strong>
        </div>
        <div className="meu-painel__card">
          <span>Pendentes</span>
          <strong>{resumo?.pendente ?? 0}</strong>
        </div>
        <div className="meu-painel__card">
          <span>Em progresso</span>
          <strong>{resumo?.emProgresso ?? 0}</strong>
        </div>
        <div className="meu-painel__card">
          <span>Finalizados</span>
          <strong>{resumo?.finalizado ?? 0}</strong>
        </div>
        <div className="meu-painel__card">
          <span>Cancelados</span>
          <strong>{resumo?.cancelado ?? 0}</strong>
        </div>
        <div className="meu-painel__card">
          <span>Próximos</span>
          <strong>{resumo?.proximos ?? lembretes.length}</strong>
        </div>
      </div>

      <div className="meu-painel__grade">
        <section className="meu-painel__bloco" aria-labelledby="lembretes-titulo">
          <h2 id="lembretes-titulo">Lembretes de próximos agendamentos</h2>
          {lembretes.length === 0 ? (
            <p className="meu-painel__vazio">Nenhum agendamento futuro. Crie um novo agendamento.</p>
          ) : (
            <ul className="meu-painel__lista-lembretes">
              {lembretes.map((ag) => {
                const ehHoje = ag.date === hoje()
                const ehAmanha = ag.date === amanha()
                return (
                  <li key={ag.id} className={`meu-painel__lembrete${ehHoje ? ' meu-painel__lembrete--hoje' : ''}`}>
                    <div>
                      <strong>{formatarData(ag.date)}</strong>
                      {ehHoje && <span className="meu-painel__etiqueta">Hoje</span>}
                      {ehAmanha && <span className="meu-painel__etiqueta">Amanhã</span>}
                    </div>
                    <div>
                      {rotuloDe(rotulos.retirada, ag.data_retirada)} – {rotuloDe(rotulos.devolucao, ag.data_devolucao)}
                    </div>
                    <div className="meu-painel__lembrete-detalhe">
                      {rotuloDe(rotulos.turmas, ag.turma)} · {rotuloDe(rotulos.locais, ag.local_id)} · {ag.quantidade} chromebooks
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="meu-painel__bloco" aria-labelledby="agenda-titulo">
          <h2 id="agenda-titulo">Agenda do professor</h2>
          <div className="meu-painel__calendario">
            <div className="meu-painel__calendario-cabecalho">
              <button type="button" onClick={mesAnterior} aria-label="Mês anterior">‹</button>
              <span>{MESES[mesVisivel.mes]} {mesVisivel.ano}</span>
              <button type="button" onClick={proximoMes} aria-label="Próximo mês">›</button>
            </div>
            <div className="meu-painel__grade-semana">
              {DIAS_SEMANA.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="meu-painel__grade-dias">
              {celulas.map((dia, i) => {
                if (dia === null) return <span key={`v-${i}`} className="meu-painel__dia meu-painel__dia--vazio" />
                const iso = paraIso(mesVisivel.ano, mesVisivel.mes, dia)
                const marcado = contagemPorDia.get(iso)
                const ehSelecionado = diaSelecionado === iso
                const ehHoje = iso === hoje()
                return (
                  <button
                    key={dia}
                    type="button"
                    className={`meu-painel__dia${ehSelecionado ? ' meu-painel__dia--selecionado' : ''}${ehHoje ? ' meu-painel__dia--hoje' : ''}`}
                    onClick={() => selecionarDia(dia)}
                  >
                    <span>{dia}</span>
                    {marcado ? <span className="meu-painel__marcador">{marcado}</span> : null}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="meu-painel__dia-detalhe">
            <h3>{formatarData(diaSelecionado)}</h3>
            {agendamentosDoDia.length === 0 ? (
              <p className="meu-painel__vazio">Nenhum agendamento neste dia.</p>
            ) : (
              <ul className="meu-painel__lista-dia">
                {agendamentosDoDia.map((ag) => (
                  <li key={ag.id}>
                    <strong>{rotuloDe(rotulos.retirada, ag.data_retirada)} – {rotuloDe(rotulos.devolucao, ag.data_devolucao)}</strong>
                    <span>{rotuloDe(rotulos.turmas, ag.turma)} · {rotuloDe(rotulos.locais, ag.local_id)} · {ag.quantidade} cb · {ag.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className="meu-painel__bloco" aria-labelledby="meus-agendamentos-titulo">
        <div className="meu-painel__secao-cabecalho">
          <h2 id="meus-agendamentos-titulo">Meus agendamentos</h2>
          {grupos.length > 0 && (
            <button
              type="button"
              className="meu-painel__toggle-todos"
              onClick={alternarTodosGrupos}
              title="minimizar/ampliar todos os agendamentos"
              aria-label={gruposFechados.size === grupos.length ? 'Expandir todos' : 'Minimizar todos'}
            >
              {gruposFechados.size === grupos.length ? '+' : '−'}
            </button>
          )}
        </div>
        <p className="meu-painel__descricao">
          {meta.total === 1 ? '1 agendamento registrado.' : `${meta.total} agendamentos registrados.`}
          {meta.totalPages > 1 ? ` Página ${meta.page} de ${meta.totalPages}.` : ''}
        </p>

        <div className="meu-painel__filtros">
          <label className="meu-painel__campo">
            <span>Buscar</span>
            <input
              type="search"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Nome ou protocolo"
            />
          </label>
          <label className="meu-painel__campo">
            <span>Turma</span>
            <select
              value={filtros.turma}
              onChange={(evento) => {
                setFiltros((atual) => ({ ...atual, turma: evento.target.value }))
                setPage(1)
              }}
            >
              <option value="todos">Todos</option>
              {referencias.turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.serie}
                </option>
              ))}
            </select>
          </label>
          <label className="meu-painel__campo">
            <span>Local</span>
            <select
              value={filtros.local}
              onChange={(evento) => {
                setFiltros((atual) => ({ ...atual, local: evento.target.value }))
                setPage(1)
              }}
            >
              <option value="todos">Todos</option>
              {referencias.locais.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome ?? 'Sem nome'}
                </option>
              ))}
            </select>
          </label>
          <label className="meu-painel__campo">
            <span>Status</span>
            <select
              value={filtros.status}
              onChange={(evento) => {
                setFiltros((atual) => ({ ...atual, status: evento.target.value }))
                setPage(1)
              }}
            >
              <option value="todos">Todos</option>
              <option value="Pendente">Pendente</option>
              <option value="Em progresso">Em progresso</option>
              <option value="Finalizado">Finalizado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </label>
        </div>

        {linhas.length === 0 ? (
          <p className="meu-painel__vazio">
            Nenhum agendamento registrado ainda. Crie o primeiro em <strong>Novo agendamento</strong>.
          </p>
        ) : (
          <div className="meu-painel__grupos">
            {grupos.map((grupo) => {
              const aberto = !gruposFechados.has(grupo.iso)
              return (
              <section key={grupo.iso} className="meu-painel__grupo">
                <button
                  type="button"
                  className="meu-painel__grupo-cabecalho"
                  aria-expanded={aberto}
                  onClick={() => alternarGrupo(grupo.iso)}
                >
                  <span className="meu-painel__grupo-data">{grupo.data}</span>
                  <span className="meu-painel__grupo-contagem">
                    {grupo.itens.length === 1 ? '1 agendamento' : `${grupo.itens.length} agendamentos`}
                  </span>
                  <span className="meu-painel__grupo-icone" aria-hidden="true">
                    {aberto ? '−' : '+'}
                  </span>
                </button>
                {aberto && (
                <div className="meu-painel__rolagem">
                  <table className="meu-painel__tabela">
                    <thead>
                      <tr>
                        <th scope="col">Quantidade</th>
                        <th scope="col">Turma</th>
                        <th scope="col">Retirada</th>
                        <th scope="col">Devolução</th>
                        <th scope="col">Local</th>
                        <th scope="col">Observação</th>
                        <th scope="col">Status</th>
                        <th scope="col">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.itens.map((linha) => (
                        <tr key={linha.id}>
                          <td data-label="Quantidade">{linha.quantidade}</td>
                          <td data-label="Turma">{linha.turma}</td>
                          <td data-label="Retirada">{linha.retirada}</td>
                          <td data-label="Devolução">{linha.devolucao}</td>
                          <td data-label="Local">{linha.local}</td>
                          <td data-label="Observação">
                            {linha.observacao === VAZIO ? (
                              VAZIO
                            ) : (
                              <button
                                type="button"
                                className="meu-painel__obs"
                                onClick={() => setObservacaoModal(linha.observacao)}
                                title={linha.observacao}
                              >
                                {linha.observacao.length > 24 ? `${linha.observacao.slice(0, 24)}…` : linha.observacao}
                              </button>
                            )}
                          </td>
                          <td data-label="Status">
                            <span className={`meu-painel__status${linha.cancelado ? ' meu-painel__status--cancelado' : ''}`}>
                              {linha.status}
                            </span>
                          </td>
                          <td data-label="Ações">
                            {!linha.cancelado && !linha.finalizado && (
                              <button
                                type="button"
                                className="meu-painel__cancelar"
                                disabled={cancelandoId === linha.id || carregandoPagina}
                                onClick={() => setCancelamentoPendenteId(linha.id)}
                              >
                                {cancelandoId === linha.id ? 'Cancelando…' : 'Cancelar'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </section>
            )
            })}
          </div>
        )}

        {meta.total > 0 && (
          <nav className="meu-painel__paginacao" aria-label="Paginação dos agendamentos">
            <button type="button" disabled={!meta.hasPrev || carregandoPagina} onClick={() => irParaPagina(1)}>
              Início
            </button>
            <button type="button" disabled={!meta.hasPrev || carregandoPagina} onClick={() => irParaPagina(page - 1)}>
              Anterior
            </button>
            <span>Página {meta.page} de {meta.totalPages || 1}</span>
            <button type="button" disabled={!meta.hasNext || carregandoPagina} onClick={() => irParaPagina(page + 1)}>
              Próxima
            </button>
            <div className="meu-painel__ir-pagina">
              <input
                ref={paginaDestinoRef}
                key={page}
                type="number"
                min={1}
                max={meta.totalPages || 1}
                defaultValue={page}
                disabled={carregandoPagina}
                onKeyDown={(evento) => {
                  if (evento.key === 'Enter') {
                    evento.preventDefault()
                    pularParaPagina()
                  }
                }}
                aria-label="Ir para página"
              />
              <button type="button" disabled={carregandoPagina} onClick={pularParaPagina}>
                Ir
              </button>
            </div>
          </nav>
        )}
      </section>

      {observacaoModal && (
        <div
          className="meu-painel__modal"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) setObservacaoModal(null)
          }}
        >
          <div className="meu-painel__modal-card" role="dialog" aria-modal="true">
            <div className="meu-painel__modal-cabecalho">
              <h2>Observação</h2>
              <button type="button" onClick={() => setObservacaoModal(null)} aria-label="Fechar">×</button>
            </div>
            <p>{observacaoModal}</p>
          </div>
        </div>
      )}

      {cancelamentoPendenteId && (
        <div
          className="meu-painel__modal"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) setCancelamentoPendenteId(null)
          }}
        >
          <div className="meu-painel__modal-card" role="dialog" aria-modal="true">
            <div className="meu-painel__modal-cabecalho">
              <h2>Cancelar agendamento</h2>
              <button type="button" onClick={() => setCancelamentoPendenteId(null)} aria-label="Fechar">×</button>
            </div>
            <p>Cancelar este agendamento e liberar o estoque do intervalo?</p>
            <div className="meu-painel__modal-acoes">
              <button
                type="button"
                className="meu-painel__botao meu-painel__botao--secundario"
                onClick={() => setCancelamentoPendenteId(null)}
                disabled={cancelandoId === cancelamentoPendenteId}
              >
                Voltar
              </button>
              <button
                type="button"
                className="meu-painel__botao"
                disabled={cancelandoId === cancelamentoPendenteId}
                onClick={() => cancelar(cancelamentoPendenteId)}
              >
                {cancelandoId === cancelamentoPendenteId ? 'Cancelando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default MeuPainel
