const express = require('express')
const { createAdminUser, createNewUsuario } = require('../controllers/AdminController')


const AdminRoute = express()

//aplicar o middleware auth dpsss emm


AdminRoute.post('/newadmin', createAdminUser)
AdminRoute.post('/newuser', createNewUsuario)

module.exports = AdminRoute