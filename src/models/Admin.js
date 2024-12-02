const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const adminSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },

    profilePicture: {
        type: String,
        default: '',
    },

    password: {
        type: String,
        required: true,
        minlength: 6,
    },

    role: {
        type: String,
        required: true,
        enum: ['Super Admin', 'Detachment Admin', 'District Admin'],
    },

    isActive: {
        type: Boolean,
        default: true,
    },

    isLoggedIn: {
        type: Boolean,
        default: true,
    },

    lastLogin: {
        type: Date,
        default: Date.now,
    },

    resetPasswordToken: {
        type: String,
    },

    resetPasswordExpires: {
        type: Date,
    },
}, { timestamps: true });

// Hash password before saving or updating
adminSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Method to compare passwords for login
adminSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Method to change the admin's password
adminSchema.methods.changePassword = async function (oldPassword, newPassword) {
    // Compare old password
    const isMatch = await this.comparePassword(oldPassword);
    if (!isMatch) {
        throw new Error('Old password is incorrect');
    }

    // Hash and update the new password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(newPassword, salt);
    await this.save();
};

// Method to generate a password reset token
adminSchema.methods.generateResetToken = function () {
    const resetToken = crypto.randomBytes(64).toString('hex');
    this.resetPasswordToken = resetToken;
    this.resetPasswordExpires = Date.now() + 3600000; // Token valid for 1 hour
    return resetToken;
};

// Method to reset the password using the reset token
adminSchema.methods.resetPassword = async function (token, newPassword) {
    // Validate the token and check expiration
    if (this.resetPasswordToken !== token || Date.now() > this.resetPasswordExpires) {
        throw new Error('Password reset token is invalid or has expired');
    }

    // Hash and update the new password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(newPassword, salt);

    // Clear reset token and expiration fields
    this.resetPasswordToken = undefined;
    this.resetPasswordExpires = undefined;

    await this.save();
};

// Admin model
const Admin = model('Admin', adminSchema);

module.exports = Admin;
