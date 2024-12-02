const createError = require("http-errors");
const { generateToken } = require("../utils/generateToken");
const { successResponse } = require("../utils/response");
const { getAdminByEmail, createNewAdmin } = require('../services/admin.service');

exports.adminSignUp = async (req, res, next) => {
    try {
        const { name, email, role, adminCode, password } = req.body;

        const emailValidationPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        // Sign up code
        const superAdminCode = 'SP-330033-AD';
        const detachmentAdminCode = 'DT-550055-AD';
        const districtAdminCode = 'DS-990099-AD';

        // Validate name
        if (!name) throw createError(400, "Name is required!");
        if (name.length < 3) throw createError(400, "Name is too short!");
        if (name.length > 30) throw createError(400, "Name is too big!");

        // Validate email
        if (!email) throw createError(400, "Email is required!");
        if (!emailValidationPattern.test(email)) throw createError(400, "Invalid email address!");

        // Validate role and adminCode
        if (!role) throw createError(400, "Role is required!");
        if (!adminCode) throw createError(400, "Admin code is required!");

        switch (role) {
            case 'Super Admin':
                if (adminCode !== superAdminCode) throw createError(400, "Invalid admin code for Super Admin!");
                break;
            case 'Detachment Admin':
                if (adminCode !== detachmentAdminCode) throw createError(400, "Invalid admin code for Detachment Admin!");
                break;
            case 'District Admin':
                if (adminCode !== districtAdminCode) throw createError(400, "Invalid admin code for District Admin!");
                break;
            default:
                throw createError(400, "Invalid role!");
        }

        // Validate password
        if (!password) throw createError(400, "Password is required!");
        if (password.length < 6) throw createError(400, "Password should be at least 6 characters long!");
        if (password.length > 40) throw createError(400, "Password is too long!");

        // Check if admin already exists
        const isAdminExist = await getAdminByEmail(email);
        if (isAdminExist) throw createError(400, "Admin already exists!");

        // Create new admin
        const admin = await createNewAdmin({ name, email, role, password });

        // Remove sensitive information from response
        const { password: pass, ...adminInfoWithoutPassword } = admin.toObject();

        // Generate JWT token
        const token = generateToken({ email: admin.email, id: admin._id, role: admin.role }, process.env.JWT_SECRET_KEY, "365d");

        // Send success response
        successResponse(res, {
            status: 200,
            message: "Sign up successful!",
            payload: { admin: adminInfoWithoutPassword, token }
        });
    } catch (err) {
        next(err);
    }
};

exports.adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const emailValidationPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        // Validate input
        if (!email) throw createError(400, "Please provide your email address.");
        if (!emailValidationPattern.test(email)) throw createError(400, "Invalid email address.");
        if (!password) throw createError(400, "Please provide your password.");

        // Retrieve admin by email
        const admin = await getAdminByEmail(email);
        if (!admin) throw createError(400, "Account not available. Please create an account first.");
        if (!admin.isActive) throw createError(400, "Your account is deactivated. Please contact support.");

        // Validate password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) throw createError(400, "Your email or password isn't correct.");

        // Update lastLogin with the current timestamp and set isLoggedIn to true
        admin.lastLogin = new Date();
        admin.isLoggedIn = true;
        await admin.save();

        // Remove sensitive information from response
        const { password: pass, ...adminInfoWithoutPassword } = admin.toObject();

        // Generate JWT token
        const token = generateToken({ email: admin.email, id: admin._id, role: admin.role }, process.env.JWT_SECRET_KEY, "365d");

        // Send success response
        successResponse(res, {
            status: 200,
            message: "Sign in successful.",
            payload: { admin: adminInfoWithoutPassword, token }
        });
    } catch (err) {
        next(err);
    }
};

exports.adminLogout = async (req, res, next) => {
    try {
        const adminId = req.admin.email; // Assume the user is authenticated and `id` is in the token payload

        const admin = await getAdminByEmail(adminId);
        if (!admin) throw createError(400, "Admin not found.");

        // Update isLoggedIn to false
        admin.isLoggedIn = false;
        await admin.save();

        successResponse(res, {
            status: 200,
            message: "Logout successful.",
        });
    } catch (err) {
        next(err);
    }
};
