const { DataTypes, UUIDV4 } = require('sequelize')
const sequelize = require('../config/Database')

const RecuperacaoSenha = sequelize.define('RecuperacaoSenha', {
    id: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    usuario_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    codigo_hash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    expira_em: {
        type: DataTypes.DATE,
        allowNull: false
    },
    tentativas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    usado_em: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    indexes: [
        { fields: ['usuario_id'] },
        { fields: ['expira_em'] }
    ]
})

module.exports = RecuperacaoSenha
