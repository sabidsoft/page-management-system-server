const expressRateLimit = require("express-rate-limit");

const limiter = expressRateLimit({
    windowMs: 1 * 60 * 1000,
    max: 50,
    message: "Too many requests. Please try again later."
})

module.exports = limiter;