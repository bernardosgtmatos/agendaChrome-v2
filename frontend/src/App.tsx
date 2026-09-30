import { Outlet, Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar.tsx'
import AgendamentoForm from './pages/Agendamento/AgendamentoForm.tsx'
import AgendamentoListagem from './pages/Agendamento/AgendamentoListagem.tsx'
import './App.css'

function Layout() {
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/agendar" element={<AgendamentoForm />} />
        <Route path="/agendamentos" element={<AgendamentoListagem />} />
      </Route>
      <Route path="*" element={null} />
    </Routes>
  )
}

export default App
