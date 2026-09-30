import { NavLink } from 'react-router-dom'
import './NavBar.css'

function NavBar() {
  return (
    <nav className="navbar" aria-label="Navegação principal">
      <span className="navbar__marca">AgendaChrome</span>
      <div className="navbar__links">
        <NavLink to="/agendar" className="navbar__link">
          Novo agendamento
        </NavLink>
        <NavLink to="/agendamentos" className="navbar__link">
          Agendamentos
        </NavLink>
      </div>
    </nav>
  )
}

export default NavBar
