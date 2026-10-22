const {Agendamento,Capacidade,Turmas,local,Usuario} = require('../model/index.js')
const { ESTOQUE_TOTAL } = require('../config/estoque.js')

const PERFIS = ['Coordenador', 'Professor']

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
    const perfil = req.body.perfil ?? 'Professor'
    if(!nome||!email||!senha){
        return res.status(400).json({
            message: 'Todos os campos são obrigatórios!'
        })
    }
    if(!PERFIS.includes(perfil)){
        return res.status(400).json({
            message: 'Perfil inválido. Use Coordenador ou Professor.'
        })
    }
    try {
        const existUser = await Usuario.findOne({
            where: {email}
        })
        if (existUser){
            return res.status(409).json({
                message: 'Este email já está sendo utilizado!'
            })
        }
        await Usuario.create({
            nome,
            email,
            senha,
            perfil
        })
        return res.status(201).json({
            message: `Usuário ${nome} criado com sucesso!`
        })
    } catch (error) {
       console.error(error)
       return res.status(400).json({
           message: 'Erro ao tentar criar novo usuário.'
       })
    }
}

const editUsuario = async (req, res) => {
    try {
        const { id } = req.params
        const { nome, email, senha } = req.body
        if(!id){
            return res.status(400).json({
                message: 'id do usuário não fornecido.'
            })
        }
        const usuario = await Usuario.scope(null).findByPk(id)
        if(!usuario){
            return res.status(404).json({
                message: 'Usuário não encontrado.'
            })
        }
        if(email && email !== usuario.email){
            const existUser = await Usuario.findOne({ where: { email } })
            if(existUser){
                return res.status(409).json({
                    message: 'Este email já está sendo utilizado!'
                })
            }
        }
        const dados = {}
        if(nome !== undefined){
            if(!nome.trim()) return res.status(400).json({ message: 'O nome não pode ficar vazio.' })
            dados.nome = nome.trim()
        }
        if(email !== undefined){
            if(!email.trim()) return res.status(400).json({ message: 'O email não pode ficar vazio.' })
            dados.email = email.trim()
        }
        if(senha) dados.senha = senha

        await usuario.update(dados)
        return res.status(200).json({
            message: 'Usuário atualizado com sucesso.'
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: 'Erro ao tentar editar usuário.'
        })
    }
}

const DeleteUsuario = async (req, res) => {
    try {
        const { id } = req.params
        if(!id){
            return res.status(400).json({
                message: 'id do usuário não fornecido.'
            })
        }
        if(id === req.user.id){
            return res.status(400).json({
                message: 'Você não pode excluir a sua própria conta.'
            })
        }
        const usuario = await Usuario.findByPk(id)
        if(!usuario){
            return res.status(404).json({
                message: 'Usuário não encontrado.'
            })
        }
        const agendamentos = await Agendamento.count({ where: { usuario_id: id } })
        if(agendamentos > 0){
            return res.status(409).json({
                message: 'Este usuário possui agendamentos e não pode ser excluído.'
            })
        }
        await usuario.destroy()
        return res.status(200).json({
            message: 'Usuário excluído com sucesso.'
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: 'Erro ao tentar excluir usuário.'
        })
    }
}

const novaTurma = async (req,res) => {
    const serie = req.body.serie ?? req.body.nome
    if(!serie || !serie.trim()){
        return res.status(400).json({
            message: 'Todos os campos são obrigatórios'
        })
    }
    try {
        const existente = await Turmas.findOne({ where: { serie: serie.trim() } })
        if(existente){
            return res.status(409).json({
                message: 'Já existe uma turma com este nome.'
            })
        }
        await Turmas.create({
            serie: serie.trim()
        })
        return res.status(201).json({
            message:'Turma criada com sucesso!'
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: 'Erro ao tentar criar nova turma.'
        })
    }
}
const editTurma = async (req,res) => {
    try {
        const id = req.params.id ?? req.body.id
        const nome = req.body.nome ?? req.body.serie
        if(!id){
            return res.status(400).json({
                message:'id da turma não fornecido'
            })
        }
        if(!nome || !nome.trim()){
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
        const existente = await Turmas.findOne({ where: { serie: nome.trim() } })
        if(existente && existente.id !== Turma.id){
            return res.status(409).json({
                message: 'Já existe uma turma com este nome.'
            })
        }
        await Turma.update({serie: nome.trim()})
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
        const id = req.params.id ?? req.body.id
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
        const agendamentos = await Agendamento.count({ where: { turma: id } })
        if(agendamentos > 0){
            return res.status(409).json({
                message: 'Esta turma possui agendamentos e não pode ser excluída.'
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
    if(!nome || !nome.trim()){
        return res.status(400).json({
            message: 'Todos os campos são obrigatórios'
        })
    }
    try {
        const existente = await local.findOne({ where: { nome: nome.trim() } })
        if(existente){
            return res.status(409).json({
                message: 'Já existe um local com este nome.'
            })
        }
        await local.create({
            nome: nome.trim()
        })
        return res.status(201).json({
            message: 'Local criado com sucesso.'
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: 'Erro ao tentar criar novo local.'
        })
    }
}

const editLocal = async (req,res) => {
    try {
        const {id} = req.params
        const {nome} = req.body
        if(!id||!nome || !nome.trim()){
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
        const existente = await local.findOne({ where: { nome: nome.trim() } })
        if(existente && existente.id !== Local.id){
            return res.status(409).json({
                message: 'Já existe um local com este nome.'
            })
        }
        await Local.update({nome:nome.trim()})
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
        const id = req.params.id ?? req.body.id
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
        const agendamentos = await Agendamento.count({ where: { local_id: id } })
        if(agendamentos > 0){
            return res.status(409).json({
                message: 'Este local possui agendamentos e não pode ser excluído.'
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

const consultarCapacidade = async (req,res) => {
    try {
        const [configuracao] = await Capacidade.findOrCreate({
            where: { id: 1 },
            defaults: { estoque_total: ESTOQUE_TOTAL }
        })
        return res.status(200).json({
            estoque_total: Number(configuracao.estoque_total)
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: 'Erro ao tentar consultar a capacidade.'
        })
    }
}

const alterarCapacidade = async (req,res) => {
    try {
        const estoque_total = Number(req.body.estoque_total)
        if(!Number.isInteger(estoque_total) || estoque_total < 1){
            return res.status(400).json({
                message: 'A capacidade deve ser um número inteiro maior que zero.'
            })
        }
        const [configuracao] = await Capacidade.findOrCreate({
            where: { id: 1 },
            defaults: { estoque_total }
        })
        await configuracao.update({ estoque_total })
        return res.status(200).json({
            message: 'Capacidade alterada com sucesso.',
            estoque_total
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: 'Erro ao tentar alterar a capacidade.'
        })
    }
}


module.exports = {
    createNewUsuario,
    editUsuario,
    DeleteUsuario,
    novaTurma,
    editTurma,
    DeleteTurma,
    novoLocal,
    editLocal,
    DeleteLocal,
    consultarCapacidade,
    alterarCapacidade
}