const FacebookPage = require("../models/FacebookPage");

exports.upsertFacebookPageService = async (pageData) => {
    // Use findOneAndUpdate to either update an existing document or create a new one
    return await FacebookPage.findOneAndUpdate(
        { pageId: pageData.pageId },  // Match document by pageId
        {
            $set: {
                pageName: pageData.pageName,
                pageCategory: pageData.pageCategory,
                pageProfilePicture: pageData.pageProfilePicture,
                pageAccessToken: pageData.pageAccessToken,
            }
        },
        { new: true, upsert: true } // Return the updated document and create if not found
    );
};

exports.findFacebookPageById = async (pageId) => {
    const facebookPage = await FacebookPage.findOne({ pageId });
    return facebookPage;
};

exports.getFacebookPagesService = async () => {
    const facebookPages = await FacebookPage.find({});
    return facebookPages;
};
