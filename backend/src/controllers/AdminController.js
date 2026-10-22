const {Turmas,local,Usuario} = require('../model/index.js')
const sequelize = require('../config/Database.js')

// const createAdminUser = async (req,res) => { // fazer um controler só pra criar o usuario admin para passar em outra rota com auth mais rigido
//     const {nome, email, senha} = req.body
//     if(!nome||!email||!senha){
//         return res.status(400).json(`Todos os campos são obrigatórios!`)
//     }
//     const existUser = await Admin.findOne({
//         where: {email}
//     })
//     if (existUser){
//         return res.status(500).json(`Este email ja esta sendo utilizado!`)
//     }
//     try {
//         const NewUser = Admin.create({
//             nome,
//             email,
//             senha
//         })
//         return res.status(201).json(`usuario ${nome}, criado com sucesso!`)
//     } catch (error) {
//         return res.status(400).json(`erro ao tentar criar novo usuario, ${error}`)
//     }
// }

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
        return res.status(200).json({
            message:'Turma criada com sucesso!'
        })
    } catch (error) {
        return res.status(500).json(`erro ao tentar criar nova turma, ${error}`)
    }
}
const editTurma = async (req,res) => {
    // const t = await sequelize.transaction()
    try {
        const {id,nome} = req.body // fazer essa rota como metodo patch req.params.id
        if(!id){
            return res.status(400).json({
                message:'id da turma não fornecido'
            })
        }
        if(!nome){
            return res.status(400).json({
                message:'nome novo da turma não fornecido!'
            })
        }
        const Turma = await Turmas.findOne({where:{id: id}})
        if(!Turma){
            return res.status(404).json({
                message:'Turma não encontrada'
            })
        }
        await Turma.update({serie: nome})
        return res.status(200).json({
            message:'nome da turma alterado com sucesso.'
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message:'Erro ao tentar editar turma.'
        })
    }
}
const DeleteTurma = async (req,res) => { // funções que alteram o banco nesse nivel devem ter log.
    try {
        const {id}= req.body
        if(!id){
            return res.status(400).json({
                message:'id não forncido.'
            })
        }
        const Turma = await Turmas.findOne({where:{id: id}})
        if(!Turma){
            return res.status(404).json({
                message:'Turma requisitada não existe ou ja foi deletada.'
            })
        }
        await Turma.destroy()
        return res.status(200).json({
            message:'Turma excluida com sucesso.'
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message:'Error ao tentar apagar turma.'
        })
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

const editLocal = async (req,res) => {
    try {
        const {id} = req.params
        const {nome} = req.body //tem que mudar o metodo http para patch
        if(!id||!nome){
            return res.status(400).json({
                message:'Todos os campos são obrigatórios.'
            })
        }
        const Local = await local.findOne({where:{id:id}})
        if(!Local){
            return res.status(404).json({
                message:'Local não encontrado.'
            })
        }
        await Local.update({nome:nome})
        return res.status(200).json({
            message:'Local editado com sucesso.'
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message:'Erro ao tentar editar local'
        })
    }
}
const DeleteLocal = async (req,res) => {
    try {
        const {id} = req.body //trocar para metodo patch
        if(!id){
            return res.status(400).json({
                message:'id do local não fornecido.'
            })
        }
        const Local = await local.findOne({where:{id:id}})
        if(!Local){
            return res.status(400).json({
                message:'este id não pertence a nenhum local.'
            })
        }
        await Local.destroy()
        return res.status(200).json({
            message:'Local deletado com sucesso.'
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message:'Erro ao tentar deletar local.'
        })
    }
}


module.exports = {createNewUsuario, novaTurma, editTurma, DeleteTurma, novoLocal, editLocal, DeleteLocal}