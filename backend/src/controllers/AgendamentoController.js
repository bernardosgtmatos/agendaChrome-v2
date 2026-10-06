
const { where } = require("sequelize")
const sequelize = require("../config/Database")
const { horario_retirada, horarios_devolução } = require("../model/HorariosModel")
const Turmas = require("../model/TurmasModel")
const local = require("../model/LocalModel")
const Usuario = require("../model/UserModel")
const Agendamento = require("../model/AgendamentoModel")



const Novoagendamento = async (req,res) => {
    const t = await sequelize.transaction()
    const usuario_id = req.user.id
    console.log(usuario_id)
    const {data_retirada, data_devolucao, quantidade, turma, Local, observacao } = req.body
    if(!usuario_id||!data_retirada||!data_devolucao||!quantidade||!turma||!Local){
        await t.rollback()
        return res.status(400).json({
            message: 'todos os campos são obrigatórios (exceto obs.)'
        })
    }
    const ValidQnt = typeof(quantidade) === 'number' &&  Number.isInteger(quantidade) && quantidade > 0;
    if(!ValidQnt){
        console.error(`quantidade de chromebooks inválida ${quantidade}`)
        await t.rollback()
        return res.status(400).json({
            message: 'quantidade de chromebooks deve ser maior que ZERO'
        })
        
    }
    //validação com o banco
    try { //try de validação
        
        //valida horario retirada
        const DB_data_ret = await horario_retirada.findOne({where:{ id: data_retirada}})
        console.log((data_retirada));
        
        if (!DB_data_ret){
            console.error('Horario de retirada inexistente')
            await t.rollback()
            return res.status(404).json({
                message: 'Horario de retirada inexistente!'
            })
        }
        // valida horario devolução
        const DB_data_devol = await horarios_devolução.findOne({where: {id: data_devolucao}})
        if(!DB_data_devol){
            console.error('Horario de devolução inexistente')
            await t.rollback()
            return res.status(404).json({
                message: 'Horario de devolução inexistente'
            })
        }
        const DB_turma = await Turmas.findOne({where:{id: turma}})
        if(!DB_turma){
            console.error('Turma requisitada não existe na tabela')
            await t.rollback()
            return res.status(404).json({
                message: 'Turma requisitada não existe no sistema'
            })
        }
        const DB_local = await local.findOne({where: {id: Local}})
        if(!DB_local){
            console.error('Local requisitado não existe na tabela')
            await t.rollback()
            return res.status(404).json({
                message:'Local requisitado não existe no sistema!'
            })
        }
        const DB_User = await Usuario.findOne({where:{id: usuario_id}})
        if(!DB_User){
            console.error('Usuario não existe')
            await t.rollback()
            return res.status(404).json({
                message: 'Este usuario não existe!'
            })
        }
        try {
            const Novoagendamento = await Agendamento.create({
                usuario_id: DB_User.id,
                data_retirada: DB_data_ret.id,
                data_devolucao: DB_data_devol.id,
                quantidade: Number(quantidade),
                turma: DB_turma.id,
                local_id: DB_local.id,
                observacao: observacao
            },
                {transaction: t,}
            )
            await t.commit()
            await console.log(`Agendamento realizado User_ID : ${DB_User.id}, Agendamento_ID: ${Novoagendamento.id}`)        
            return res.status(201).json({
                message: `Agendamento para o realizado com sucesso para o dia:`,
                agendamento_id: Novoagendamento.id 
            })
        } catch (error) {
            if(!t.finished){
                await t.rollback()
            }
            console.error(`erro dentro do try Agendamento.create, ${error}`)
            return res.status(500).json({
                message: 'Erro ao tentar realizar agendamento!',
            })
            
        }
    } catch (error) {
        console.error(`Erro antes do try Agendamento.create, ${error}`)
        return res.status(500).json({
            message: 'erro ao tentar realizar agendamento',
        })
    }
    
}


const listAgendamentos = async (req,res) => {
    try {
        const agendamentos = await Agendamento.findAll()
        console.log('agendamentos listados',agendamentos)
        return res.status(200).json({
            lista: agendamentos,
        })
    } catch (error) {
        return res.status(500).json({
            message:'erro ao tentar listar os agendamentos',
            error: error.message
        })
    }
}

const cancelarAgendamento = async (req,res) => {
    const usuario_id = req.user.id
    const {agendamento_id} = req.body // esse user_id deve vir do cookie-peaser e ser comparado
    const t = await sequelize.transaction()
    if(!agendamento_id){
        console.log('agendamento_id inexistente')
        await t.rollback()
        return res.status(404).json({
            message: 'O agendamento requisistado para o cancelamento não existe mais!'
        })
    }
    if(!usuario_id){
        console.log('Usuario que requisitou o cancelamento não tem ID')
        await t.rollback()
        return res.status(404).json({
            message: 'Seu id não esta cadastrado na plataforma!'
        })
    }
    try {
        const Agend_id = await Agendamento.findOne({where:{id:agendamento_id, usuario_id: usuario_id}, transaction: t}) // talvez se der algum erro com relacionamento entre agendamento e user : "Você busca todos os agendamentos do usuário e tenta comparar com um único ID. O correto é buscar diretamente o agendamento pelo id e pelo usuario_id, ou então buscar pelo id e comparar o usuario_id da linha."
        if(!Agend_id ){ 
            console.log('ID do agendamento nao existe na tabela.')
            await t.rollback()
            return res.status(404).json({
                message: 'Este agendamento nã́o existe, ou ja foi cancelado.'
            })
        }
        if(Agend_id.usuario_id !== usuario_id){
            await t.rollback()
            console.log('usuario esta tentando cancelar agendamento que não lhe pertence')
            await t.rollback()
            return res.status(403).json({
                message: 'Este agendamento não pertence a você, Porfavor selecione apenas os agendamentos pertencentes a você.'
            })
        }
        if(Agend_id.status == 'cancelado'){
            return res.status(404).json({
                message: 'Este agendamento ja foi cancelado.'
            })
        }
        
        const cancelar = await Agend_id.update({status: 'Cancelado'},{transaction: t})
        console.log(`agendamento cancelado com sucesso`)
        await t.commit()
        return res.status(200).json({
            message: 'Agendamento cancelado com sucesso!'
        })
    
    } catch (error) {
        console.error(error)
        if (!t.finished){
            await t.rollback()
        }
        return res.status(500).json({
            message: 'Erro interno do servidor tente mais tarde.'
        })
    }
}
module.exports = {Novoagendamento, listAgendamentos, cancelarAgendamento}