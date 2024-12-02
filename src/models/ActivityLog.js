const { Schema, model, Types } = require('mongoose');

const activityLogSchema = new Schema(
    {
        adminId: {
            type: Types.ObjectId,
            ref: 'Admin',
            required: true,
        },
        action: {
            type: String,
            required: true,
            enum: ['Login', 'Logout', 'Create Post', 'Update Post', 'Delete Post', 'Other'],
        },
        details: {
            type: Object, // Additional metadata for the action
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },
        sessionStart: {
            type: Date, // For "Login" actions
        },
        sessionEnd: {
            type: Date, // For "Logout" actions
        },
    },
    { timestamps: true }
);

const ActivityLog = model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
