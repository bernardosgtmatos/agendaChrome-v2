import { useAuth } from '../lib/useAuth.ts'
import UserMenu from './UserMenu.tsx'
import './UserBar.css'

function UserBar() {
  const { usuario } = useAuth()
  const inicial = (usuario?.nome ?? 'U').trim().charAt(0).toUpperCase() || 'U'

  return (
    <div className="user-bar">
      <span className="user-bar__avatar" aria-hidden="true">{inicial}</span>
      <span className="user-bar__nome">{usuario?.nome ?? 'Usuário'}</span>
      <UserMenu />
    </div>
  )
}

export default UserBar