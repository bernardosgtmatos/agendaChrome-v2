const backendUrl = process.env.BACKEND_URL
const cronSecret = process.env.CRON_SECRET

if (!backendUrl || !cronSecret) {
    console.error('BACKEND_URL e CRON_SECRET são obrigatórios.')
    process.exitCode = 1
    process.exit()
}

fetch(`${backendUrl.replace(/\/$/, '')}/internal/sincronizar-status`, {
    headers: { 'x-cron-secret': cronSecret }
})
    .then(async (res) => {
        const body = await res.text()
        console.log(`status ${res.status}: ${body}`)
        if (!res.ok) process.exitCode = 1
    })
    .catch((erro) => {
        console.error('Erro ao chamar sincronização:', erro)
        process.exitCode = 1
    })
