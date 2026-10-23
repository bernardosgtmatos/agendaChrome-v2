const Usuario = require('../model/UserModel')
const { assinarToken, definirCookieToken, limparCookieToken } = require('../services/TokenService')

const login = async (req,res) => {
    try {
        const {email,senha} = req.body //essa senha que vem do reqbody vem criptografada?
        if(!email||!senha){
            return res.status(400).json({
                message: 'Todos os campos são obrigatórios'
            })
        }
        const user = await Usuario.scope(null).findOne({where:{email: email}})
        if(!user || !(await user.validSenha(senha))){
            return res.status(400).json({
                message: 'Credenciais invalidas!'
            })
        }
        const token = assinarToken(user)
        definirCookieToken(res, token)
        return res.status(200).json({
            message: 'login realizado com sucesso!'
        })
    } catch (error) {
        console.error(error)
        return res.status(400).json({
            message:'error ao tentar fazer login, tente novamente mais tarde.'
        })
    }
}
const me = async (req, res) => {
    try {
        const user = await Usuario.findByPk(req.user.id)
        if (!user) {
            return res.status(401).json({
                message: 'Sessão inválida.'
            })
        }
        return res.status(200).json({
            id: user.id,
            nome: user.nome,
            email: user.email,
            perfil: user.perfil,
        })
    } catch (error) {
        console.error(error)
        return res.status(401).json({
            message: 'Sessão inválida.'
        })
    }
}

const alterarSenha = async (req, res) => {
    const { senha_atual, nova_senha } = req.body
    if (
        typeof senha_atual !== 'string' ||
        typeof nova_senha !== 'string' ||
        !senha_atual ||
        !nova_senha
    ) {
        return res.status(400).json({
            message: 'Informe a senha atual e a nova senha.'
        })
    }
    if (nova_senha.length < 4) {
        return res.status(400).json({
            message: 'A nova senha deve ter pelo menos 4 caracteres.'
        })
    }
    try {
        const user = await Usuario.scope(null).findByPk(req.user.id)
        if (!user) {
            return res.status(401).json({
                message: 'Sessão inválida.'
            })
        }
        if (!(await user.validSenha(senha_atual))) {
            return res.status(400).json({
                message: 'A senha atual está incorreta.'
            })
        }
        if (await user.validSenha(nova_senha)) {
            return res.status(400).json({
                message: 'A nova senha deve ser diferente da senha atual.'
            })
        }
        await user.update({
            senha: nova_senha,
            token_version: user.token_version + 1
        })
        definirCookieToken(res, assinarToken(user))
        return res.status(200).json({
            message: 'Senha alterada com sucesso.'
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: 'Erro ao tentar alterar a senha.'
        })
    }
}

const logout = async (req, res) => {
    limparCookieToken(res)
    return res.status(200).json({
        message: 'logout realizado com sucesso!'
    })
}
module.exports = {login, me, logout, alterarSenha}