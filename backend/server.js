require('dotenv').config()

const express = require('express')
const app = express()
const cors = require('cors')

port = process.env.PORT || 5000

//middleware
app.use(cors())
app.use(express.json)

//rotas import
const AdminRoute = require('./src/routes/AdminRoute.js')

//rotas

app.user('/admin', AdminRoute)

//listen
app.listen(port, () =>{
    console.log(`server rodando na porta ${port}`);
})