const {DataTypes, UUID, UUIDV4, STRING} = require('sequelize')
const sequelize = require('../config/Database')
const bcrypt = require('bcryptjs')

const Usuario = sequelize.define('Usuario',{
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
},{
    defaultScope:{
        attributes: {exclude: ['senha']}
    }
})
Usuario.beforeCreate(async (user) => {
    const salt = await bcrypt.genSalt(10)
    user.senha = await bcrypt.hash(user.senha, salt)
})

Usuario.beforeUpdate(async (user) => {
    if(user.changed('senha')){
        const salt = await bcrypt.genSalt(10);
        user.senha = await bcrypt.hash(user.senha, salt)
    }
})

Usuario.prototype.validSenha = async function (senha) {
    return await bcrypt.compare(senha, this.senha)
};

module.exports = Usuario