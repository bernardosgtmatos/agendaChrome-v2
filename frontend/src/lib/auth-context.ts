import { createContext } from 'react'
import type { UsuarioSessao } from './api.ts'

export type AuthContexto = {
  usuario: UsuarioSessao | null
  carregandoSessao: boolean
  entrar: (email: string, senha: string) => Promise<void>
  sair: () => Promise<void>
}

export const AuthContext = createContext<AuthContexto | null>(null)
