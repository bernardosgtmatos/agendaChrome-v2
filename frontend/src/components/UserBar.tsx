import { useRef } from 'react'
import { useAuth } from '../lib/useAuth.ts'
import UserMenu, { type UserMenuHandle } from './UserMenu.tsx'
import './UserBar.css'

function UserBar() {
  const { usuario } = useAuth()
  const inicial = (usuario?.nome ?? 'U').trim().charAt(0).toUpperCase() || 'U'
  const menuRef = useRef<UserMenuHandle>(null)

  return (
    <div
      className="user-bar user-bar--clicavel"
      onClick={() => menuRef.current?.abrir()}
      role="button"
      tabIndex={0}
      onKeyDown={(evento) => {
        if (evento.key === 'Enter' || evento.key === ' ') {
          evento.preventDefault()
          menuRef.current?.abrir()
        }
      }}
      aria-label="Abrir menu do usuário"
    >
      <span className="user-bar__avatar" aria-hidden="true">{inicial}</span>
      <span className="user-bar__nome">{usuario?.nome ?? 'Usuário'}</span>
      <UserMenu ref={menuRef} />
    </div>
  )
}

export default UserBar