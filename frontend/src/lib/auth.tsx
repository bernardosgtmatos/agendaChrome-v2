import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loginApi, logoutApi, meApi, type UsuarioSessao } from './api.ts'
import { AuthContext } from './auth-context.ts'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null)
  const [carregandoSessao, setCarregandoSessao] = useState(true)

  useEffect(() => {
    let ativo = true
    meApi()
      .then((sessao) => {
        if (ativo) setUsuario(sessao)
      })
      .catch(() => {
        if (ativo) setUsuario(null)
      })
      .finally(() => {
        if (ativo) setCarregandoSessao(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  const entrar = useCallback(async (email: string, senha: string) => {
    await loginApi(email, senha)
    try {
      const sessao = await meApi()
      setUsuario(sessao)
    } catch {
      // /me pode ainda não existir em backends antigos: mantém sessão otimista
      setUsuario((atual: UsuarioSessao | null) => atual ?? { id: 'sessao', nome: email, email })
    }
  }, [])

  const sair = useCallback(async () => {
    await logoutApi()
    setUsuario(null)
  }, [])

  const valor = useMemo(
    () => ({ usuario, carregandoSessao, entrar, sair }),
    [usuario, carregandoSessao, entrar, sair],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
