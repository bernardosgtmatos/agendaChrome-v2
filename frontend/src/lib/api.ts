// export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
export const API_BASE = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:5000`

async function lerMensagemErro(resposta: Response): Promise<string> {
  try {
    const corpo = (await resposta.json()) as { message?: string } | string | null
    if (typeof corpo === 'string') return corpo
    if (corpo?.message) return corpo.message
  } catch {
    // corpo sem JSON
  }
  return `a API respondeu ${resposta.status}`
}

export async function getJson<T>(caminho: string): Promise<T> {
  const resposta = await fetch(`${API_BASE}/${caminho}`, {
    credentials: 'include',
  })
  if (!resposta.ok) {
    throw new Error(await lerMensagemErro(resposta))
  }
  return (await resposta.json()) as T
}

async function enviarJson<T>(
  caminho: string,
  metodo: 'POST' | 'PATCH' | 'DELETE',
  corpo?: unknown,
): Promise<T> {
  const resposta = await fetch(`${API_BASE}/${caminho}`, {
    method: metodo,
    headers: corpo === undefined ? undefined : { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  })
  const dados = (await resposta.json().catch(() => null)) as T | { message?: string } | null
  if (!resposta.ok) {
    const mensagem =
      typeof dados === 'string'
        ? dados
        : (dados as { message?: string } | null)?.message ??
          `a API respondeu ${resposta.status}`
    throw new Error(mensagem)
  }
  return dados as T
}

export async function postJson<T>(caminho: string, corpo: unknown): Promise<T> {
  return enviarJson<T>(caminho, 'POST', corpo)
}

export async function patchJson<T>(caminho: string, corpo: unknown): Promise<T> {
  return enviarJson<T>(caminho, 'PATCH', corpo)
}

export async function deleteJson<T>(caminho: string): Promise<T> {
  return enviarJson<T>(caminho, 'DELETE')
}

export type Perfil = 'Coordenador' | 'Professor'

export type UsuarioSessao = {
  id: string
  nome: string
  email: string
  perfil: Perfil
}

export async function loginApi(email: string, senha: string): Promise<void> {
  const resposta = await fetch(`${API_BASE}/usuario/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, senha }),
  })
  if (!resposta.ok) {
    throw new Error(await lerMensagemErro(resposta))
  }
}

export async function meApi(): Promise<UsuarioSessao | null> {
  const resposta = await fetch(`${API_BASE}/usuario/me`, {
    credentials: 'include',
  })
  if (resposta.status === 401) return null
  if (!resposta.ok) {
    throw new Error(await lerMensagemErro(resposta))
  }
  return (await resposta.json()) as UsuarioSessao
}

export async function logoutApi(): Promise<void> {
  await fetch(`${API_BASE}/usuario/logout`, {
    method: 'POST',
    credentials: 'include',
  }).catch(() => null)
}

export async function solicitarCodigoRecuperacao(email: string): Promise<void> {
  await postJson<{ message: string }>('usuario/recuperar-senha', { email })
}

export async function verificarCodigoRecuperacao(
  email: string,
  codigo: string,
): Promise<string> {
  const resposta = await postJson<{ reset_token: string }>('usuario/verificar-codigo', {
    email,
    codigo,
  })
  return resposta.reset_token
}

export async function redefinirSenhaRecuperacao(
  resetToken: string,
  novaSenha: string,
): Promise<void> {
  await postJson<{ message: string }>('usuario/redefinir-senha', {
    reset_token: resetToken,
    nova_senha: novaSenha,
  })
}
