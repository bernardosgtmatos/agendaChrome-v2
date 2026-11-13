const rateLimit = require('express-rate-limit')

const rateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Muitas requisições. Tente novamente em instantes.' },
})

module.exports = rateLimiter
