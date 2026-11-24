require('dotenv').config()

//import dos models 
const {Agendamento,Admin,horario_retirada,horarios_devolução,local,Turmas,Usuario} = require('./src/model/index.js')

const express = require('express')
const app = express()
const cors = require('cors')
const cookieParser = require('cookie-parser')
const rateLimiter = require('./src/middleware/RateLimit.js')

const port = process.env.PORT || 5000

app.set('trust proxy', 1)

//middleware
function normalizarOrigem(valor) {
    return String(valor || '')
        .split(',')
        .map((item) => item.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, ''))
        .filter(Boolean)
}

const origensPermitidas = [
    ...normalizarOrigem(process.env.FRONTEND_URL || 'http://localhost:5173'),
    ...normalizarOrigem(process.env.DEV_URL),
]
app.use(cors({
  origin: origensPermitidas,
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())
app.use(rateLimiter)

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }))

app.get('/internal/sincronizar-status', async (req, res) => {
    if (!process.env.CRON_SECRET || req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
        return res.status(401).json({ message: 'Não autorizado.' })
    }
    try {
        const total = await finalizarAgendamentosPassados()
        return res.status(200).json({ finalizados: total })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erro ao sincronizar status.' })
    }
})

//rotas import
const AdminRoute = require('./src/routes/AdminRoute.js')
const sequelize = require('./src/config/Database.js')
const UserRoute = require('./src/routes/UserRoute.js')
const EventRoute = require('./src/routes/EventsRoute.js')
const { registrarStatusEmail } = require('./src/services/EmailService.js')
const { finalizarAgendamentosPassados } = require('./src/services/AgendamentoStatusService.js')


//rotas
app.use('/admin', AdminRoute)
app.use('/usuario',UserRoute)
app.use('/events',EventRoute)

const databaseSYNC = async () => {
    try {
        await sequelize.authenticate()
        await sequelize.sync({})
    } catch (error) {
        console.error('Erro ao preparar o banco no arquivo server.js:', error.message)
        throw error
    }
}

const iniciar = async () => {
    try {
        await databaseSYNC()
        registrarStatusEmail()
        await finalizarAgendamentosPassados().catch((erro) => {
            console.error('erro ao sincronizar status de agendamentos na inicialização:', erro)
        })
        setInterval(() => {
            finalizarAgendamentosPassados().catch((erro) => {
                console.error('erro ao sincronizar status de agendamentos:', erro)
            })
        }, 5 * 60 * 1000)
        app.listen(port, () => {
            console.log(`server rodando na porta ${port}`);
        })
    } catch {
        process.exitCode = 1
    }
}

iniciar()