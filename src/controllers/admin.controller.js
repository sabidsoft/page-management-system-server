const createError = require("http-errors");
const { generateToken } = require("../utils/generateToken");
const { successResponse } = require("../utils/response");
const { getAdminByEmail, createNewAdmin } = require('../services/admin.service');

exports.adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const emailValidationPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!email)
            throw createError(400, "Please provide your email address.");

        if (!emailValidationPattern.test(email))
            throw createError(400, "Invalid email address.");

        if (!password)
            throw createError(400, "Please provide your password.");

        const admin = await getAdminByEmail(email);

        if (!admin)
            throw createError(400, "Account not available. Please create an account first.");

        const isMatch = await admin.comparePassword(password);

        if (!isMatch)
            throw createError(400, "Your email or password isn't correct.");

        const { password: pass, ...adminInfoWithoutPassword } = admin.toObject();

        const token = generateToken({ email }, process.env.JWT_SECRET_KEY, "365d");

        successResponse(res, {
            status: 200,
            message: "Sign in successfull.",
            payload: { admin: adminInfoWithoutPassword, token }
        })
    }
    catch (err) {
        next(err);
    }
}

exports.adminSignUp = async (req, res, next) => {
    try {
        const { name, email, adminCode, password } = req.body;
        const emailValidationPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const adminRegisterCode = 'Avatar113355';

        if (!name)
            throw createError(400, "Name is required!");

        if (name.length < 3)
            throw createError(400, "Name is too short!");

        if (name.length > 30)
            throw createError(400, "Name is too big!");

        if (!email)
            throw createError(400, "Email is required!");

        if (!emailValidationPattern.test(email))
            throw createError(400, "Invalid email address!");

        if (!adminCode)
            throw createError(400, "Admin code is required!");

        if (adminCode !== adminRegisterCode)
            throw createError(400, "Admin register code was wrong!");

        if (!password)
            throw createError(400, "Password is required!");

        if (password.length < 6)
            throw createError(400, "Password should be at least 6 characters long!");

        if (password.length > 40)
            throw createError(400, "Password is too long!");

        const isAdminExist = await getAdminByEmail(email);

        if (isAdminExist)
            throw createError(400, "Admin already exist!");

        const admin = await createNewAdmin(req.body);

        const { password: pass, ...adminInfoWithoutPassword } = admin.toObject();

        const token = generateToken({ email }, process.env.JWT_SECRET_KEY, "365d");

        successResponse(res, {
            status: 200,
            message: "Sign up successfull!",
            payload: { admin: adminInfoWithoutPassword, token }
        })
    }
    catch (err) {
        next(err);
    }
}
