import { Route, Routes } from 'react-router-dom'
import AgendamentoForm from './pages/Agendamento/AgendamentoForm.tsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/agendar" element={<AgendamentoForm />} />
      <Route path="*" element={null} />
    </Routes>
  )
}

export default App
