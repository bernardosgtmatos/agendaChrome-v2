const { Sequelize } = require('sequelize')
const path = require('path')

function criarInstancia() {
    const databaseUrl = process.env.DATABASE_URL

    if (databaseUrl) {
        return new Sequelize(databaseUrl, {
            dialect: 'postgres',
            logging: false,
            define: { timestamps: true },
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                }
            },
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        })
    }

    // Fallback para desenvolvimento local sem Postgres.
    return new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '../../Database.sqlite'),
        logging: false,
        define: { timestamps: true }
    })
}

const sequelize = criarInstancia()
module.exports = sequelize
