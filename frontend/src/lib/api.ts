export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export async function getJson<T>(caminho: string): Promise<T> {
  const resposta = await fetch(`${API_BASE}/${caminho}`)
  if (!resposta.ok) {
    throw new Error(`a API respondeu ${resposta.status} em ${caminho}`)
  }
  return (await resposta.json()) as T
}
