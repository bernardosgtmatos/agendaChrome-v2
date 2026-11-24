export const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? `http://${window.location.hostname}:5000` : '')

const CHAVE_TOKEN = 'agendaChrome_token'

export function obterToken(): string | null {
  try {
    return localStorage.getItem(CHAVE_TOKEN)
  } catch {
    return null
  }
}

export function salvarToken(token: string | null | undefined) {
  try {
    if (token) localStorage.setItem(CHAVE_TOKEN, token)
    else localStorage.removeItem(CHAVE_TOKEN)
  } catch {
    // ignore
  }
}

function headersAuth(base?: HeadersInit): HeadersInit {
  const token = obterToken()
  const headers: Record<string, string> = {}
  if (base) Object.assign(headers, base as Record<string, string>)
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export class RateLimitError extends Error {
  retryAfter?: number

  constructor(message = 'Muitas requisições. Tente novamente em instantes.', retryAfter?: number) {
    super(message)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}

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
    headers: headersAuth(),
  })
  if (!resposta.ok) {
    if (resposta.status === 429) {
      const corpo = (await resposta.json().catch(() => null)) as { message?: string; retryAfter?: number } | null
      throw new RateLimitError(
        typeof corpo?.message === 'string' ? corpo.message : 'Muitas requisições. Tente novamente em instantes.',
        typeof corpo?.retryAfter === 'number' ? corpo.retryAfter : undefined,
      )
    }
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
    headers: headersAuth(corpo === undefined ? undefined : { 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  })
  const dados = (await resposta.json().catch(() => null)) as
    | T
    | { message?: string; retryAfter?: number }
    | null
  if (dados && typeof dados === 'object' && 'token' in (dados as Record<string, unknown>)) {
    salvarToken((dados as { token?: string }).token)
  }
  if (resposta.status === 401) salvarToken(null)
  if (!resposta.ok) {
    if (resposta.status === 429) {
      const corpo = dados as { message?: string; retryAfter?: number } | null
      throw new RateLimitError(
        typeof corpo?.message === 'string' ? corpo.message : 'Muitas requisições. Tente novamente em instantes.',
        typeof corpo?.retryAfter === 'number' ? corpo.retryAfter : undefined,
      )
    }
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
    headers: headersAuth({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify({ email, senha }),
  })
  const dados = (await resposta.json().catch(() => null)) as { message?: string; token?: string; retryAfter?: number } | null
  if (dados?.token) salvarToken(dados.token)
  if (!resposta.ok) {
    if (resposta.status === 429) {
      throw new RateLimitError(
        typeof dados?.message === 'string' ? dados.message : 'Muitas requisições. Tente novamente em instantes.',
        typeof dados?.retryAfter === 'number' ? dados.retryAfter : undefined,
      )
    }
    throw new Error(
      typeof dados?.message === 'string' ? dados.message : `a API respondeu ${resposta.status}`,
    )
  }
}

export async function meApi(): Promise<UsuarioSessao | null> {
  const resposta = await fetch(`${API_BASE}/usuario/me`, {
    credentials: 'include',
    headers: headersAuth(),
  })
  if (resposta.status === 401) salvarToken(null)
  if (resposta.status === 401) return null
  if (resposta.status === 429) {
    const corpo = (await resposta.json().catch(() => null)) as { message?: string; retryAfter?: number } | null
    throw new RateLimitError(
      typeof corpo?.message === 'string' ? corpo.message : 'Muitas requisições. Tente novamente em instantes.',
      typeof corpo?.retryAfter === 'number' ? corpo.retryAfter : undefined,
    )
  }
  if (!resposta.ok) {
    throw new Error(await lerMensagemErro(resposta))
  }
  if (!resposta.ok) {
    throw new Error(await lerMensagemErro(resposta))
  }
  return (await resposta.json()) as UsuarioSessao
}

export async function logoutApi(): Promise<void> {
  await fetch(`${API_BASE}/usuario/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: headersAuth(),
  }).catch(() => null)
  salvarToken(null)
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
