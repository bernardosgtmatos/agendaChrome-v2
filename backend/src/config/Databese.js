const { sequelize } = require('sequelize')
const path = require('path')

const sequelize = new sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: false,
    define:{
        timeStamp: true
    }
})
module.exports = sequelize;