const {DataTypes, UUID, UUIDV4} = require('sequelize')
const sequelize = require('../config/Database.js')

const local = sequelize.define('local',{
    id:{
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    nome:{
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    }
})
module.exports = local