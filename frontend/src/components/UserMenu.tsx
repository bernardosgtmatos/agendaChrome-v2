import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { patchJson } from '../lib/api.ts'
import { useAuth } from '../lib/useAuth.ts'
import './UserMenu.css'

function IconeEngrenagem() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function IconeConfiguracoes() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function IconeGerenciar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function IconeSair() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

function UserMenu() {
  const { usuario, sair } = useAuth()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)
  const [configAberto, setConfigAberto] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erroSenha, setErroSenha] = useState<string | null>(null)
  const [sucessoSenha, setSucessoSenha] = useState<string | null>(null)
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  const botaoRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLElement>(null)
  const campoAtualRef = useRef<HTMLInputElement>(null)
  const menuEstavaAberto = useRef(false)

  const inicial = (usuario?.nome ?? 'U').trim().charAt(0).toUpperCase() || 'U'

  useEffect(() => {
    if (menuAberto) {
      menuEstavaAberto.current = true
      const timer = window.setTimeout(() => {
        menuRef.current?.querySelector<HTMLButtonElement>('.user-menu__fechar')?.focus()
      }, 0)
      return () => window.clearTimeout(timer)
    }
    if (menuEstavaAberto.current && !configAberto) {
      menuEstavaAberto.current = false
      botaoRef.current?.focus()
    }
  }, [menuAberto, configAberto])

  useEffect(() => {
    if (!configAberto) return
    const timer = window.setTimeout(() => campoAtualRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [configAberto])

  useEffect(() => {
    if (!menuAberto && !configAberto) return
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflowAnterior
    }
  }, [menuAberto, configAberto])

  useEffect(() => {
    if (!menuAberto && !configAberto) return

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key !== 'Escape') return
      if (configAberto) {
        if (salvandoSenha) return
        evento.preventDefault()
        setConfigAberto(false)
        setErroSenha(null)
        setSucessoSenha(null)
        setSenhaAtual('')
        setNovaSenha('')
        setConfirmarSenha('')
        return
      }
      if (menuAberto && !saindo) {
        evento.preventDefault()
        setMenuAberto(false)
      }
    }

    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [menuAberto, configAberto, salvandoSenha, saindo])

  function fecharMenu() {
    if (!saindo) setMenuAberto(false)
  }

  function abrirConfiguracoes() {
    setMenuAberto(false)
    setErroSenha(null)
    setSucessoSenha(null)
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmarSenha('')
    setConfigAberto(true)
  }

  function fecharConfiguracoes() {
    if (salvandoSenha) return
    setConfigAberto(false)
    setErroSenha(null)
    setSucessoSenha(null)
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmarSenha('')
  }

  function abrirGerenciamento() {
    setMenuAberto(false)
    navigate('/gerenciamento')
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

  async function salvarSenha(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErroSenha(null)
    setSucessoSenha(null)

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setErroSenha('Preencha todos os campos.')
      return
    }
    if (novaSenha.length < 4) {
      setErroSenha('A nova senha deve ter pelo menos 4 caracteres.')
      return
    }
    if (novaSenha !== confirmarSenha) {
      setErroSenha('A confirmação não corresponde à nova senha.')
      return
    }

    setSalvandoSenha(true)
    try {
      await patchJson<{ message: string }>('usuario/senha', {
        senha_atual: senhaAtual,
        nova_senha: novaSenha,
      })
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
      setSucessoSenha('Senha alterada com sucesso.')
    } catch (falha) {
      setErroSenha(
        falha instanceof Error ? falha.message : 'Não foi possível alterar a senha.',
      )
    } finally {
      setSalvandoSenha(false)
    }
  }

  return (
    <div className="user-menu">
      <button
        ref={botaoRef}
        type="button"
        className="user-menu__botao"
        onClick={() => setMenuAberto(true)}
        aria-label="Abrir menu do usuário"
        aria-haspopup="dialog"
        aria-expanded={menuAberto}
      >
        <IconeEngrenagem />
      </button>

      <div
        className={`user-menu__overlay${menuAberto ? ' user-menu__overlay--aberto' : ''}`}
        onClick={fecharMenu}
        aria-hidden="true"
      />

      <aside
        ref={menuRef}
        className={`user-menu__drawer${menuAberto ? ' user-menu__drawer--aberto' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-menu-titulo"
        aria-hidden={!menuAberto}
      >
        <div className="user-menu__cabecalho">
          <span className="user-menu__avatar" aria-hidden="true">{inicial}</span>
          <div className="user-menu__identificacao">
            <h2 id="user-menu-titulo">{usuario?.nome ?? 'Usuário'}</h2>
            <p>{usuario?.email ?? ''}</p>
          </div>
          <button
            type="button"
            className="user-menu__fechar"
            onClick={fecharMenu}
            disabled={saindo}
            aria-label="Fechar menu"
          >
            ×
          </button>
        </div>

        <nav className="user-menu__opcoes" aria-label="Menu do usuário">
          <button type="button" className="user-menu__opcao" onClick={abrirConfiguracoes}>
            <span className="user-menu__opcao-icone" aria-hidden="true">
              <IconeConfiguracoes />
            </span>
            <span className="user-menu__opcao-texto">
              <strong>Configurações da conta</strong>
              <small>Alterar senha</small>
            </span>
          </button>

          {usuario?.perfil === 'Coordenador' && (
            <button type="button" className="user-menu__opcao" onClick={abrirGerenciamento}>
              <span className="user-menu__opcao-icone" aria-hidden="true">
                <IconeGerenciar />
              </span>
              <span className="user-menu__opcao-texto">
                <strong>Gerenciar plataforma</strong>
                <small>Usuários, turmas, locais e capacidade</small>
              </span>
            </button>
          )}

          <button
            type="button"
            className="user-menu__opcao user-menu__opcao--perigo"
            onClick={aoSair}
            disabled={saindo}
          >
            <span className="user-menu__opcao-icone" aria-hidden="true">
              <IconeSair />
            </span>
            <span className="user-menu__opcao-texto">
              <strong>{saindo ? 'Saindo...' : 'Sair'}</strong>
              <small>Encerrar sessão</small>
            </span>
          </button>
        </nav>
      </aside>

      <div
        className={`user-menu__modal-overlay${configAberto ? ' user-menu__modal-overlay--aberto' : ''}`}
        onMouseDown={(evento) => {
          if (evento.target === evento.currentTarget) fecharConfiguracoes()
        }}
        aria-hidden={!configAberto}
      >
        <section
          className="user-menu__modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-menu-config-titulo"
          aria-hidden={!configAberto}
        >
          <div className="user-menu__modal-cabecalho">
            <div>
              <h2 id="user-menu-config-titulo">Configurações da conta</h2>
              <p>Altere a senha de acesso da sua conta.</p>
            </div>
            <button
              type="button"
              className="user-menu__fechar"
              onClick={fecharConfiguracoes}
              disabled={salvandoSenha}
              aria-label="Fechar configurações"
            >
              ×
            </button>
          </div>

          {erroSenha && (
            <p className="user-menu__mensagem user-menu__mensagem--erro" role="alert">
              {erroSenha}
            </p>
          )}
          {sucessoSenha && (
            <p className="user-menu__mensagem user-menu__mensagem--sucesso" role="status">
              {sucessoSenha}
            </p>
          )}

          <form className="user-menu__form" onSubmit={salvarSenha}>
            <label className="user-menu__campo">
              <span>Senha atual</span>
              <input
                ref={campoAtualRef}
                type="password"
                value={senhaAtual}
                onChange={(evento) => setSenhaAtual(evento.target.value)}
                autoComplete="current-password"
                disabled={salvandoSenha}
                required
              />
            </label>
            <label className="user-menu__campo">
              <span>Nova senha</span>
              <input
                type="password"
                value={novaSenha}
                onChange={(evento) => setNovaSenha(evento.target.value)}
                autoComplete="new-password"
                minLength={4}
                disabled={salvandoSenha}
                required
              />
            </label>
            <label className="user-menu__campo">
              <span>Confirmar nova senha</span>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(evento) => setConfirmarSenha(evento.target.value)}
                autoComplete="new-password"
                minLength={4}
                disabled={salvandoSenha}
                required
              />
            </label>
            <div className="user-menu__modal-acoes">
              <button
                type="button"
                className="user-menu__botao-contorno"
                onClick={fecharConfiguracoes}
                disabled={salvandoSenha}
              >
                Cancelar
              </button>
              <button type="submit" className="user-menu__botao-primario" disabled={salvandoSenha}>
                {salvandoSenha ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

export default UserMenu
