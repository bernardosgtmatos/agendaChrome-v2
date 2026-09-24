const { DataTypes, UUIDV4 } = require('sequelize')
const sequelize = require('../config/Databese.js')
const bcrypt = require('bcryptjs')

const Admin = sequelize.define({
    id:{
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    nome:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    email:{
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate:{
            isEmail: true
        }
    },
    senha:{
        type: DataTypes.STRING,
        allowNull: false
    },
    defaultScope:{
        attributes:{ exclude: ['senha']}
    }
})

Admin.beforeCreate(async (user) => {
    const salt = await bcrypt.genSalt(10)
    user.senha = await bcrypt.hash(user.senha, salt)
})

Admin.beforeUpdate(async (user) => {
    const salt = await bcrypt.genSalt(10)
    user.senha = await bcrypt.hash(user.senha, salt)
})

Admin.prototype.validSenha = async function (senha) {
    return await bcrypt.compare(senha, this.senha)
}

module.exports = Admin