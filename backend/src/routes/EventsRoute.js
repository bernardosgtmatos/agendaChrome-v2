const express = require('express')
const {ListHorarios_ret,ListHorarios_devol,ListTurmas,listLocal,listUsers, listAgend, getDisponibilidade} = require('../controllers/EventsController')

const EventRoute = express()

EventRoute.get('/listHorario_ret',ListHorarios_ret)
EventRoute.get('/listHorario_devol',ListHorarios_devol)
EventRoute.get('/listTurmas',ListTurmas)
EventRoute.get('/listLocal',listLocal)
EventRoute.get('/listUsers',listUsers)
EventRoute.get('/listAgend',listAgend)
EventRoute.get('/disponibilidade',getDisponibilidade)

module.exports = EventRoute