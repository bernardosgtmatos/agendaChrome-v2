import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import UserBar from './UserBar.tsx'
import './NavBar.css'

function NavBar() {
  const [busca, setBusca] = useState('')

  return (
    <header className="navbar-shell">
      <UserBar />
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

      </nav>
    </header>
  )
}

export default NavBar
