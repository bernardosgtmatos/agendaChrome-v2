const { Sequelize } = require('sequelize')
const path = require('path')

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../Database.sqlite'),
    logging: false,
    define:{
        timestamps: true
    }
})
module.exports = sequelize;