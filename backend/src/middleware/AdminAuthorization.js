const Usuario = require('../model/UserModel')

const adminAuth = async (req,res,next) => {
    try {
        if(!req.user?.id){
            return res.status(401).json({
                message: 'Acesso não autorizado.'
            })
        }
        const usuario = await Usuario.findByPk(req.user.id)
        if(!usuario){
            return res.status(401).json({
                message: 'Sessão inválida.'
            })
        }
        if(usuario.perfil !== 'Coordenador'){
            return res.status(403).json({
                message: 'Acesso restrito a coordenadores.'
            })
        }
        req.admin = usuario
        return next()
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: 'Erro ao validar permissão de acesso.'
        })
    }
}

module.exports = adminAuth
