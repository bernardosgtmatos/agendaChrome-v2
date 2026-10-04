const express = require('express')
const {Novoagendamento, listAgendamentos, cancelarAgendamento} = require('../controllers/AgendamentoController')
const auth = require('../middleware/Authorization')
const { login } = require('../controllers/UserControllers')

const UserRoute = express()
UserRoute.post('/login',login)
UserRoute.post('/NovoAgendamento',auth,Novoagendamento)
UserRoute.post('/cancelarAgendamento',auth,cancelarAgendamento)
UserRoute.get('/ListAgendamentos', listAgendamentos)
module.exports = UserRoute