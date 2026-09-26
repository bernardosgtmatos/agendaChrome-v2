require('dotenv').config()
const sequelize = require('./src/config/Database')

const {Admin,horario_retirada,horarios_devolução,Turmas,local,Agendamento,Usuario} = require('./src/model/index')

const seed = async () => {
    try {
        // await sequelize.sync()
        const ExistAdmin = await Admin.findOne({where : {email: 'admin@gmail.com'}})
        const ExistHorario_ret = await horario_retirada.findAll({attributes:{exclude:['id']}}) //teoricamente é para ele listar todas as linhas e filtrar com o where apenas a coluna horario_retirada
        const ExistHorario_devol = await horarios_devolução.findAll({attributes:{exclude:['id']}})
        const ExistTurmas = await Turmas.findAll({attributes:{exclude:['id']}})
        const ExistLocal = await local.findAll({attributes:{exclude:['id']}})


    } catch (error) {
        return console.error(`Erro ao tentar inicar seed, ${error}`)
    }
}

seed()