const {DataTypes, Model, UUID, UUIDV4} = require('sequelize')
const sequelize = require('../config/Database.js')
const Usuario = require('./UserModel.js')
const { horario_retirada, horarios_devolução } = require('./HorariosModel.js')
const Turmas = require('./TurmasModel.js')
const local = require('./LocalModel.js')

const Agendamento = sequelize.define('Agendamento',{
    id:{
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    usuario_id:{
        // pega id do usuario
        type: DataTypes.UUID,
        allowNull: false,
        references:{
            Model: Usuario,
            Key: 'id'
        }
    },
    date:{
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW,
        allowNull: false
    },
    data_retirada:{
        //vem da tabela horario_retirada
        type: DataTypes.UUID,
        allowNull: false,
        references:{
            Model: horario_retirada,
            Key: 'id'
        }
    },
    data_devolucao:{
        // vem da tabela horario_devolucao
        type: DataTypes.UUID,
        allowNull: false,
        references:{
            Model: horarios_devolução,
            Key: 'id'
        }
    },
    quantidade:{
        type: DataTypes.INTEGER,
        allowNull: false,
        validate:{ min: 1 },
    },
    turma:{
        // vem da tabela turma
        type: DataTypes.UUID,
        allowNull: false,
        references:{
            Model: Turmas,
            Key: 'id'
        }
    },
    local_id:{
        // vem da tabela local
        type: DataTypes.UUID,
        allowNull: false,
        references:{
            Model: local,
            Key: 'id'
        }
    },
    observacao:{
        type: DataTypes.STRING,
        allowNull: true
    },
    status:{
        type: DataTypes.ENUM('Pendente','Em progresso','Finalizado','Cancelado'),
        defaultValue: 'Pendente',
        allowNull: false
    }
},{
    indexes:[{fields:['date']},{fields:['status']}]
})

// ta invertido as associações, todos os belongs vão para tabela agendamento
//belongs é quem recebe a FK

//inverter todas as associações ex: 
//  agendamento.hasOne -> agendamento.belongsTo
//  usuario.belongsTo -> usuario.hasOne

// Usuario.hasMany(Agendamento,{foreignKey:{usuario_id: 'usuario_id'}})
// Agendamento.belongsTo(Usuario,{foreignKey:{usuario_id: 'usuario_id'}})

// horario_retirada.hasMany(Agendamento,{foreignKey:{data_retirada: 'data_retirada'}})
// Agendamento.belongsTo(horario_retirada,{foreignKey:{data_retirada: 'data_retirada'}})

// horarios_devolução.hasMany(Agendamento,{foreignKey:{data_devolucao: 'data_devolucao'}})
// Agendamento.belongsTo(horarios_devolução,{foreignKey:{data_devolucao: 'data_devolucao'}})

// Turmas.hasMany(Agendamento,{foreignKey:{turma: 'turma'}})
// Agendamento.belongsTo(Turmas,{foreignKey:{turma: 'turma'}})

// local.hasMany(Agendamento,{foreignKey:{local:'local_id'}})
// Agendamento.belongsTo(local,{foreignKey:{local: 'local_id'}})

module.exports = Agendamento

//apotei todas as fk para o id das outras as tabelas