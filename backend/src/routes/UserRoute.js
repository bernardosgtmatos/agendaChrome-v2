const express = require('express')
const {Novoagendamento, listAgendamentos, cancelarAgendamento} = require('../controllers/AgendamentoController')
const auth = require('../middleware/Authorization')
const { login, me, logout } = require('../controllers/UserControllers')

const UserRoute = express()
UserRoute.post('/login',login)
UserRoute.post('/logout',logout)
UserRoute.get('/me',auth,me)
UserRoute.post('/NovoAgendamento',auth,Novoagendamento)
UserRoute.post('/cancelarAgendamento',auth,cancelarAgendamento)
UserRoute.get('/ListAgendamentos', listAgendamentos)
module.exports = UserRoute