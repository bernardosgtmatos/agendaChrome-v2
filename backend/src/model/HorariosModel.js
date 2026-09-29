const {DataTypes, UUIDV4} = require('sequelize')
const sequelize = require('../config/Database.js')

const horario_retirada = sequelize.define('horarios_retirada',{
    id:{
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    horario_retirada:{
        // cada linha é um horário do dia (07:00, 07:50, 09:00 ...), não uma data
        type: DataTypes.TIME,
        allowNull: false,
        unique: true
    }
})

const horarios_devolução = sequelize.define('horario_devolucao',{
    id:{
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    horarios_devolução:{
        // cada linha é um horário do dia (07:00, 07:50, 09:00 ...), não uma data
        type: DataTypes.TIME,
        allowNull: false,
        unique: true
    }
})

module.exports = {horario_retirada, horarios_devolução}