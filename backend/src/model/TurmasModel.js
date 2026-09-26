const {DataTypes, UUIDV4} = require('sequelize')
const sequelize = require('../config/Database.js')

const Turmas = sequelize.define('Turmas',{
    id:{
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    serie:{
        type: DataTypes.STRING,
        allowNull: false
    }
})

module.exports = Turmas