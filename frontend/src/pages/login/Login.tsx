import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/useAuth.ts'
import './Login.css'

type LocationState = {
  from?: string
}

export default function Login() {
  const { usuario, carregandoSessao, entrar } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as LocationState | null)?.from ?? '/agendar'

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (!carregandoSessao && usuario) {
    return <Navigate to="/agendar" replace />
  }

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErro(null)

    const emailLimpo = email.trim()
    if (!emailLimpo || !senha) {
      setErro('Informe email e senha para continuar.')
      return
    }

    setEnviando(true)
    try {
      await entrar(emailLimpo, senha)
      navigate(from, { replace: true })
    } catch (falha) {
      setErro(
        falha instanceof Error ? falha.message : 'Não foi possível entrar. Tente novamente.',
      )
    } finally {
      setEnviando(false)
    }
  }

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

      <section className="login-card" aria-labelledby="login-titulo">
        <div className="login-card__hero">
          <div className="login-card__emblema">
            <img
              src="/login-illustration.png"
              alt="Ilustração de chromebooks"
              width={184}
              height={161}
            />
          </div>
        </div>

        <h1 id="login-titulo" className="login-card__titulo">
          AgendaChrome
        </h1>
        <p className="login-card__subtitulo">
          Acesse sua conta para gerenciar os agendamentos de chromebooks
        </p>

        {erro && (
          <p className="login-card__erro" role="alert">
            {erro}
          </p>
        )}

        <form className="login-form" onSubmit={aoEnviar} noValidate>
          <div className="login-campo">
            <label className="login-campo__rotulo" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              disabled={enviando}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-campo">
            <label className="login-campo__rotulo" htmlFor="senha">
              Senha
            </label>
            <div className="login-campo__senha">
              <input
                id="senha"
                name="password"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={senha}
                disabled={enviando}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
              <button
                type="button"
                className="login-campo__olho"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-pressed={mostrarSenha}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                disabled={enviando}
              >
                {mostrarSenha ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <div className="login-links">
            <Link to="/recuperar-senha" className="login-links__link">
              Esqueci a senha?
            </Link>
            <span className="login-links__divisor" aria-hidden="true">
              <i />
              <i />
            </span>
            <Link to="/agendar" className="login-links__link login-links__link--forte">
              Criar conta <span aria-hidden="true">→</span>
            </Link>
          </div>

          <button type="submit" className="login-botao" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </section>
    </main>
  )
}
