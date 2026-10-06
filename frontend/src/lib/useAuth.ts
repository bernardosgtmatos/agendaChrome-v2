import { useContext } from 'react'
import { AuthContext } from './auth-context.ts'
import type { AuthContexto } from './auth-context.ts'

export function useAuth(): AuthContexto {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return contexto
}
