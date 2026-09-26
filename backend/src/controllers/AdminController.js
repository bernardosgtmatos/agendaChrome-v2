const Admin = require('../model/AdminModel.js')
const local = require('../model/LocalModel.js')
const Usuario = require('../model/UserModel')

const createAdminUser = async (req,res) => {
    const {nome, email, senha} = req.body
    if(!nome||!email||!senha){
        return res.status(400).json(`Todos os campos são obrigatórios!`)
    }
    const existUser = await Admin.findOne({
        where: {email}
    })
    if (existUser){
        return res.status(500).json(`Este email ja esta sendo utilizado!`)
    }
    try {
        const NewUser = Admin.create({
            nome,
            email,
            senha
        })
        return res.status(201).json(`usuario ${nome}, criado com sucesso!`)
    } catch (error) {
        return res.status(400).json(`erro ao tentar criar novo usuario, ${error}`)
    }
}

const createNewUsuario = async (req, res) => {
    const {nome, email, senha} = req.body
    if(!nome||!email||!senha){
        return res.status(400).json(`Todos os campos são obrigatórios!`)
    }
    const existUser = await Usuario.findOne({
        where: {email}
    })
    if (existUser){
        return res.status(500).json(`Este email ja esta sendo utilizado!`)
    }
    try {
        const NewUser = await Usuario.create({
            nome,
            email,
            senha
        })
        return res.status(201).json(`Usuario ${nome}, criado com sucesso!`)
    } catch (error) {
       return res.status(400).json(`erro ao tentar criar novo usuario, ${error}`)
    }
}

const novaTurma = async (req,res) => {
    const {serie} = req.body
    if(!serie){
        return res.status(400).json(`Todos os campos são obrigatórios`)
    }
    try {
        const novaTurma = await Turmas.create({
            serie
        })
    } catch (error) {
        return res.status(500).json(`erro ao tentar criar nova turma, ${error}`)
    }
}

const novoLocal = async (req,res) => {
    const {nome} = req.body
    if(!nome){
        return res.status(400).json(`todos os campos são obrigatórios`)
    }
    try {
        const novoLocal = await local.create({
            nome
        })
    } catch (error) {
        return res.status(500).json(`erro ao tentar criar novo local, ${error}`)
    }
}


module.exports = {createAdminUser, createNewUsuario, novaTurma, novoLocal}