require('dotenv').config()

//import dos models 
const {Agendamento,Admin,horario_retirada,horarios_devolução,local,Turmas,Usuario} = require('./src/model/index.js')

const express = require('express')
const app = express()
const cors = require('cors')
const cookieParser = require('cookie-parser')

const port = process.env.PORT || 5000

//middleware
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

//rotas import
const AdminRoute = require('./src/routes/AdminRoute.js')
const sequelize = require('./src/config/Database.js')
const UserRoute = require('./src/routes/UserRoute.js')
const EventRoute = require('./src/routes/EventsRoute.js')


//rotas
app.use('/admin', AdminRoute)
app.use('/usuario',UserRoute)
app.use('/events',EventRoute)

const databaseSYNC = async () => {
    try {
        await sequelize.authenticate()
        await sequelize.sync({})
    } catch (error) {
        return console.error(`'erro no authenticate do sequelize no arquivo serve.js, ${error}`)
    }

}

//listen
app.listen(port, () =>{
    databaseSYNC()
    console.log(`server rodando na porta ${port}`);
})