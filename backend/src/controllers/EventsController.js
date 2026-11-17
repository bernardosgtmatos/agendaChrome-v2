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
        const locais = await local.findAll()
        const lista = locais.map((item) => {
            const json = item.toJSON()
            const categoria = json.categoria || 'Local exclusivo'
            return {
                ...json,
                categoria,
                tipo: categoria,
                exclusivo: categoria !== 'Sala de aula',
                sala_de_aula: categoria === 'Sala de aula',
            }
        })
        return res.status(200).json(lista)
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
            const termoLower = String(termo).trim().toLowerCase()
            const usuarios = await Usuario.findAll({
                where: sequelize.where(sequelize.fn('lower', sequelize.col('nome')), 'LIKE', `%${termoLower}%`),
                attributes: ['id'],
                limit: 200,
            })
            const ids = usuarios.map((u) => u.id)
            const termoLower2 = String(termo).trim().toLowerCase()
            const condicoes = [sequelize.where(sequelize.fn('lower', sequelize.col('id')), 'LIKE', `${termoLower2}%`)]
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


const getDisponibilidadeMatriz = async (req, res) => {
    const { date, slots, local_ids } = req.body || {}
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: 'date deve estar no formato YYYY-MM-DD' })
    }
    if (!Array.isArray(slots) || slots.length === 0) {
        return res.status(400).json({ message: 'Informe ao menos um slot.' })
    }
    const idsLocais = Array.isArray(local_ids) ? local_ids.map(String) : []
    try {
        const [rets, devs] = await Promise.all([
            horario_retirada.findAll(),
            horarios_devolução.findAll(),
        ])
        const mapR = new Map(rets.map((r) => [String(r.horario_retirada).slice(0, 5), r.id]))
        const mapD = new Map(devs.map((d) => [String(d['horarios_devolução']).slice(0, 5), d.id]))

        const resultadoSlots = []
        const resultadoLocais = {}
        for (const id of idsLocais) resultadoLocais[id] = []

        for (const slot of slots) {
            const inicio = String(slot.inicio || '').slice(0, 5)
            const fim = String(slot.fim || '').slice(0, 5)
            const retId = mapR.get(inicio)
            const devId = mapD.get(fim)

            if (!retId || !devId) {
                resultadoSlots.push({
                    inicio,
                    fim,
                    semHorario: true,
                    total: null,
                    ocupado: null,
                    disponivel: null,
                    retirada: inicio,
                    devolucao: fim,
                })
                for (const id of idsLocais) {
                    resultadoLocais[id].push({
                        inicio,
                        fim,
                        semHorario: true,
                        ocupado: null,
                        por: null,
                        retirada: inicio,
                        devolucao: fim,
                        erro: false,
                    })
                }
                continue
            }

            const info = await getOcupacao(date, retId, devId)
            resultadoSlots.push({
                inicio,
                fim,
                semHorario: false,
                total: info.total,
                ocupado: info.ocupado,
                disponivel: info.disponivel,
                retirada: info.retirada,
                devolucao: info.devolucao,
            })

            for (const id of idsLocais) {
                const localInfo = await getOcupacaoLocal(date, id, retId, devId)
                resultadoLocais[id].push({
                    inicio,
                    fim,
                    semHorario: false,
                    ocupado: localInfo.ocupado,
                    por: localInfo.por,
                    retirada: localInfo.retirada,
                    devolucao: localInfo.devolucao,
                    erro: false,
                })
            }
        }

        return res.status(200).json({
            date,
            slots: resultadoSlots,
            locais: resultadoLocais,
        })
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Erro ao calcular disponibilidade.',
        })
    }
}

module.exports = {ListHorarios_ret,ListHorarios_devol,ListTurmas,listLocal,listUsers,listAgend,getDisponibilidade,getDisponibilidadeMatriz}