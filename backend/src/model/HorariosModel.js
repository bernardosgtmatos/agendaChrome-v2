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
        type: DataTypes.DATEONLY,
        allowNull: false
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
        type: DataTypes.DATEONLY,
        allowNull: false
    }
})

module.exports = {horario_retirada, horarios_devolução}