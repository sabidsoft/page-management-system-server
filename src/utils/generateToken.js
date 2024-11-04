const jwt = require("jsonwebtoken");

exports.generateToken = (payload, privateKey, expiresIn) =>
    jwt.sign(payload, privateKey, { expiresIn });