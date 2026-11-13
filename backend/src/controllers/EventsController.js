const { where, Op } = require("sequelize")
const { horario_retirada, horarios_devolução } = require("../model/HorariosModel")
const Turmas = require("../model/TurmasModel")
const local = require("../model/LocalModel")
const { Usuario, Agendamento } = require("../model")
const { getOcupacao, getOcupacaoLocal } = require("../services/EstoqueService")
const { finalizarAgendamentosPassados } = require("../services/AgendamentoStatusService")
const sequelize = require('../config/Database')

const ListHorarios_ret = async (req,res) => {
    try {
    const horario_ret = await horario_retirada.findAll()
        return res.status(200).json(horario_ret)
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: 'erro ao tentar listar os horarios',
            // error: error.message
        })
    }
}

const ListHorarios_devol = async (req,res) => {
    try {
        const horario_devol = await horarios_devolução.findAll()
        return res.status(200).json(horario_devol)
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: 'erro ao tentar listar os horarios',
            // error: error.message
        })
    }
}

const ListTurmas = async (req,res) => {
    try {
        const listTurmas = await Turmas.findAll()
        return res.status(200).json(listTurmas)
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: 'erro ao tentar listar as turmas',
            // error: error.message
        })
    }
}

const listLocal = async (req,res) => {
    try {
        const Local = await local.findAll()
        return res.status(200).json(Local)
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: 'erro ao tentar listar os locais',
            // error: error.message
        })
    }
}
const listUsers = async (req,res) => {
    try {
        const listUsuarios = await Usuario.findAll({
            attributes: { exclude: ['senha', 'token_version'] }
        })
        return res.status(200).json(listUsuarios)
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: 'erro ao tentar listar usuarios',
            // error: error.message
        })
    }
}

const listAgend = async (req,res) => {
    const {p,l,q,solicitante,turma,local,status} = req.query 
    let page = Number(p)
    let limit = Number(l)
    if(!Number.isInteger(page)||!Number.isInteger(limit)){
        page = 1
        limit = 10
    }
    if(page<=0||limit<=0){
        page =1
        limit=10
    }
    if(limit > 100||limit <= 0){
        return res.status(400).json({
            message:'limite de paginação incoerrente'
        })
    }
    try {
        await finalizarAgendamentosPassados().catch((erro) => {
            console.error('erro ao sincronizar status de agendamentos:', erro)
        })
        const offset = (page -1)*limit
        const where = {}
        if (status && status !== 'todos' && status !== 'all') where.status = status
        if (solicitante && solicitante !== 'todos' && solicitante !== 'all') where.usuario_id = solicitante
        if (turma && turma !== 'todos' && turma !== 'all') where.turma = turma
        if (local && local !== 'todos' && local !== 'all') where.local_id = local
        if (q && String(q).trim()) {
            const termo = String(q).trim()
            const usuarios = await Usuario.findAll({
                where: { nome: { [Op.like]: `%${termo}%` } },
                attributes: ['id'],
                limit: 200,
            })
            const ids = usuarios.map((u) => u.id)
            const condicoes = [{ id: { [Op.like]: `${termo}%` } }]
            if (ids.length) condicoes.push({ usuario_id: { [Op.in]: ids } })
            where[Op.or] = condicoes
        }
        const {rows, count} = await Agendamento.findAndCountAll({
            where,
            limit,
            offset,
            order: [['date', 'DESC']],
        })
        const totalPages = Math.ceil(count/limit) || 1
        return res.status(200).json({
            meta: {
                total: count,
                page,
                limit,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
            lista: rows
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message:'Erro ao tentar carregar a lista, por favor recarregue a pagina.'
        })
    }
}

const getDisponibilidade = async (req,res) => {
    const {date, data_retirada, data_devolucao, local_id} = req.query
    if(!date||!data_retirada||!data_devolucao){
        return res.status(400).json({
            message: 'Informe date (YYYY-MM-DD), data_retirada e data_devolucao'
        })
    }
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){
        return res.status(400).json({
            message: 'date deve estar no formato YYYY-MM-DD'
        })
    }
    try {
        const info = await getOcupacao(date, data_retirada, data_devolucao)
        if(!local_id){
            return res.status(200).json({ ...info, local: null })
        }
        const localInfo = await getOcupacaoLocal(date, local_id, data_retirada, data_devolucao)
        return res.status(200).json({ ...info, local: localInfo })
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        })
    }
}

module.exports = {ListHorarios_ret,ListHorarios_devol,ListTurmas,listLocal,listUsers,listAgend,getDisponibilidade}