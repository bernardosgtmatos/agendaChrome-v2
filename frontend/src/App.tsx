import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import NavBar from './components/NavBar.tsx'
import { useAuth } from './lib/useAuth.ts'
import AgendamentoForm from './pages/agendar/AgendamentoForm.tsx'
import AgendamentoListagem from './pages/agendamentos/AgendamentoListagem.tsx'
import Gerenciamento from './pages/gerenciamento/Gerenciamento.tsx'
import Login from './pages/login/Login.tsx'
import RecuperarSenha from './pages/recuperar-senha/RecuperarSenha.tsx'
import './App.css'

function Layout() {
  const location = useLocation()
  const semNavBar = location.pathname === '/agendar' || location.pathname === '/gerenciamento'
  return (
    <>
      {!semNavBar && <NavBar />}
      <Outlet />
    </>
  )
}

function RequireAuth() {
  const { usuario, carregandoSessao } = useAuth()
  const location = useLocation()

  if (carregandoSessao) {
    return <p className="agendar-aviso">Carregando sessão...</p>
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

function RequireAdmin() {
  const { usuario, carregandoSessao } = useAuth()

  if (carregandoSessao) {
    return <p className="agendar-aviso">Carregando sessão...</p>
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (usuario.perfil !== 'Coordenador') {
    return <Navigate to="/agendar" replace />
  }

  return <Outlet />
}

function Raiz() {
  const { usuario, carregandoSessao } = useAuth()

  if (carregandoSessao) {
    return <p className="agendar-aviso">Carregando sessão...</p>
  }

  return <Navigate to={usuario ? '/agendar' : '/login'} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar-senha" element={<RecuperarSenha />} />
      <Route path="/" element={<Raiz />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/agendar" element={<AgendamentoForm />} />
          <Route path="/agendamentos" element={<AgendamentoListagem />} />
          <Route element={<RequireAdmin />}>
            <Route path="/gerenciamento" element={<Gerenciamento />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
