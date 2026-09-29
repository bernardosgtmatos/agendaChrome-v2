require('dotenv').config()
const sequelize = require('./src/config/Database')

const {Admin,horario_retirada,horarios_devolução,Turmas,local, Usuario} = require('./src/model/index')

// >>> EDITE AQUI <<<
// seed de desenvolvimento, rode com: node seed.js
// em produção apague este arquivo e o usuario admin@gmail.com criado por ele

const ADMIN_PADRAO = {
    nome: 'Administrador',
    email: 'admin@gmail.com',
    senha: '1234' // senha de dev, o beforeCreate do model gera o hash bcrypt
}

const TURMAS = [
    // ex: '6º Ano A', '7º Ano B', '1º Ano EM'
    '3º IPI','2º IPI','1º IPI'
]

const LOCAIS = [
    // ex: 'Biblioteca', 'Laboratório de Informática'
    'Audiotório','Pátio_1','Pátio_2','Biblioteca'
]

// 7 horários de 50 min, das 07:00 às 14:00, pulando o café (08:40 - 09:00) e o almoço (11:30 - 12:20)
// no banco é gravado só o horário de início, o fim fica aqui para conferência
const HORARIOS = [
    {nome: '1º Horário', inicio: '07:00', fim: '07:50'},
    {nome: '2º Horário', inicio: '07:50', fim: '08:40'},
    {nome: '3º Horário', inicio: '09:00', fim: '09:50'},
    {nome: '4º Horário', inicio: '09:50', fim: '10:40'},
    {nome: '5º Horário', inicio: '10:40', fim: '11:30'},
    {nome: '6º Horário', inicio: '12:20', fim: '13:10'},
    {nome: '7º Horário', inicio: '13:10', fim: '14:00'},
]
const HORARIOS_DEVOL =  [

]

// cria o que ainda não existe na tabela, cada item é conferido pela chave natural do campo
const criarSeNaoExistir = async (Model, campo, valores, rotulo, constante) => {
    let criados = 0
    let pulados = 0

    for (const valor of valores) {
        const exist = await Model.findOne({where: {[campo]: valor}})
        if (exist) {
            pulados++
            continue
        }
        await Model.create({[campo]: valor})
        criados++
        console.log(`   ${valor} criado`)
    }

    if (criados === 0 && pulados === 0) {
        console.log(`${rotulo}: lista vazia, preencha a constante ${constante} no topo do seed para popular esta tabela`)
        return
    }
    console.log(`${rotulo}: ${criados} criados, ${pulados} já existiam`)
}

const seed = async () => {
    try {
        await sequelize.sync()
        console.log('seed iniciado')

        const ExistAdmin = await Admin.findOne({where : {email: ADMIN_PADRAO.email}})
        if (ExistAdmin) {
            console.log(`admin: ${ADMIN_PADRAO.email} já existe, pulando`)
        } else {
            await Admin.create(ADMIN_PADRAO)
            console.log(`admin: ${ADMIN_PADRAO.email} criado com a senha "${ADMIN_PADRAO.senha}"`)
        }
        const ExistUser = await Usuario.findOne({where:{email : 'testUser@gmail.com'}})
        if(!ExistUser){
            try {
                const UserSeed = await Usuario.create({
                    nome: 'Usuario_teste',
                    email: 'testUser@gmail.com',
                    senha: '1234'
                })
            } catch (error) {
                console.log(`erro ao tentar criar usuario seed, ${error}`)
            }
        }

        console.log('horários de retirada:')
        await criarSeNaoExistir(horario_retirada, 'horario_retirada', HORARIOS.map((horario) => horario.inicio), 'horários de retirada', 'HORARIOS')

        console.log('horários de devolução:')
        await criarSeNaoExistir(horarios_devolução, 'horarios_devolução', HORARIOS.map((horario) => horario.fim), 'horários de devolução', 'HORARIOS')

        console.log('turmas:')
        await criarSeNaoExistir(Turmas, 'serie', TURMAS, 'turmas', 'TURMAS')

        console.log('locais:')
        await criarSeNaoExistir(local, 'nome', LOCAIS, 'locais', 'LOCAIS')

        console.log(`\ngrade de horários (${HORARIOS.length} slots):`)
        for (const {nome, inicio, fim} of HORARIOS) {
            console.log(`   ${nome} (${inicio} - ${fim})`)
        }

        console.log('\nseed concluído')
    } catch (error) {
        console.error(`Erro ao tentar inicar seed, ${error}`)
        process.exitCode = 1
    } finally {
        await sequelize.close()
    }
}

seed()
