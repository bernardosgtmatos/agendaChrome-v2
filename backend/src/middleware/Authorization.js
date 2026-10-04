const jwt = require('jsonwebtoken')

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
        req.user = { id : validToken.id}
        next()
    } catch (error) {
        console.error(error)
        return res.status(401).json({
            message: 'Acesso não autorizado',
        })
    }
}
module.exports = auth