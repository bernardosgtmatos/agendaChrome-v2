const nodemailer = require('nodemailer')

let transporte = null

function configuracaoSmtp() {
    const host = process.env.SMTP_HOST
    const porta = Number(process.env.SMTP_PORT ?? 587)
    const usuario = process.env.SMTP_USER
    const senha = process.env.SMTP_PASS
    const from = process.env.SMTP_FROM
    const faltando = []

    if (!host) faltando.push('SMTP_HOST')
    if (!from) faltando.push('SMTP_FROM')

    const exigeAutenticacao = host === 'smtp-relay.brevo.com' || Boolean(usuario || senha)
    if (exigeAutenticacao) {
        if (!usuario) faltando.push('SMTP_USER')
        if (!senha) faltando.push('SMTP_PASS')
    }

    return {
        host,
        porta,
        secure: process.env.SMTP_SECURE === 'true' || porta === 465,
        usuario,
        senha,
        from,
        faltando,
        configurado: faltando.length === 0
    }
}

function smtpConfigurado() {
    return configuracaoSmtp().configurado
}

function registrarStatusEmail() {
    if (process.env.EMAIL_DEV_MODE === 'true') {
        console.log('[email] EMAIL_DEV_MODE=true: códigos serão exibidos no terminal; SMTP não será usado.')
        return
    }

    const config = configuracaoSmtp()
    if (!config.configurado) {
        console.warn(`[email] SMTP incompleto. Variáveis ausentes: ${config.faltando.join(', ')}. Use EMAIL_DEV_MODE=true ou preencha a configuração.`)
        return
    }

    console.log(`[email] SMTP configurado: ${config.host}:${config.porta}`)
}

function obterTransporte() {
    if (transporte) return transporte

    const config = configuracaoSmtp()

    transporte = nodemailer.createTransport({
        host: config.host,
        port: config.porta,
        secure: config.secure,
        auth: config.usuario ? { user: config.usuario, pass: config.senha } : undefined,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    })

    return transporte
}

function escaparHtml(valor) {
    return String(valor).replace(/[&<>"']/g, (caractere) => {
        const mapa = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }
        return mapa[caractere]
    })
}

async function enviarCodigoRecuperacao({ para, nome, codigo }) {
    if (process.env.EMAIL_DEV_MODE === 'true') {
        console.log(`[recuperacao-senha] codigo para ${para}: ${codigo}`)
        return
    }

    if (!smtpConfigurado()) {
        throw new Error('SMTP não configurado. Defina SMTP_HOST, SMTP_FROM, SMTP_USER e SMTP_PASS ou use EMAIL_DEV_MODE=true.')
    }

    const nomeSeguro = escaparHtml(nome || 'usuário')
    const codigoSeguro = escaparHtml(codigo)

    await obterTransporte().sendMail({
        from: process.env.SMTP_FROM,
        to: para,
        subject: 'Código para redefinir sua senha - AgendaChrome',
        text: `Olá, ${nome || 'usuário'}.\n\nSeu código para redefinir a senha do AgendaChrome é: ${codigo}\n\nO código expira em 10 minutos. Se você não solicitou a recuperação, ignore este email.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #073d53;">
                <h1 style="font-size: 24px; margin: 0 0 16px;">AgendaChrome</h1>
                <p style="font-size: 16px; line-height: 1.5; margin: 0 0 20px;">Olá, ${nomeSeguro}.</p>
                <p style="font-size: 16px; line-height: 1.5; margin: 0 0 12px;">Use o código abaixo para redefinir sua senha:</p>
                <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center; background: #e3effb; border-radius: 16px; padding: 20px; margin: 24px 0;">${codigoSeguro}</p>
                <p style="font-size: 14px; line-height: 1.5; color: #48859f; margin: 0 0 8px;">O código expira em 10 minutos.</p>
                <p style="font-size: 14px; line-height: 1.5; color: #48859f; margin: 0;">Se você não solicitou a recuperação, ignore este email.</p>
            </div>
        `
    })
}

module.exports = { enviarCodigoRecuperacao, registrarStatusEmail }
