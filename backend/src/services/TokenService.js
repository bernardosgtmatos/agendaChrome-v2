const jwt = require('jsonwebtoken')

const COOKIE_NAME = 'token'
const COOKIE_MAX_AGE = 604800000
const TOKEN_TTL = '7d'

function opcoesCookie() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: COOKIE_MAX_AGE
    }
}

function assinarToken(usuario) {
    return jwt.sign(
        {
            id: usuario.id,
            email: usuario.email,
            tokenVersion: usuario.token_version
        },
        process.env.JWT_SECRET,
        { expiresIn: TOKEN_TTL }
    )
}

function definirCookieToken(res, token) {
    res.cookie(COOKIE_NAME, token, opcoesCookie())
}

function limparCookieToken(res) {
    const { maxAge, ...opcoes } = opcoesCookie()
    res.clearCookie(COOKIE_NAME, opcoes)
}

module.exports = { assinarToken, definirCookieToken, limparCookieToken }
