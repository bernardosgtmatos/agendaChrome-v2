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

function buscarAgendamentos(pagina: number): Promise<RespostaPaginada<Agendamento>> {
  return getJson<RespostaPaginada<Agendamento>>(
    `events/listAgend?p=${pagina}&l=${LIMITE_PAGINA}`,
  )
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

    buscarAgendamentos(page)
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
  }, [page])

  async function recarregarPaginaAtual() {
    setCarregandoPagina(true)
    try {
      const resposta = await buscarAgendamentos(page)
      setAgendamentos(resposta.lista)
      setMeta(resposta.meta)
    } finally {
      setCarregandoPagina(false)
    }
  }

  async function cancelar(id: string) {
    if (!window.confirm('Cancelar este agendamento e liberar o estoque do intervalo?')) return
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
    }
  }

  function irParaPagina(proxima: number) {
    const destino = Math.max(1, proxima)
    if (destino === page) return
    setCarregandoPagina(true)
    setPage(destino)
  }

  const rotulos = {
    usuarios: indexar(referencias.usuarios, (usuario) => `${usuario.nome} (${usuario.email})`),
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
    }
  })

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

      {linhas.length === 0 ? (
        <p className="agendamento-lista__vazio">
          Nenhum agendamento registrado ainda. Crie o primeiro em <strong>Novo agendamento</strong>.
        </p>
      ) : (
        <div className="agendamento-lista__rolagem">
          <table className="agendamento-lista__tabela">
            <thead>
              <tr>
                <th scope="col">Protocolo</th>
                <th scope="col">Data</th>
                <th scope="col">Retirada</th>
                <th scope="col">Devolução</th>
                <th scope="col">Quantidade</th>
                <th scope="col">Turma</th>
                <th scope="col">Local</th>
                <th scope="col">Solicitante</th>
                <th scope="col">Observação</th>
                <th scope="col">Status</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha) => (
                <tr key={linha.id}>
                  <td className="agendamento-lista__protocolo" title={linha.id}>
                    {linha.protocolo}
                  </td>
                  <td>{linha.data}</td>
                  <td>{linha.retirada}</td>
                  <td>{linha.devolucao}</td>
                  <td>{linha.quantidade}</td>
                  <td>{linha.turma}</td>
                  <td>{linha.local}</td>
                  <td>{linha.solicitante}</td>
                  <td>{linha.observacao}</td>
                  <td>{linha.status}</td>
                  <td>
                    {!linha.cancelado && (
                      <button
                        type="button"
                        disabled={cancelandoId === linha.id || carregandoPagina}
                        onClick={() => cancelar(linha.id)}
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
