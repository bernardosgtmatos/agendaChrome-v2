import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  redefinirSenhaRecuperacao,
  solicitarCodigoRecuperacao,
  verificarCodigoRecuperacao,
} from '../../lib/api.ts'
import '../login/Login.css'
import './RecuperarSenha.css'

type Etapa = 'email' | 'codigo' | 'senha' | 'sucesso'

function IconeCadeado() {
  return (
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v3" />
    </svg>
  )
}

function IconeSucesso() {
  return (
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 5 5L20 7" />
    </svg>
  )
}

function RecuperarSenha() {
  const [etapa, setEtapa] = useState<Etapa>('email')
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const codigoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => {
      setCooldown((valor) => Math.max(0, valor - 1))
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  useEffect(() => {
    if (etapa !== 'codigo') return
    const timer = window.setTimeout(() => codigoRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [etapa])

  function limparFormulario() {
    setCodigo('')
    setResetToken('')
    setNovaSenha('')
    setConfirmarSenha('')
    setMostrarNovaSenha(false)
    setMostrarConfirmarSenha(false)
  }

  function voltarParaEmail() {
    setEtapa('email')
    setErro(null)
    setAviso(null)
    setCooldown(0)
    limparFormulario()
  }

  async function enviarEmail(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErro(null)
    setAviso(null)

    const emailLimpo = email.trim()
    if (!emailLimpo || !emailLimpo.includes('@')) {
      setErro('Informe um email válido.')
      return
    }

    setEnviando(true)
    try {
      await solicitarCodigoRecuperacao(emailLimpo)
      setEmail(emailLimpo)
      setEtapa('codigo')
      setCooldown(60)
      setAviso('Se o email estiver cadastrado, enviamos um código de recuperação.')
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : 'Não foi possível solicitar o código. Tente novamente.',
      )
    } finally {
      setEnviando(false)
    }
  }

  async function reenviarCodigo() {
    if (cooldown > 0 || enviando) return

    setErro(null)
    setAviso(null)
    setEnviando(true)
    try {
      await solicitarCodigoRecuperacao(email)
      setCooldown(60)
      setAviso('Se o email estiver cadastrado, enviamos um novo código.')
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : 'Não foi possível reenviar o código. Tente novamente.',
      )
    } finally {
      setEnviando(false)
    }
  }

  async function verificarCodigo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErro(null)
    setAviso(null)

    if (!/^\d{6}$/.test(codigo)) {
      setErro('Informe o código de 6 dígitos.')
      return
    }

    setEnviando(true)
    try {
      const token = await verificarCodigoRecuperacao(email, codigo)
      setResetToken(token)
      setEtapa('senha')
    } catch (falha) {
      setErro(
        falha instanceof Error ? falha.message : 'Código inválido ou expirado.',
      )
    } finally {
      setEnviando(false)
    }
  }

  async function redefinirSenha(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErro(null)

    if (novaSenha.length < 4) {
      setErro('A nova senha deve ter pelo menos 4 caracteres.')
      return
    }
    if (novaSenha !== confirmarSenha) {
      setErro('A confirmação não corresponde à nova senha.')
      return
    }

    setEnviando(true)
    try {
      await redefinirSenhaRecuperacao(resetToken, novaSenha)
      limparFormulario()
      setEtapa('sucesso')
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : 'Não foi possível redefinir a senha. Tente novamente.',
      )
    } finally {
      setEnviando(false)
    }
  }

  const numeroEtapa = etapa === 'email' ? 1 : etapa === 'codigo' ? 2 : 3

  return (
    <main className="login-page">
      <svg
        className="login-page__fundo"
        viewBox="0 0 1440 1024"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <rect width="1440" height="1024" fill="#E3EFFB" />
        <g opacity="0.8">
          <path d="M264.887 627.09L5.89519 924.558L-25.105 359.754L264.887 627.09Z" fill="#8FC2D9" />
        </g>
        <g opacity="0.8">
          <path d="M1170.51 263.027L923.893 -69.9383L1487.69 -3.58192L1170.51 263.027Z" fill="#C2E4F3" />
        </g>
        <g opacity="0.8">
          <path d="M362.883 572.654L817.674 1065.71L-81.0572 1075.5L362.883 572.654Z" fill="#C2E4F3" />
        </g>
        <g opacity="0.8">
          <path d="M878.563 540.337L1480.98 33.8175L1589.96 877.059L878.563 540.337Z" fill="#8FC2D9" />
        </g>
      </svg>

      <section className="login-card recuperar-card" aria-labelledby="recuperar-titulo">
        <div className="recuperar-emblema" aria-hidden="true">
          <IconeCadeado />
        </div>

        <h1 id="recuperar-titulo" className="login-card__titulo">
          {etapa === 'sucesso' ? 'Senha alterada' : 'Recuperar senha'}
        </h1>
        <p className="login-card__subtitulo">
          {etapa === 'email' && 'Informe o email da sua conta para receber um código de verificação.'}
          {etapa === 'codigo' && 'Digite o código de 6 dígitos enviado para o seu email.'}
          {etapa === 'senha' && 'Código verificado. Escolha uma nova senha para sua conta.'}
          {etapa === 'sucesso' && 'Sua senha foi redefinida. Você já pode entrar com a nova senha.'}
        </p>

        {etapa !== 'sucesso' && (
          <p className="recuperar-etapa">Etapa {numeroEtapa} de 3</p>
        )}

        {erro && (
          <p className="login-card__erro" role="alert">
            {erro}
          </p>
        )}
        {aviso && (
          <p className="login-card__aviso" role="status">
            {aviso}
          </p>
        )}

        {etapa === 'email' && (
          <form className="login-form" onSubmit={enviarEmail} noValidate>
            <div className="login-campo">
              <label className="login-campo__rotulo" htmlFor="recuperar-email">
                Email
              </label>
              <input
                id="recuperar-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                disabled={enviando}
                onChange={(evento) => setEmail(evento.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-botao" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar código'}
              <span aria-hidden="true">→</span>
            </button>
          </form>
        )}

        {etapa === 'codigo' && (
          <>
            <p className="recuperar-destaque">
              Código enviado para <strong>{email}</strong>
            </p>

            <form className="login-form" onSubmit={verificarCodigo} noValidate>
              <div className="login-campo">
                <label className="login-campo__rotulo" htmlFor="recuperar-codigo">
                  Código de verificação
                </label>
                <input
                  ref={codigoRef}
                  id="recuperar-codigo"
                  name="codigo"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  className="recuperar-codigo"
                  value={codigo}
                  disabled={enviando}
                  onChange={(evento) => setCodigo(evento.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                />
              </div>

              <button type="submit" className="login-botao" disabled={enviando || codigo.length !== 6}>
                {enviando ? 'Verificando…' : 'Verificar código'}
                <span aria-hidden="true">→</span>
              </button>
            </form>

            <div className="recuperar-acoes">
              <button
                type="button"
                className="recuperar-link"
                onClick={reenviarCodigo}
                disabled={cooldown > 0 || enviando}
              >
                {cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar código'}
              </button>
              <button
                type="button"
                className="recuperar-link"
                onClick={voltarParaEmail}
                disabled={enviando}
              >
                Alterar email
              </button>
            </div>
          </>
        )}

        {etapa === 'senha' && (
          <form className="login-form" onSubmit={redefinirSenha} noValidate>
            <div className="login-campo">
              <label className="login-campo__rotulo" htmlFor="recuperar-nova-senha">
                Nova senha
              </label>
              <div className="login-campo__senha">
                <input
                  id="recuperar-nova-senha"
                  name="new-password"
                  type={mostrarNovaSenha ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={novaSenha}
                  disabled={enviando}
                  onChange={(evento) => setNovaSenha(evento.target.value)}
                  minLength={4}
                  required
                />
                <button
                  type="button"
                  className="login-campo__olho"
                  onClick={() => setMostrarNovaSenha((valor) => !valor)}
                  aria-pressed={mostrarNovaSenha}
                  aria-label={mostrarNovaSenha ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                  disabled={enviando}
                >
                  {mostrarNovaSenha ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <div className="login-campo">
              <label className="login-campo__rotulo" htmlFor="recuperar-confirmar-senha">
                Confirmar nova senha
              </label>
              <div className="login-campo__senha">
                <input
                  id="recuperar-confirmar-senha"
                  name="confirm-password"
                  type={mostrarConfirmarSenha ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmarSenha}
                  disabled={enviando}
                  onChange={(evento) => setConfirmarSenha(evento.target.value)}
                  minLength={4}
                  required
                />
                <button
                  type="button"
                  className="login-campo__olho"
                  onClick={() => setMostrarConfirmarSenha((valor) => !valor)}
                  aria-pressed={mostrarConfirmarSenha}
                  aria-label={mostrarConfirmarSenha ? 'Ocultar confirmação' : 'Mostrar confirmação'}
                  disabled={enviando}
                >
                  {mostrarConfirmarSenha ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <button type="submit" className="login-botao" disabled={enviando}>
              {enviando ? 'Salvando…' : 'Redefinir senha'}
              <span aria-hidden="true">→</span>
            </button>
          </form>
        )}

        {etapa === 'sucesso' && (
          <div className="recuperar-sucesso" role="status">
            <span className="recuperar-sucesso__icone" aria-hidden="true">
              <IconeSucesso />
            </span>
            <Link to="/login" className="login-botao recuperar-botao-link">
              Ir para o login
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}

        {etapa !== 'sucesso' && (
          <div className="recuperar-rodape">
            <Link to="/login" className="login-links__link">
              Voltar para o login
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}

export default RecuperarSenha
