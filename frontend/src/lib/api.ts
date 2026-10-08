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

export async function postJson<T>(caminho: string, corpo: unknown): Promise<T> {
  const resposta = await fetch(`${API_BASE}/${caminho}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(corpo),
  })
  const dados = (await resposta.json().catch(() => null)) as T | null
  if (!resposta.ok) {
    throw new Error(
      (dados as { message?: string } | null)?.message ?? `a API respondeu ${resposta.status}`,
    )
  }
  return dados as T
}

export type UsuarioSessao = {
  id: string
  nome: string
  email: string
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
