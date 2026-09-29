const express = require('express')
const {Novoagendamento, listAgendamentos} = require('../controllers/AgendamentoController')

const UserRoute = express()

UserRoute.post('/NovoAgendamento',Novoagendamento)
UserRoute.get('/ListAgendamentos', listAgendamentos)
module.exports = UserRoute