const { where } = require("sequelize")
const { horario_retirada, horario_retirada, horarios_devolução } = require("../model/HorariosModel")
const Turmas = require("../model/TurmasModel")
const local = require("../model/LocalModel")

const ListHorarios_ret = async (res) => {
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

const ListHorarios_devol = async (res) => {
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

const ListTurmas = async (res) => {
    try {
        const Turmas = await Turmas.findAll()
        return res.status(200).json(Turmas)
    } catch (error) {
        return res.status(500).json({
            message: 'erro ao tentar listar as turmas',
            error: error.message
        })
    }
}

const listLocal = async (res) => {
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