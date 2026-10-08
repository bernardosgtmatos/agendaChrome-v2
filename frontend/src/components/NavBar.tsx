import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth.ts'
import './NavBar.css'

function inicialDo(nome: string): string {
  const letra = nome.trim().charAt(0)
  return letra ? letra.toUpperCase() : 'A'
}

function NavBar() {
  const { usuario, sair } = useAuth()
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [saindo, setSaindo] = useState(false)

  async function aoSair() {
    setSaindo(true)
    try {
      await sair()
    } finally {
      setSaindo(false)
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="navbar-shell">
      <nav className="navbar" aria-label="Navegação principal">
        <span className="navbar__marca">AgendaChrome</span>

        <div className="navbar__busca" role="search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Buscar por turma, local…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label="Buscar agendamento"
          />
        </div>

        <div className="navbar__links">
          <NavLink to="/agendar" className="navbar__link">
            Novo agendamento
          </NavLink>
          <NavLink to="/agendamentos" className="navbar__link">
            Agendamentos
          </NavLink>
        </div>

        <div className="navbar__usuario">
          <span className="navbar__avatar" aria-hidden="true">
            {usuario ? inicialDo(usuario.nome) : 'A'}
          </span>
          <button
            type="button"
            className="navbar__sair"
            onClick={aoSair}
            disabled={saindo}
          >
            {saindo ? 'Saindo…' : 'Sair →'}
          </button>
        </div>
      </nav>
    </header>
  )
}

export default NavBar
