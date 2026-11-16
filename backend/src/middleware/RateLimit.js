const rateLimit = require('express-rate-limit')

const rateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'GET' && req.path === '/usuario/me',
    handler: (req, res) => {
        const resetTime = req.rateLimit && req.rateLimit.resetTime
        const retryAfter = resetTime
            ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
            : 60
        res
            .status(429)
            .set('Retry-After', String(retryAfter))
            .json({
                message: `Muitas requisições. Tente novamente em ${retryAfter} segundo(s).`,
                retryAfter,
            })
    },
})

module.exports = rateLimiter
