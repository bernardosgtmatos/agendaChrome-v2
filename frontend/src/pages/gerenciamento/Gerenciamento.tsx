import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import UserBar from '../../components/UserBar.tsx'
import { deleteJson, getJson, patchJson, postJson, type Perfil } from '../../lib/api.ts'
import { useAuth } from '../../lib/useAuth.ts'
import './Gerenciamento.css'

type UsuarioItem = {
  id: string
  nome: string
  email: string
  perfil: Perfil
  createdAt: string
}

type Turma = { id: string; serie: string }
type Local = { id: string; nome: string | null }
type Capacidade = { estoque_total: number }

type Modal =
  | { tipo: 'usuario'; usuario?: UsuarioItem }
  | { tipo: 'turma'; turma?: Turma }
  | { tipo: 'local'; local?: Local }
  | { tipo: 'capacidade' }

type FormUsuario = {
  nome: string
  email: string
  perfil: Perfil
  senha: string
}

const FORM_USUARIO_VAZIO: FormUsuario = {
  nome: '',
  email: '',
  perfil: 'Professor',
  senha: '',
}

function inicialDe(nome: string): string {
  const letra = nome.trim().charAt(0)
  return letra ? letra.toUpperCase() : '?'
}

function formatarData(valor: string | undefined): string {
  if (!valor) return '—'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return '—'
  return data.toLocaleDateString('pt-BR')
}

function dataParaFiltro(valor: string | undefined): string {
  if (!valor) return ''
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return ''
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

function IconeVoltar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function IconeTurma() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
    </svg>
  )
}

function IconeLocal() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function IconeLapis() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function IconeLixeira() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  )
}

function IconeMais() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function Gerenciamento() {
  const navigate = useNavigate()
  const { usuario: usuarioSessao } = useAuth()

  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [locais, setLocais] = useState<Local[]>([])
  const [capacidade, setCapacidade] = useState<number | null>(null)
  const [versao, setVersao] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [buscaNome, setBuscaNome] = useState('')
  const [buscaEmail, setBuscaEmail] = useState('')
  const [filtroData, setFiltroData] = useState('')

  const [modal, setModal] = useState<Modal | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [formUsuario, setFormUsuario] = useState<FormUsuario>(FORM_USUARIO_VAZIO)
  const [formTurma, setFormTurma] = useState('')
  const [formLocal, setFormLocal] = useState('')
  const [formCapacidade, setFormCapacidade] = useState('')

  useEffect(() => {
    let ativo = true

    Promise.all([
      getJson<UsuarioItem[]>('events/listUsers'),
      getJson<Turma[]>('events/listTurmas'),
      getJson<Local[]>('events/listLocal'),
      getJson<Capacidade>('admin/capacidade'),
    ])
      .then(([listaUsuarios, listaTurmas, listaLocais, configuracao]) => {
        if (!ativo) return
        setUsuarios(listaUsuarios)
        setTurmas(listaTurmas)
        setLocais(listaLocais)
        setCapacidade(configuracao.estoque_total)
      })
      .catch((falha) => {
        if (!ativo) return
        setErro(
          falha instanceof Error
            ? `Não foi possível carregar os dados: ${falha.message}`
            : 'Não foi possível carregar os dados da plataforma.',
        )
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [versao])

  useEffect(() => {
    if (!modal) return
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape' && !salvando) setModal(null)
    }

    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.body.style.overflow = overflowAnterior
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [modal, salvando])

  function limparAvisos() {
    setErro(null)
    setAviso(null)
  }

  function abrirNovoUsuario() {
    limparAvisos()
    setFormUsuario(FORM_USUARIO_VAZIO)
    setModal({ tipo: 'usuario' })
  }

  function abrirEditarUsuario(usuario: UsuarioItem) {
    limparAvisos()
    setFormUsuario({
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      senha: '',
    })
    setModal({ tipo: 'usuario', usuario })
  }

  function abrirNovaTurma() {
    limparAvisos()
    setFormTurma('')
    setModal({ tipo: 'turma' })
  }

  function abrirEditarTurma(turma: Turma) {
    limparAvisos()
    setFormTurma(turma.serie)
    setModal({ tipo: 'turma', turma })
  }

  function abrirNovoLocal() {
    limparAvisos()
    setFormLocal('')
    setModal({ tipo: 'local' })
  }

  function abrirEditarLocal(local: Local) {
    limparAvisos()
    setFormLocal(local.nome ?? '')
    setModal({ tipo: 'local', local })
  }

  function abrirCapacidade() {
    limparAvisos()
    setFormCapacidade(capacidade === null ? '' : String(capacidade))
    setModal({ tipo: 'capacidade' })
  }

  async function executarAcao(acao: () => Promise<unknown>, mensagem: string) {
    setSalvando(true)
    setErro(null)
    setAviso(null)
    try {
      await acao()
      setModal(null)
      setAviso(mensagem)
      setCarregando(true)
      setVersao((atual) => atual + 1)
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível concluir a ação.')
    } finally {
      setSalvando(false)
    }
  }

  async function salvarUsuario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (modal?.tipo !== 'usuario') return
    const nome = formUsuario.nome.trim()
    const email = formUsuario.email.trim()
    if (!nome || !email) {
      setErro('Informe nome e email do usuário.')
      return
    }
    if (!modal.usuario && !formUsuario.senha) {
      setErro('Informe uma senha para o novo usuário.')
      return
    }
    const corpo = {
      nome,
      email,
      ...(modal.usuario ? {} : { perfil: formUsuario.perfil }),
      ...(formUsuario.senha ? { senha: formUsuario.senha } : {}),
    }
    const acao = modal.usuario
      ? () => patchJson(`admin/usuarios/${modal.usuario!.id}`, corpo)
      : () => postJson('admin/usuarios', corpo)
    await executarAcao(
      acao,
      modal.usuario ? 'Usuário atualizado com sucesso.' : 'Usuário criado com sucesso.',
    )
  }

  async function salvarTurma(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (modal?.tipo !== 'turma') return
    const serie = formTurma.trim()
    if (!serie) {
      setErro('Informe o nome da turma.')
      return
    }
    const acao = modal.turma
      ? () => patchJson(`admin/turmas/${modal.turma!.id}`, { nome: serie })
      : () => postJson('admin/turmas', { serie })
    await executarAcao(
      acao,
      modal.turma ? 'Turma atualizada com sucesso.' : 'Turma criada com sucesso.',
    )
  }

  async function salvarLocal(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (modal?.tipo !== 'local') return
    const nome = formLocal.trim()
    if (!nome) {
      setErro('Informe o nome do local.')
      return
    }
    const acao = modal.local
      ? () => patchJson(`admin/locais/${modal.local!.id}`, { nome })
      : () => postJson('admin/locais', { nome })
    await executarAcao(
      acao,
      modal.local ? 'Local atualizado com sucesso.' : 'Local criado com sucesso.',
    )
  }

  async function salvarCapacidade(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (modal?.tipo !== 'capacidade') return
    const total = Number(formCapacidade)
    if (!Number.isInteger(total) || total < 1) {
      setErro('Informe um número inteiro maior que zero.')
      return
    }
    await executarAcao(
      () => patchJson('admin/capacidade', { estoque_total: total }),
      'Capacidade atualizada com sucesso.',
    )
  }

  async function excluirUsuario(usuario: UsuarioItem) {
    if (!window.confirm(`Excluir o usuário "${usuario.nome}"?`)) return
    await executarAcao(
      () => deleteJson(`admin/usuarios/${usuario.id}`),
      'Usuário excluído com sucesso.',
    )
  }

  async function excluirTurma(turma: Turma) {
    if (!window.confirm(`Excluir a turma "${turma.serie}"?`)) return
    await executarAcao(
      () => deleteJson(`admin/turmas/${turma.id}`),
      'Turma excluída com sucesso.',
    )
  }

  async function excluirLocal(local: Local) {
    const nome = local.nome ?? 'sem nome'
    if (!window.confirm(`Excluir o local "${nome}"?`)) return
    await executarAcao(
      () => deleteJson(`admin/locais/${local.id}`),
      'Local excluído com sucesso.',
    )
  }

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const nomeOk = usuario.nome.toLowerCase().includes(buscaNome.trim().toLowerCase())
    const emailOk = usuario.email.toLowerCase().includes(buscaEmail.trim().toLowerCase())
    const dataOk = !filtroData || dataParaFiltro(usuario.createdAt) === filtroData
    return nomeOk && emailOk && dataOk
  })

  const semDados = usuarios.length === 0 && turmas.length === 0 && locais.length === 0 && capacidade === null

  const tituloModal = modal
    ? modal.tipo === 'usuario'
      ? modal.usuario
        ? 'Editar usuário'
        : 'Novo usuário'
      : modal.tipo === 'turma'
        ? modal.turma
          ? 'Editar turma'
          : 'Nova turma'
        : modal.tipo === 'local'
          ? modal.local
            ? 'Editar local'
            : 'Novo local'
          : 'Alterar capacidade'
    : ''

  return (
    <main className="gerenciamento">
      <header className="gerenciamento__topo">
        <button
          type="button"
          className="gerenciamento__voltar"
          onClick={() => navigate('/agendar')}
        >
          <IconeVoltar />
          Voltar
        </button>
        <UserBar />
      </header>

      {aviso && (
        <p className="gerenciamento__alerta gerenciamento__alerta--sucesso" role="status">
          {aviso}
        </p>
      )}
      {erro && !semDados && (
        <p className="gerenciamento__alerta gerenciamento__alerta--erro" role="alert">
          {erro}
        </p>
      )}

      {carregando && semDados ? (
        <p className="gerenciamento__aviso">Carregando dados da plataforma...</p>
      ) : erro && semDados ? (
        <p className="gerenciamento__aviso gerenciamento__aviso--erro">{erro}</p>
      ) : (
        <div className="gerenciamento__grid">
          <section className="gerenciamento-card gerenciamento-card--usuarios" aria-labelledby="usuarios-titulo">
            <div className="gerenciamento-card__cabecalho">
              <div>
                <h1 id="usuarios-titulo">Gerenciar Usuários</h1>
                <p>Cadastre e visualize os usuários do sistema</p>
              </div>
              <button type="button" className="gerenciamento__botao" onClick={abrirNovoUsuario}>
                + Novo Usuário
              </button>
            </div>

            <p className="gerenciamento-card__total">
              Total de usuários cadastrados: <strong>{usuarios.length}</strong>
            </p>

            <div className="gerenciamento-filtros">
              <label className="gerenciamento-campo">
                <span>Buscar por nome</span>
                <input
                  type="search"
                  value={buscaNome}
                  onChange={(evento) => setBuscaNome(evento.target.value)}
                  placeholder="Digite o nome..."
                />
              </label>
              <label className="gerenciamento-campo">
                <span>Buscar por email</span>
                <input
                  type="search"
                  value={buscaEmail}
                  onChange={(evento) => setBuscaEmail(evento.target.value)}
                  placeholder="Digite o email..."
                />
              </label>
              <label className="gerenciamento-campo">
                <span>Filtrar por data de cadastro</span>
                <input
                  type="date"
                  value={filtroData}
                  onChange={(evento) => setFiltroData(evento.target.value)}
                />
              </label>
            </div>

            <div className="gerenciamento-tabela__rolagem">
              <table className="gerenciamento-tabela">
                <thead>
                  <tr>
                    <th scope="col">Nome</th>
                    <th scope="col">Email</th>
                    <th scope="col">Perfil</th>
                    <th scope="col">Cadastro</th>
                    <th scope="col">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="gerenciamento-tabela__vazia">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((usuario) => (
                      <tr key={usuario.id}>
                        <td>
                          <span className="gerenciamento-usuario">
                            <span className="gerenciamento-avatar" aria-hidden="true">
                              {inicialDe(usuario.nome)}
                            </span>
                            <strong>{usuario.nome}</strong>
                          </span>
                        </td>
                        <td>{usuario.email}</td>
                        <td>
                          <span className="gerenciamento-perfil">{usuario.perfil}</span>
                        </td>
                        <td>{formatarData(usuario.createdAt)}</td>
                        <td>
                          <div className="gerenciamento-acoes">
                            <button
                              type="button"
                              className="gerenciamento-acao"
                              onClick={() => abrirEditarUsuario(usuario)}
                            >
                              Editar
                            </button>
                            {usuario.id !== usuarioSessao?.id && (
                              <button
                                type="button"
                                className="gerenciamento-acao gerenciamento-acao--perigo"
                                onClick={() => excluirUsuario(usuario)}
                              >
                                <IconeLixeira />
                                Excluir
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="gerenciamento-card gerenciamento-card--lateral" aria-label="Gerenciamento de turmas, capacidade e locais">
            <div className="gerenciamento-secao">
              <h2>Gerenciar Turmas</h2>
              <p>Adicione, edite ou remova turmas do sistema</p>

              <div className="gerenciamento-secao__linha">
                <span>
                  Total de turmas cadastradas: <strong>{turmas.length}</strong>
                </span>
                <button type="button" className="gerenciamento__botao" onClick={abrirNovaTurma}>
                  + Nova Turma
                </button>
              </div>

              {turmas.length === 0 ? (
                <p className="gerenciamento-lista__vazio">Nenhuma turma cadastrada ainda.</p>
              ) : (
                <ul className="gerenciamento-lista gerenciamento-lista--rolagem">
                  {turmas.map((turma) => (
                    <li key={turma.id} className="gerenciamento-lista__item">
                      <span className="gerenciamento-lista__icone" aria-hidden="true">
                        <IconeTurma />
                      </span>
                      <span className="gerenciamento-lista__nome">{turma.serie}</span>
                      <div className="gerenciamento-lista__acoes">
                        <button
                          type="button"
                          className="gerenciamento-icone-acao"
                          onClick={() => abrirEditarTurma(turma)}
                          aria-label={`Editar turma ${turma.serie}`}
                        >
                          <IconeLapis />
                        </button>
                        <button
                          type="button"
                          className="gerenciamento-icone-acao gerenciamento-icone-acao--perigo"
                          onClick={() => excluirTurma(turma)}
                          aria-label={`Excluir turma ${turma.serie}`}
                        >
                          <IconeLixeira />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="gerenciamento-secao gerenciamento-secao--capacidade">
              <h2>Gerenciar Capacidade</h2>
              <p>Quantidade de Chromebooks</p>
              <div className="gerenciamento-capacidade">
                <strong>{capacidade ?? '—'}</strong>
                <button type="button" className="gerenciamento__botao-contorno" onClick={abrirCapacidade}>
                  Alterar
                </button>
              </div>
            </div>

            <div className="gerenciamento-secao gerenciamento-secao--locais">
              <div className="gerenciamento-secao__titulo-linha">
                <h2>Gerenciar Locais</h2>
                <button
                  type="button"
                  className="gerenciamento__botao-mais"
                  onClick={abrirNovoLocal}
                  aria-label="Novo local"
                >
                  <IconeMais />
                </button>
              </div>

              {locais.length === 0 ? (
                <div className="gerenciamento-locais__vazio">
                  Nenhum local cadastrado ainda. Use o botão + para adicionar.
                </div>
              ) : (
                <ul className="gerenciamento-lista gerenciamento-lista--locais">
                  {locais.map((local) => (
                    <li key={local.id} className="gerenciamento-lista__item">
                      <span className="gerenciamento-lista__icone" aria-hidden="true">
                        <IconeLocal />
                      </span>
                      <span className="gerenciamento-lista__nome">{local.nome ?? 'Sem nome'}</span>
                      <div className="gerenciamento-lista__acoes">
                        <button
                          type="button"
                          className="gerenciamento-icone-acao"
                          onClick={() => abrirEditarLocal(local)}
                          aria-label={`Editar local ${local.nome ?? ''}`}
                        >
                          <IconeLapis />
                        </button>
                        <button
                          type="button"
                          className="gerenciamento-icone-acao gerenciamento-icone-acao--perigo"
                          onClick={() => excluirLocal(local)}
                          aria-label={`Excluir local ${local.nome ?? ''}`}
                        >
                          <IconeLixeira />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}

      {modal && (
        <div
          className="gerenciamento-modal"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget && !salvando) setModal(null)
          }}
        >
          <div
            className="gerenciamento-modal__card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gerenciamento-modal-titulo"
          >
            <div className="gerenciamento-modal__cabecalho">
              <h2 id="gerenciamento-modal-titulo">{tituloModal}</h2>
              <button
                type="button"
                className="gerenciamento-modal__fechar"
                onClick={() => setModal(null)}
                disabled={salvando}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            {erro && (
              <p className="gerenciamento-modal__erro" role="alert">
                {erro}
              </p>
            )}

            {modal.tipo === 'usuario' && (
              <form className="gerenciamento-form" onSubmit={salvarUsuario}>
                <label className="gerenciamento-campo gerenciamento-campo--modal">
                  <span>Nome*</span>
                  <input
                    value={formUsuario.nome}
                    onChange={(evento) =>
                      setFormUsuario((atual) => ({ ...atual, nome: evento.target.value }))
                    }
                    placeholder="Nome do usuário"
                    disabled={salvando}
                    required
                  />
                </label>
                <label className="gerenciamento-campo gerenciamento-campo--modal">
                  <span>Email*</span>
                  <input
                    type="email"
                    value={formUsuario.email}
                    onChange={(evento) =>
                      setFormUsuario((atual) => ({ ...atual, email: evento.target.value }))
                    }
                    placeholder="usuario@escola.com"
                    disabled={salvando}
                    required
                  />
                </label>
                {!modal.usuario && (
                  <label className="gerenciamento-campo gerenciamento-campo--modal">
                    <span>Perfil*</span>
                    <select
                      value={formUsuario.perfil}
                      onChange={(evento) =>
                        setFormUsuario((atual) => ({
                          ...atual,
                          perfil: evento.target.value as Perfil,
                        }))
                      }
                      disabled={salvando}
                    >
                      <option value="Professor">Professor</option>
                      <option value="Coordenador">Coordenador</option>
                    </select>
                  </label>
                )}
                <label className="gerenciamento-campo gerenciamento-campo--modal">
                  <span>{modal.usuario ? 'Nova senha' : 'Senha*'}</span>
                  <input
                    type="password"
                    value={formUsuario.senha}
                    onChange={(evento) =>
                      setFormUsuario((atual) => ({ ...atual, senha: evento.target.value }))
                    }
                    placeholder={modal.usuario ? 'Deixe em branco para manter' : 'Senha de acesso'}
                    disabled={salvando}
                    required={!modal.usuario}
                  />
                </label>
                <div className="gerenciamento-modal__acoes">
                  <button
                    type="button"
                    className="gerenciamento__botao-contorno"
                    onClick={() => setModal(null)}
                    disabled={salvando}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="gerenciamento__botao" disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            )}

            {modal.tipo === 'turma' && (
              <form className="gerenciamento-form" onSubmit={salvarTurma}>
                <label className="gerenciamento-campo gerenciamento-campo--modal">
                  <span>Nome da turma*</span>
                  <input
                    value={formTurma}
                    onChange={(evento) => setFormTurma(evento.target.value)}
                    placeholder="Ex: 1º Ano EM"
                    disabled={salvando}
                    required
                  />
                </label>
                <div className="gerenciamento-modal__acoes">
                  <button
                    type="button"
                    className="gerenciamento__botao-contorno"
                    onClick={() => setModal(null)}
                    disabled={salvando}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="gerenciamento__botao" disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            )}

            {modal.tipo === 'local' && (
              <form className="gerenciamento-form" onSubmit={salvarLocal}>
                <label className="gerenciamento-campo gerenciamento-campo--modal">
                  <span>Nome do local*</span>
                  <input
                    value={formLocal}
                    onChange={(evento) => setFormLocal(evento.target.value)}
                    placeholder="Ex: Biblioteca"
                    disabled={salvando}
                    required
                  />
                </label>
                <div className="gerenciamento-modal__acoes">
                  <button
                    type="button"
                    className="gerenciamento__botao-contorno"
                    onClick={() => setModal(null)}
                    disabled={salvando}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="gerenciamento__botao" disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            )}

            {modal.tipo === 'capacidade' && (
              <form className="gerenciamento-form" onSubmit={salvarCapacidade}>
                <label className="gerenciamento-campo gerenciamento-campo--modal">
                  <span>Quantidade de Chromebooks*</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={formCapacidade}
                    onChange={(evento) => setFormCapacidade(evento.target.value)}
                    placeholder="36"
                    disabled={salvando}
                    required
                  />
                </label>
                <div className="gerenciamento-modal__acoes">
                  <button
                    type="button"
                    className="gerenciamento__botao-contorno"
                    onClick={() => setModal(null)}
                    disabled={salvando}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="gerenciamento__botao" disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

export default Gerenciamento
