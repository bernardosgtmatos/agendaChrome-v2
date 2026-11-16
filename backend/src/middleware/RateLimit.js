const rateLimit = require('express-rate-limit')

const rateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'GET' && req.path === '/usuario/me',
    message: { message: 'Muitas requisições. Tente novamente em instantes.' },
})

module.exports = rateLimiter
