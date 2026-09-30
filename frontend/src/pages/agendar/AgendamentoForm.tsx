import { useEffect, useState, type FormEvent } from 'react'
import { API_BASE, getJson } from '../../lib/api.ts'
import './AgendamentoForm.css'

type Opcao = { id: string; rotulo: string }

type Opcoes = {
  retirada: Opcao[]
  devolucao: Opcao[]
  turmas: Opcao[]
  locais: Opcao[]
  usuarios: Opcao[]
}

type HorarioRetirada = { id: string; horario_retirada: string }
type HorarioDevolucao = { id: string; 'horarios_devolução': string }
type Turma = { id: string; serie: string }
type Local = { id: string; nome: string }
type Usuario = { id: string; nome: string; email: string }

type DadosFormulario = {
  usuario_id: string
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
  usuarios: [],
}

function hoje(): string {
  const agora = new Date()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${mes}-${dia}`
}

function dadosIniciais(): DadosFormulario {
  return {
    usuario_id: '',
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
  const [dados, setDados] = useState<DadosFormulario>(dadosIniciais)
  const [opcoes, setOpcoes] = useState<Opcoes>(OPCOES_VAZIAS)
  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<Sucesso | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      try {
        const [retirada, devolucao, turmas, locais, usuarios] = await Promise.all([
          getJson<HorarioRetirada[]>('events/listHorario_ret'),
          getJson<HorarioDevolucao[]>('events/listHorario_devol'),
          getJson<Turma[]>('events/listTurmas'),
          getJson<Local[]>('events/listLocal'),
          getJson<Usuario[]>('events/listUsers'),
        ])
        if (cancelado) return
        setOpcoes({
          retirada: retirada.map((horario) => ({ id: horario.id, rotulo: horario.horario_retirada })),
          devolucao: devolucao.map((horario) => ({ id: horario.id, rotulo: horario['horarios_devolução'] })),
          turmas: turmas.map((turma) => ({ id: turma.id, rotulo: turma.serie })),
          locais: locais.map((item) => ({ id: item.id, rotulo: item.nome })),
          usuarios: usuarios.map((usuario) => ({ id: usuario.id, rotulo: `${usuario.nome} (${usuario.email})` })),
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

  function validar(): string | null {
    if (!dados.usuario_id) return 'Selecione o usuário que vai retirar os chromebooks.'
    if (!dados.date) return 'Informe a data do agendamento.'
    if (!dados.data_retirada) return 'Selecione o horário de retirada.'
    if (!dados.data_devolucao) return 'Selecione o horário de devolução.'
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
      const resposta = await fetch(`${API_BASE}/usuario/NovoAgendamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: dados.usuario_id,
          date: dados.date,
          data_retirada: dados.data_retirada,
          data_devolucao: dados.data_devolucao,
          turma: dados.turma,
          Local: dados.Local,
          quantidade: Number(dados.quantidade),
          observacao: dados.observacao.trim(),
        }),
      })

      const corpo: { message?: string; agendamento_id?: string } | null = await resposta
        .json()
        .catch(() => null)

      if (!resposta.ok) {
        setErro(corpo?.message ?? `a API respondeu ${resposta.status} ao tentar o agendamento.`)
        return
      }

      setSucesso({
        texto: corpo?.message ?? 'Agendamento realizado com sucesso.',
        agendamentoId: corpo?.agendamento_id,
      })
      setDados(dadosIniciais())
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
    return <p className="agendamento-form__aviso">Carregando listas...</p>
  }

  if (erroCarregamento) {
    return <p className="agendamento-form__aviso agendamento-form__aviso--erro">{erroCarregamento}</p>
  }

  return (
    <section className="agendamento-form">
      <h1>Agendar retirada de chromebooks</h1>
      <p className="agendamento-form__descricao">
        Preencha os dados abaixo para reservar os equipamentos para a turma.
      </p>

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
        <Selecao
          id="usuario_id"
          rotulo="Usuário responsável"
          valor={dados.usuario_id}
          opcoes={opcoes.usuarios}
          vazio="Selecione o usuário"
          desabilitado={enviando}
          aoMudar={(valor) => atualizar('usuario_id', valor)}
        />

        <div className="linha">
          <div className="campo">
            <label htmlFor="date">Data do agendamento</label>
            <input
              id="date"
              type="date"
              value={dados.date}
              disabled={enviando}
              onChange={(evento) => atualizar('date', evento.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="quantidade">Quantidade de chromebooks</label>
            <input
              id="quantidade"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              placeholder="Ex.: 15"
              value={dados.quantidade}
              disabled={enviando}
              onChange={(evento) => atualizar('quantidade', evento.target.value)}
              required
            />
          </div>
        </div>

        <div className="linha">
          <Selecao
            id="data_retirada"
            rotulo="Horário de retirada"
            valor={dados.data_retirada}
            opcoes={opcoes.retirada}
            vazio="Selecione o horário"
            desabilitado={enviando}
            aoMudar={(valor) => atualizar('data_retirada', valor)}
          />

          <Selecao
            id="data_devolucao"
            rotulo="Horário de devolução"
            valor={dados.data_devolucao}
            opcoes={opcoes.devolucao}
            vazio="Selecione o horário"
            desabilitado={enviando}
            aoMudar={(valor) => atualizar('data_devolucao', valor)}
          />
        </div>

        <div className="linha">
          <Selecao
            id="turma"
            rotulo="Turma"
            valor={dados.turma}
            opcoes={opcoes.turmas}
            vazio="Selecione a turma"
            desabilitado={enviando}
            aoMudar={(valor) => atualizar('turma', valor)}
          />

          <Selecao
            id="Local"
            rotulo="Local"
            valor={dados.Local}
            opcoes={opcoes.locais}
            vazio="Selecione o local"
            desabilitado={enviando}
            aoMudar={(valor) => atualizar('Local', valor)}
          />
        </div>

        <div className="campo">
          <label htmlFor="observacao">Observação (opcional)</label>
          <textarea
            id="observacao"
            rows={3}
            maxLength={255}
            value={dados.observacao}
            disabled={enviando}
            onChange={(evento) => atualizar('observacao', evento.target.value)}
          />
        </div>

        <button type="submit" className="enviar" disabled={enviando}>
          {enviando ? 'Enviando...' : 'Confirmar agendamento'}
        </button>
      </form>
    </section>
  )
}

export default AgendamentoForm
