const express = require('express')
const {Novoagendamento} = require('../controllers/AgendamentoController')

const UserRoute = express()

UserRoute.post('/NovoAgendamento',Novoagendamento)

module.exports = UserRoute