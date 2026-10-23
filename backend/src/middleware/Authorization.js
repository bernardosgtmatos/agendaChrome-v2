const jwt = require('jsonwebtoken')
const Usuario = require('../model/UserModel')

const auth = async (req,res,next) => {
    const token = req.cookies.token
    if(!token){
        console.log('token não fornecido')
        return res.status(401).json({
            message: 'Acesso não autorizado.'
        })
    }
    try {
        const validToken = jwt.verify(token, process.env.JWT_SECRET)
        if (!validToken?.id || !Number.isInteger(validToken.tokenVersion)) {
            return res.status(401).json({
                message: 'Sessão inválida.'
            })
        }
        const usuario = await Usuario.findByPk(validToken.id)
        if (!usuario || usuario.token_version !== validToken.tokenVersion) {
            return res.status(401).json({
                message: 'Sessão inválida.'
            })
        }
        req.user = { id: usuario.id }
        return next()
    } catch (error) {
        console.error(error)
        return res.status(401).json({
            message: 'Acesso não autorizado',
        })
    }
}
module.exports = auth