const jwt = require("jsonwebtoken");

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers?.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: "You are not logged in"
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        req.admin = decoded;
        next();
    }
    catch (err) {
        res.status(403).json({
            success: false,
            message: err.message
        });
    }
}

module.exports = verifyToken;