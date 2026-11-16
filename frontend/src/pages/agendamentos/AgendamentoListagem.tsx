import { useEffect, useState } from 'react'
import { getJson, postJson } from '../../lib/api.ts'
import './AgendamentoListagem.css'

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
}

type HorarioRetirada = { id: string; horario_retirada: string }
type HorarioDevolucao = { id: string; 'horarios_devolução': string }
type Turma = { id: string; serie: string }
type Local = { id: string; nome: string | null }
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

const META_INICIAL: MetaPaginacao = {
  total: 0,
  page: 1,
  limit: LIMITE_PAGINA,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
}

function buscarAgendamentos(
  pagina: number,
  filtrosAtuais: { q: string; solicitante: string; turma: string; local: string; status: string },
): Promise<RespostaPaginada<Agendamento>> {
  const params = new URLSearchParams()
  params.set('p', String(pagina))
  params.set('l', String(LIMITE_PAGINA))
  if (filtrosAtuais.q.trim()) params.set('q', filtrosAtuais.q.trim())
  if (filtrosAtuais.solicitante !== 'todos') params.set('solicitante', filtrosAtuais.solicitante)
  if (filtrosAtuais.turma !== 'todos') params.set('turma', filtrosAtuais.turma)
  if (filtrosAtuais.local !== 'todos') params.set('local', filtrosAtuais.local)
  if (filtrosAtuais.status !== 'todos') params.set('status', filtrosAtuais.status)
  return getJson<RespostaPaginada<Agendamento>>(`events/listAgend?${params.toString()}`)
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

function formatarData(valor: string): string {
  // date é DATEONLY (YYYY-MM-DD). Evita new Date() que desloca por timezone.
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return VAZIO
  return data.toLocaleDateString('pt-BR')
}

function AgendamentoListagem() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [referencias, setReferencias] = useState<Referencias>(REFERENCIAS_VAZIAS)
  const [meta, setMeta] = useState<MetaPaginacao>(META_INICIAL)
  const [page, setPage] = useState(1)
  const [carregandoReferencias, setCarregandoReferencias] = useState(true)
  const [carregandoPagina, setCarregandoPagina] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)
  const [cancelandoId, setCancelandoId] = useState<string | null>(null)
  const [gruposFechados, setGruposFechados] = useState<Set<string>>(new Set())
  const [observacaoModal, setObservacaoModal] = useState<string | null>(null)
  const [cancelamentoPendenteId, setCancelamentoPendenteId] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [filtros, setFiltros] = useState({
    q: '',
    solicitante: 'todos',
    turma: 'todos',
    local: 'todos',
    status: 'todos',
  })

  useEffect(() => {
    let cancelado = false

    async function carregarReferencias() {
      try {
        const [retirada, devolucao, turmas, locais, usuarios] = await Promise.all([
          getJson<HorarioRetirada[]>('events/listHorario_ret'),
          getJson<HorarioDevolucao[]>('events/listHorario_devol'),
          getJson<Turma[]>('events/listTurmas'),
          getJson<Local[]>('events/listLocal'),
          getJson<Usuario[]>('events/listUsers'),
        ])
        if (cancelado) return
        setReferencias({ retirada, devolucao, turmas, locais, usuarios })
      } catch (falha) {
        if (cancelado) return
        setErroCarregamento(
          falha instanceof Error
            ? `não foi possível carregar as referências: ${falha.message}`
            : 'não foi possível carregar as referências',
        )
      } finally {
        if (!cancelado) setCarregandoReferencias(false)
      }
    }

    carregarReferencias()
    return () => {
      cancelado = true
    }
  }, [])

  useEffect(() => {
    let cancelado = false
    let ajustandoPagina = false

    buscarAgendamentos(page, filtros)
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
          falha instanceof Error
            ? `não foi possível carregar os agendamentos: ${falha.message}`
            : 'não foi possível carregar os agendamentos',
        )
      })
      .finally(() => {
        if (!cancelado && !ajustandoPagina) setCarregandoPagina(false)
      })

    return () => {
      cancelado = true
    }
  }, [page, filtros])

  async function recarregarPaginaAtual() {
    setCarregandoPagina(true)
    try {
      const resposta = await buscarAgendamentos(page, filtros)
      setAgendamentos(resposta.lista)
      setMeta(resposta.meta)
    } finally {
      setCarregandoPagina(false)
    }
  }

  async function cancelar(id: string) {
    setCancelandoId(id)
    setErroCarregamento(null)
    try {
      await postJson('usuario/cancelarAgendamento', { agendamento_id: id })
      await recarregarPaginaAtual()
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

  const rotulos = {
    usuarios: indexar(referencias.usuarios, (usuario) => usuario.nome),
    turmas: indexar(referencias.turmas, (turma) => turma.serie),
    locais: indexar(referencias.locais, (item) => item.nome),
    retirada: indexar(referencias.retirada, (horario) => horario.horario_retirada),
    devolucao: indexar(referencias.devolucao, (horario) => horario['horarios_devolução']),
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
      solicitante: rotuloDe(rotulos.usuarios, agendamento.usuario_id),
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

  if (carregandoReferencias || (carregandoPagina && agendamentos.length === 0)) {
    return <p className="agendamento-lista__aviso">Carregando agendamentos...</p>
  }

  if (erroCarregamento) {
    return <p className="agendamento-lista__aviso agendamento-lista__aviso--erro">{erroCarregamento}</p>
  }

  return (
    <section className="agendamento-lista">
      <h1>Agendamentos</h1>
      <p className="agendamento-lista__descricao">
        {meta.total === 1
          ? '1 agendamento registrado.'
          : `${meta.total} agendamentos registrados.`}
        {meta.totalPages > 1 ? ` Página ${meta.page} de ${meta.totalPages}.` : ''}
      </p>

      <div className="agendamento-lista__filtros">
        <label className="agendamento-campo">
          <span>Buscar</span>
          <input
            type="search"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Nome ou protocolo"
          />
        </label>
        <label className="agendamento-campo">
          <span>Solicitante</span>
          <select
            value={filtros.solicitante}
            onChange={(evento) => {
              setFiltros((atual) => ({ ...atual, solicitante: evento.target.value }))
              setPage(1)
            }}
          >
            <option value="todos">Todos</option>
            {referencias.usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="agendamento-campo">
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
        <label className="agendamento-campo">
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
        <label className="agendamento-campo">
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
        <p className="agendamento-lista__vazio">
          Nenhum agendamento registrado ainda. Crie o primeiro em <strong>Novo agendamento</strong>.
        </p>
      ) : (
        <div className="agendamento-lista__grupos">
          {grupos.map((grupo) => {
            const aberto = !gruposFechados.has(grupo.iso)
            return (
              <section key={grupo.iso} className="agendamento-grupo">
                <button
                  type="button"
                  className="agendamento-grupo__cabecalho"
                  aria-expanded={aberto}
                  onClick={() => alternarGrupo(grupo.iso)}
                >
                  <span className="agendamento-grupo__data">{grupo.data}</span>
                  <span className="agendamento-grupo__contagem">
                    {grupo.itens.length === 1
                      ? '1 agendamento'
                      : `${grupo.itens.length} agendamentos`}
                  </span>
                  <span className="agendamento-grupo__icone" aria-hidden="true">
                    {aberto ? '−' : '+'}
                  </span>
                </button>

                {aberto && (
                  <div className="agendamento-grupo__painel">
                    <div className="agendamento-grupo__rolagem">
                      <table className="agendamento-grupo__tabela">
                        <thead>
                          <tr>
                            <th scope="col">Solicitante</th>
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
                               <td data-label="Solicitante">
                                 <span className="agendamento-grupo__solicitante">
                                   {linha.solicitante}
                                 </span>
                               </td>
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
                                     className="agendamento-grupo__obs"
                                     onClick={() => setObservacaoModal(linha.observacao)}
                                     title={linha.observacao}
                                   >
                                     {linha.observacao.length > 28
                                       ? `${linha.observacao.slice(0, 28)}…`
                                       : linha.observacao}
                                     <span className="agendamento-grupo__obs-ver">ver mais</span>
                                   </button>
                                 )}
                               </td>
                               <td data-label="Status">
                                 <span
                                   className={`agendamento-grupo__status${
                                     linha.cancelado
                                       ? ' agendamento-grupo__status--cancelado'
                                       : ''
                                   }`}
                                 >
                                   {linha.status}
                                 </span>
                               </td>
                                <td data-label="Ações">
                                  {!linha.cancelado && !linha.finalizado && (
                                   <button
                                     type="button"
                                     className="agendamento-grupo__cancelar"
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
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {observacaoModal && (
        <div
          className="agendamento-obs-modal"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) setObservacaoModal(null)
          }}
        >
          <div
            className="agendamento-obs-modal__card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agendamento-obs-titulo"
          >
            <div className="agendamento-obs-modal__cabecalho">
              <h2 id="agendamento-obs-titulo">Observação</h2>
              <button
                type="button"
                className="agendamento-obs-modal__fechar"
                onClick={() => setObservacaoModal(null)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <p className="agendamento-obs-modal__texto">{observacaoModal}</p>
          </div>
        </div>
      )}

      {cancelamentoPendenteId && (
        <div
          className="agendamento-cancelar-modal"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) setCancelamentoPendenteId(null)
          }}
        >
          <div
            className="agendamento-cancelar-modal__card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agendamento-cancelar-titulo"
          >
            <h2 id="agendamento-cancelar-titulo">Cancelar agendamento</h2>
            <p className="agendamento-cancelar-modal__texto">
              Cancelar este agendamento e liberar o estoque do intervalo?
            </p>
            <div className="agendamento-cancelar-modal__acoes">
              <button
                type="button"
                className="agendamento-cancelar-modal__botao agendamento-cancelar-modal__botao--secundario"
                onClick={() => setCancelamentoPendenteId(null)}
                disabled={cancelandoId === cancelamentoPendenteId}
              >
                Voltar
              </button>
              <button
                type="button"
                className="agendamento-cancelar-modal__botao agendamento-cancelar-modal__botao--confirmar"
                disabled={cancelandoId === cancelamentoPendenteId}
                onClick={() => cancelar(cancelamentoPendenteId)}
              >
                {cancelandoId === cancelamentoPendenteId ? 'Cancelando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

       {meta.total > 0 && (
        <nav className="agendamento-lista__paginacao" aria-label="Paginação dos agendamentos">
          <button
            type="button"
            disabled={!meta.hasPrev || carregandoPagina}
            onClick={() => irParaPagina(1)}
          >
            Voltar para o início
          </button>
          <button
            type="button"
            disabled={!meta.hasPrev || carregandoPagina}
            onClick={() => irParaPagina(page - 1)}
          >
            Anterior
          </button>
          <span className="agendamento-lista__pagina">
            Página {meta.page} de {meta.totalPages || 1}
          </span>
          <button
            type="button"
            disabled={!meta.hasNext || carregandoPagina}
            onClick={() => irParaPagina(page + 1)}
          >
            Próxima
          </button>
        </nav>
      )}
    </section>
  )
}

export default AgendamentoListagem
