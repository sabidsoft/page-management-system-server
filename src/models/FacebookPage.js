const { Schema, model } = require('mongoose');

const FacebookPageSchema = new Schema({
    pageId: {
        type: String,
        required: true,
    },

    pageName: {
        type: String,
        required: true,
    },

    pageCategory: {
        type: String,
        required: true,
    },

    pageProfilePicture: {
        type: String,
        required: true,
    },

    pageAccessToken: {
        type: String,
        required: true,
    },
}, { timestamps: true });

// FacebookPage model
const FacebookPage = model('FacebookPage', FacebookPageSchema);

module.exports = FacebookPage;
