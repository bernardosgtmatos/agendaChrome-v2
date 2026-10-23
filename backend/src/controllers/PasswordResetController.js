const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { Op } = require('sequelize')
const sequelize = require('../config/Database')
const { Usuario, RecuperacaoSenha } = require('../model/index.js')
const { enviarCodigoRecuperacao } = require('../services/EmailService.js')

const CODIGO_TTL_MS = 10 * 60 * 1000
const REENVIO_MS = 60 * 1000
const MAX_TENTATIVAS = 5
const RESET_TOKEN_TTL = '10m'

const MENSAGEM_GENERICA = 'Se o email estiver cadastrado, enviaremos um código de recuperação.'
const MENSAGEM_CODIGO_INVALIDO = 'Código inválido ou expirado.'
const MENSAGEM_TOKEN_INVALIDO = 'Link de recuperação inválido ou expirado.'

function normalizarEmail(valor) {
    return typeof valor === 'string' ? valor.trim().toLowerCase() : ''
}

function normalizarCodigo(valor) {
    return typeof valor === 'string' ? valor.trim() : ''
}

function respostaGenerica(res) {
    return res.status(200).json({ message: MENSAGEM_GENERICA })
}

function respostaCodigoInvalido(res) {
    return res.status(400).json({ message: MENSAGEM_CODIGO_INVALIDO })
}

function respostaTokenInvalido(res) {
    return res.status(400).json({ message: MENSAGEM_TOKEN_INVALIDO })
}

function gerarCodigo() {
    return crypto.randomInt(0, 1000000).toString().padStart(6, '0')
}

function buscarUsuarioPorEmail(email) {
    return Usuario.findOne({
        where: sequelize.where(
            sequelize.fn('lower', sequelize.col('email')),
            email
        )
    })
}

const solicitarCodigo = async (req, res) => {
    const email = normalizarEmail(req.body?.email)

    if (!email) {
        return res.status(400).json({ message: 'Informe o email da conta.' })
    }

    try {
        const usuario = await buscarUsuarioPorEmail(email)
        if (!usuario) {
            return respostaGenerica(res)
        }

        const agora = new Date()
        const ultimoPedido = await RecuperacaoSenha.findOne({
            where: {
                usuario_id: usuario.id,
                usado_em: null
            },
            order: [['createdAt', 'DESC']]
        })

        if (
            ultimoPedido &&
            agora.getTime() - new Date(ultimoPedido.createdAt).getTime() < REENVIO_MS
        ) {
            return respostaGenerica(res)
        }

        await RecuperacaoSenha.update(
            { usado_em: agora },
            {
                where: {
                    usuario_id: usuario.id,
                    usado_em: null
                }
            }
        )

        const codigo = gerarCodigo()
        const codigoHash = await bcrypt.hash(codigo, 10)
        const registro = await RecuperacaoSenha.create({
            usuario_id: usuario.id,
            codigo_hash: codigoHash,
            expira_em: new Date(agora.getTime() + CODIGO_TTL_MS)
        })

        try {
            await enviarCodigoRecuperacao({
                para: usuario.email,
                nome: usuario.nome,
                codigo
            })
        } catch (erroEmail) {
            console.error('Erro ao enviar código de recuperação:', erroEmail)
            await registro.update({ usado_em: new Date() })
        }

        return respostaGenerica(res)
    } catch (error) {
        console.error('Erro ao solicitar recuperação de senha:', error)
        return res.status(500).json({
            message: 'Não foi possível solicitar a recuperação de senha.'
        })
    }
}

const verificarCodigo = async (req, res) => {
    const email = normalizarEmail(req.body?.email)
    const codigo = normalizarCodigo(req.body?.codigo)

    if (!email || !/^\d{6}$/.test(codigo)) {
        return respostaCodigoInvalido(res)
    }

    try {
        const usuario = await buscarUsuarioPorEmail(email)
        if (!usuario) {
            return respostaCodigoInvalido(res)
        }

        const agora = new Date()
        const registro = await RecuperacaoSenha.findOne({
            where: {
                usuario_id: usuario.id,
                usado_em: null,
                expira_em: { [Op.gt]: agora }
            },
            order: [['createdAt', 'DESC']]
        })

        if (!registro) {
            return respostaCodigoInvalido(res)
        }

        if (registro.tentativas >= MAX_TENTATIVAS) {
            await registro.update({ usado_em: agora })
            return respostaCodigoInvalido(res)
        }

        const codigoConfere = await bcrypt.compare(codigo, registro.codigo_hash)

        if (!codigoConfere) {
            const tentativas = registro.tentativas + 1
            await registro.update({
                tentativas,
                usado_em: tentativas >= MAX_TENTATIVAS ? agora : null
            })
            return respostaCodigoInvalido(res)
        }

        const resetToken = jwt.sign(
            {
                sub: usuario.id,
                resetId: registro.id,
                purpose: 'password-reset'
            },
            process.env.JWT_SECRET,
            { expiresIn: RESET_TOKEN_TTL }
        )

        return res.status(200).json({ reset_token: resetToken })
    } catch (error) {
        console.error('Erro ao verificar código de recuperação:', error)
        return res.status(500).json({
            message: 'Não foi possível verificar o código.'
        })
    }
}

const redefinirSenha = async (req, res) => {
    const resetToken = typeof req.body?.reset_token === 'string' ? req.body.reset_token : ''
    const novaSenha = typeof req.body?.nova_senha === 'string' ? req.body.nova_senha : ''

    if (!resetToken || !novaSenha) {
        return res.status(400).json({
            message: 'Informe o código de recuperação e a nova senha.'
        })
    }

    if (novaSenha.length < 4) {
        return res.status(400).json({
            message: 'A nova senha deve ter pelo menos 4 caracteres.'
        })
    }

    try {
        const payload = jwt.verify(resetToken, process.env.JWT_SECRET)

        if (
            !payload ||
            payload.purpose !== 'password-reset' ||
            !payload.sub ||
            !payload.resetId
        ) {
            return respostaTokenInvalido(res)
        }

        const agora = new Date()
        const registro = await RecuperacaoSenha.findOne({
            where: {
                id: payload.resetId,
                usuario_id: payload.sub,
                usado_em: null,
                expira_em: { [Op.gt]: agora }
            }
        })

        if (!registro) {
            return respostaTokenInvalido(res)
        }

        const usuario = await Usuario.scope(null).findByPk(payload.sub)
        if (!usuario) {
            return respostaTokenInvalido(res)
        }

        await usuario.update({
            senha: novaSenha,
            token_version: usuario.token_version + 1
        })
        await registro.update({ usado_em: agora })
        await RecuperacaoSenha.update(
            { usado_em: agora },
            {
                where: {
                    usuario_id: usuario.id,
                    usado_em: null
                }
            }
        )

        return res.status(200).json({
            message: 'Senha alterada com sucesso.'
        })
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return respostaTokenInvalido(res)
        }
        console.error('Erro ao redefinir senha:', error)
        return res.status(500).json({
            message: 'Não foi possível redefinir a senha.'
        })
    }
}

module.exports = { solicitarCodigo, verificarCodigo, redefinirSenha }
