const { DataTypes } = require('sequelize')
const sequelize = require('../config/Database.js')
const { ESTOQUE_TOTAL } = require('../config/estoque.js')

const Capacidade = sequelize.define('Capacidade',{
    id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: 1,
        autoIncrement: false
    },
    estoque_total:{
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: ESTOQUE_TOTAL,
        validate:{
            min: 1
        }
    }
})

module.exports = Capacidade
