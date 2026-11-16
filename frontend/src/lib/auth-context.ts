import { createContext } from 'react'
import type { UsuarioSessao } from './api.ts'

export type AuthContexto = {
  usuario: UsuarioSessao | null
  carregandoSessao: boolean
  erroSessao: string | null
  entrar: (email: string, senha: string) => Promise<void>
  sair: () => Promise<void>
}

export const AuthContext = createContext<AuthContexto | null>(null)
