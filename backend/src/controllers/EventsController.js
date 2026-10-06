const { where } = require("sequelize")
const { horario_retirada, horarios_devolução } = require("../model/HorariosModel")
const Turmas = require("../model/TurmasModel")
const local = require("../model/LocalModel")
const { Usuario, Agendamento } = require("../model")
const { getOcupacao } = require("../services/EstoqueService")

const ListHorarios_ret = async (req,res) => {
    try {
    const horario_ret = await horario_retirada.findAll()
        return res.status(200).json(horario_ret)
    } catch (error) {
        return res.status(500).json({
            message: 'erro ao tentar listar os horarios',
            error: error.message
        })
    }
}

const ListHorarios_devol = async (req,res) => {
    try {
        const horario_devol = await horarios_devolução.findAll()
        return res.status(200).json(horario_devol)
    } catch (error) {
        return res.status(500).json({
            message: 'erro ao tentar listar os horarios',
            error: error.message
        })
    }
}

const ListTurmas = async (req,res) => {
    try {
        const listTurmas = await Turmas.findAll()
        return res.status(200).json(listTurmas)
    } catch (error) {
        return res.status(500).json({
            message: 'erro ao tentar listar as turmas',
            error: error.message
        })
    }
}

const listLocal = async (req,res) => {
    try {
        const Local = await local.findAll()
        return res.status(200).json(Local)
    } catch (error) {
        return res.status(500).json({
            message: 'erro ao tentar listar os locais',
            error: error.message
        })
    }
}
const listUsers = async (req,res) => {
    try {
        const listUsuarios = await Usuario.findAll()
        return res.status(200).json(listUsuarios)
    } catch (error) {
        return res.status(500).json({
            message: 'erro ao tentar listar usuarios',
            error: error.message
        })
    }
}

const listAgend = async (req,res) => {
    try {
        const list = await Agendamento.findAll()
        return res.status(200).json(list)        
    } catch (error) {
        return res.status(500).json({
            message: 'erro ao tentar listar agendamentos',
            error: error.message
        })
    }
    }

const getDisponibilidade = async (req,res) => {
    const {date, data_retirada, data_devolucao} = req.query
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
        return res.status(200).json(info)
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message
        })
    }
}

module.exports = {ListHorarios_ret,ListHorarios_devol,ListTurmas,listLocal,listUsers,listAgend,getDisponibilidade}