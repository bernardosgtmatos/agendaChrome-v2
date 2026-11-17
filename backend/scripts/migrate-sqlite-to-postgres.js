require('dotenv').config()

const path = require('path')
const { Sequelize, QueryTypes } = require('sequelize')
const { Agendamento, Admin, Capacidade, horario_retirada, horarios_devolução, local, RecuperacaoSenha, Turmas, Usuario } = require('../src/model/index.js')

const SQLITE_PATH = process.env.SQLITE_PATH || path.join(__dirname, '..', 'Database.sqlite')

async function migrarTabela(Model, origem) {
    const tabela = Model.getTableName()
    const nome = typeof tabela === 'string' ? tabela : tabela.tableName
    const linhas = await origem.query(`SELECT * FROM "${nome}"`, { type: QueryTypes.SELECT })
    if (!linhas.length) {
        console.log(`${nome}: 0 linhas na origem, pulando`)
        return
    }
    await Model.bulkCreate(linhas, { hooks: false, ignoreDuplicates: true, validate: false })
    console.log(`${nome}: ${linhas.length} linhas migradas`)
}

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL não definida. Configure o Neon antes de migrar.')
    }

    const origem = new Sequelize({
        dialect: 'sqlite',
        storage: SQLITE_PATH,
        logging: false
    })

    await origem.authenticate()
    const alvo = require('../src/config/Database')
    await alvo.authenticate()
    await alvo.sync({})

    // Ordem respeitando FKs.
    await migrarTabela(Capacidade, origem).catch((e) => console.log('Capacidade:', e.message))
    await migrarTabela(Turmas, origem).catch((e) => console.log('Turmas:', e.message))
    await migrarTabela(local, origem).catch((e) => console.log('local:', e.message))
    await migrarTabela(horario_retirada, origem).catch((e) => console.log('horario_retirada:', e.message))
    await migrarTabela(horarios_devolução, origem).catch((e) => console.log('horarios_devolução:', e.message))
    await migrarTabela(Admin, origem).catch((e) => console.log('Admin:', e.message))
    await migrarTabela(Usuario, origem).catch((e) => console.log('Usuario:', e.message))
    await migrarTabela(Agendamento, origem).catch((e) => console.log('Agendamento:', e.message))
    await migrarTabela(RecuperacaoSenha, origem).catch((e) => console.log('RecuperacaoSenha:', e.message))

    await origem.close()
    console.log('Migração concluída.')
}

main().catch((erro) => {
    console.error('Erro na migração:', erro)
    process.exitCode = 1
})
