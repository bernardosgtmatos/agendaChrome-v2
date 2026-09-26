const Agendamento = require('./AgendamentoModel')
const Admin = require('./AdminModel')
const {horario_retirada, horarios_devolução} = require('./HorariosModel')
const local = require('./LocalModel')
const Turmas = require('./TurmasModel')
const Usuario = require('./UserModel')

Usuario.hasMany(Agendamento,{foreignKey:'usuario_id'})
Agendamento.belongsTo(Usuario,{foreignKey:'usuario_id'})

horario_retirada.hasMany(Agendamento,{foreignKey:'data_retirada'})
Agendamento.belongsTo(horario_retirada,{foreignKey:'data_retirada'})

horarios_devolução.hasMany(Agendamento,{foreignKey:'data_devolucao'})
Agendamento.belongsTo(horarios_devolução,{foreignKey:'data_devolucao'})

Turmas.hasMany(Agendamento,{foreignKey:'turma'})
Agendamento.belongsTo(Turmas,{foreignKey:'turma'})

local.hasMany(Agendamento,{foreignKey:'local_id'})
Agendamento.belongsTo(local,{foreignKey:'local_id'})

module.exports = {Agendamento,Admin,horario_retirada,horarios_devolução,local,Turmas,Usuario}