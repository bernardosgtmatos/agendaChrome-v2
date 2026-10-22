const express = require('express')
const {
    createNewUsuario,
    editUsuario,
    DeleteUsuario,
    novaTurma,
    editTurma,
    DeleteTurma,
    novoLocal,
    editLocal,
    DeleteLocal,
    consultarCapacidade,
    alterarCapacidade,
} = require('../controllers/AdminController')
const auth = require('../middleware/Authorization')
const adminAuth = require('../middleware/AdminAuthorization')

const AdminRoute = express()

AdminRoute.use(auth, adminAuth)

AdminRoute.post('/usuarios', createNewUsuario)
AdminRoute.post('/newuser', createNewUsuario)
AdminRoute.patch('/usuarios/:id', editUsuario)
AdminRoute.delete('/usuarios/:id', DeleteUsuario)

AdminRoute.post('/turmas', novaTurma)
AdminRoute.post('/NovaTurma', novaTurma)
AdminRoute.patch('/turmas/:id', editTurma)
AdminRoute.patch('/EditTurma/:id', editTurma)
AdminRoute.delete('/turmas/:id', DeleteTurma)
AdminRoute.delete('/DeleteTurma/:id', DeleteTurma)
AdminRoute.post('/DeleteTurma', DeleteTurma)

AdminRoute.post('/locais', novoLocal)
AdminRoute.patch('/locais/:id', editLocal)
AdminRoute.delete('/locais/:id', DeleteLocal)

AdminRoute.get('/capacidade', consultarCapacidade)
AdminRoute.patch('/capacidade', alterarCapacidade)

module.exports = AdminRoute
