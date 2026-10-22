const express = require('express')
const { createAdminUser, createNewUsuario, novaTurma, editTurma, DeleteTurma } = require('../controllers/AdminController')


const AdminRoute = express()

//aplicar o middleware auth dpsss emm


// AdminRoute.post('/newadmin', createAdminUser)
AdminRoute.post('/newuser', createNewUsuario)
AdminRoute.post('/NovaTurma', novaTurma)
AdminRoute.patch('/EditTurma:id', editTurma) // trocar para metodo patch
AdminRoute.post('/DeleteTurma', DeleteTurma) // trocar para metodo patch

module.exports = AdminRoute