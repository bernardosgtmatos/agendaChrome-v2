const { where } = require('sequelize')
const Usuario = require('../model/UserModel')
const jwt = require('jsonwebtoken')

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
        const token = jwt.sign(
            {id: user.id, email:user.email},
            process.env.JWT_SECRET,
            {expiresIn : '7d'}
        )
        res.cookie('token', token,{
            httpOnly: true,
            secure:false, //ativar depois
            sameSite: 'strict',
            maxAge: 604800000
        })
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
module.exports = {login}