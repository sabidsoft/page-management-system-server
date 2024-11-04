const axios = require('axios');
const FormData = require('form-data');
const createError = require("http-errors");
const { successResponse } = require("../utils/response");
const {
    upsertFacebookPageService,
    getFacebookPagesService,
    findFacebookPageById
} = require('../services/facebookPage.service');

// // With facebook page profile picture
exports.facebookPageLogin = async (req, res, next) => {
    try {
        const { userAccessToken } = req.body;

        if (!userAccessToken) {
            throw createError(400, 'User access token is required!');
        }

        // Exchange the short-lived user access token for a long-lived user access token
        let longLivedUserAccessToken;

        try {
            const tokenResponse = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
                params: {
                    grant_type: 'fb_exchange_token',
                    client_id: process.env.FACEBOOK_APP_ID,
                    client_secret: process.env.FACEBOOK_APP_SECRET,
                    fb_exchange_token: userAccessToken
                }
            });

            longLivedUserAccessToken = tokenResponse.data.access_token;
        } catch (error) {
            return next(createError(400, 'Failed to exchange token: ' + error.message));
        }

        // Fetch pages associated with the user's account using the long-lived user token
        try {
            const response = await axios.get(
                `https://graph.facebook.com/v21.0/me/accounts`,
                {
                    params: {
                        access_token: longLivedUserAccessToken
                    }
                }
            );

            const data = response.data;

            if (data.error) {
                throw createError(400, data.error.message);
            }

            // Upsert each page document and fetch profile picture
            const upsertedPages = [];

            for (const page of data.data) {
                // Fetch the page profile picture
                const pictureResponse = await axios.get(
                    `https://graph.facebook.com/v21.0/${page.id}/picture`,
                    {
                        params: {
                            access_token: page.access_token,
                            redirect: false // Ensures the URL is returned as JSON
                        }
                    }
                );

                const pageProfilePictureUrl = pictureResponse.data.data.url;

                // Upsert the page information including the profile picture
                const updatedPage = await upsertFacebookPageService({
                    pageId: page.id,
                    pageName: page.name,
                    pageCategory: page.category,
                    pageAccessToken: page.access_token,
                    pageProfilePicture: pageProfilePictureUrl
                });

                upsertedPages.push(updatedPage);
            }

            successResponse(res, {
                status: 200,
                message: "Facebook pages have been upserted successfully",
                payload: { upsertedPages }
            });
        } catch (error) {
            next(createError(500, 'Failed to fetch pages: ' + error.message));
        }

    } catch (err) {
        next(err);
    }
};

// // Without facebook page profile picture
// exports.facebookPageLogin = async (req, res, next) => {
//     try {
//         const { userAccessToken } = req.body;

//         if (!userAccessToken) {
//             throw createError(400, 'User access token is required!');
//         }

//         // Exchange the short-lived user access token for a long-lived user access token
//         let longLivedUserAccessToken;

//         try {
//             const tokenResponse = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
//                 params: {
//                     grant_type: 'fb_exchange_token',
//                     client_id: process.env.FACEBOOK_APP_ID,
//                     client_secret: process.env.FACEBOOK_APP_SECRET,
//                     fb_exchange_token: userAccessToken
//                 }
//             });

//             longLivedUserAccessToken = tokenResponse.data.access_token;

//         } catch (error) {
//             return next(createError(400, 'Failed to exchange token: ' + error.message));
//         }

//         // Fetch pages associated with the user's account using the long-lived user token
//         try {
//             const response = await axios.get(
//                 `https://graph.facebook.com/v21.0/me/accounts`,
//                 {
//                     params: {
//                         access_token: longLivedUserAccessToken
//                     }
//                 }
//             );

//             const data = response.data;

//             console.log(data.data)

//             if (data.error) {
//                 throw createError(400, data.error.message);
//             }

//             // Upsert each page document
//             const upsertedPages = [];

//             for (const page of data.data) {
//                 const updatedPage = await upsertFacebookPageService({
//                     pageId: page.id,
//                     pageName: page.name,
//                     pageCategory: page.category,
//                     pageAccessToken: page.access_token
//                 });

//                 upsertedPages.push(updatedPage);
//             }

//             successResponse(res, {
//                 status: 200,
//                 message: "Facebook pages have been upserted successfully",
//                 payload: { upsertedPages }
//             });
//         } catch (error) {
//             next(createError(500, 'Failed to fetch pages: ' + error.message));
//         }

//     } catch (err) {
//         next(err);
//     }
// };

exports.getFacebookPages = async (req, res, next) => {
    try {
        const facebookPages = await getFacebookPagesService();

        successResponse(res, {
            status: 200,
            message: "All facebook pages returned!",
            payload: { facebookPages }
        })
    }
    catch (err) {
        next(err);
    }
}

exports.getFacebookPage = async (req, res, next) => {
    try {
        const facebookPage = await findFacebookPageById(req.params.pageId);

        if (!facebookPage) {
            throw createError(400, 'Facebook page not found!');
        }

        successResponse(res, {
            status: 200,
            message: "Facebook page returned!",
            payload: { facebookPage }
        })
    }
    catch (err) {
        next(err);
    }
}

exports.getFacebookPagePosts = async (req, res, next) => {
    try {
        const pageId = req.params.pageId;

        const facebookPage = await findFacebookPageById(pageId);

        if (!facebookPage) {
            throw createError(400, 'Facebook page not found!');
        }

        // Fetch the user's posts
        const response = await axios.get(
            `https://graph.facebook.com/v21.0/${pageId}/posts`, {
            params: {
                access_token: facebookPage.pageAccessToken,
                fields: 'id,message,story,attachments,reactions,shares,comments,permalink_url,status_type,created_time,updated_time'
            }
        });

        const posts = response.data.data;
        const paging = response.data.paging;

        successResponse(res, {
            status: 200,
            message: "Posts returned by Facebook ID",
            payload: { posts, paging }
        });
    } catch (err) {
        next(err);
    }
};

// Single post for Facebook page 
exports.createPagePost = async (req, res, next) => {
    try {
        const { message, link, mediaType } = req.body; // Getting message and media type from the request body
        const mediaFile = req.file; // Getting uploaded file

        const pageId = '';
        const accessToken = '';

        // Check for valid media types and handle accordingly
        if (mediaType === 'video') {
            // Ensure a file is uploaded for videos
            if (!mediaFile) {
                throw createError(400, 'Video file is required for Video media type!');
            }

            // Create a FormData instance
            const formData = new FormData();
            formData.append('access_token', accessToken);
            formData.append('description', message);
            formData.append('file', mediaFile.buffer, { filename: mediaFile.originalname }); // Attach the video file

            // Define the Facebook API URL for video posting
            const facebookUrl = `https://graph-video.facebook.com/v21.0/${pageId}/videos`;

            // Make the API call for video uploads
            const response = await axios.post(facebookUrl, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
            });

            const data = response.data;

            successResponse(res, {
                status: 200,
                message: "Posted successfully",
                payload: { data }
            });
        } else if (mediaType === 'photo') {
            // Handle photo uploads
            if (!mediaFile) {
                throw createError(400, 'Photo file is required for Photo media type!');
            }

            const formData = new FormData();
            formData.append('message', message);
            formData.append('file', mediaFile.buffer, { filename: mediaFile.originalname });

            const facebookUrl = `https://graph.facebook.com/v21.0/${pageId}/photos?access_token=${accessToken}`;
            const response = await axios.post(facebookUrl, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
            });

            const data = response.data;

            successResponse(res, {
                status: 200,
                message: "Posted successfully",
                payload: { data }
            });
        } else if (mediaType === 'text') {
            if (!message && !link) {
                throw createError(400, 'Message or Link field is required for Text media type!');
            }

            // Handle text posting
            const facebookUrl = `https://graph.facebook.com/v21.0/${pageId}/feed?access_token=${accessToken}`;
            const response = await axios.post(facebookUrl, {
                message,
                link
            });

            const data = response.data;

            successResponse(res, {
                status: 200,
                message: "Posted successfully!",
                payload: { data }
            });
        } else {
            throw createError(400, 'Invalid media type!');
        }
    } catch (err) {
        next(err);
    }
};

// Multiple post for Facebook pages 
exports.createPagesPost = async (req, res, next) => {
    try {
        const { message, link, mediaType } = req.body; // Get message, link, and media type from request body
        const mediaFile = req.file; // Get uploaded file

        // Fetch the array of Facebook pages
        const facebookPages = await getFacebookPagesService();

        // Ensure there are pages to post
        if (!facebookPages || facebookPages.length === 0) {
            throw createError(400, 'No Facebook pages found!');
        }

        const results = []; // Array to hold results of each post attempt

        for (const page of facebookPages) {
            const { pageId, pageAccessToken } = page;
            try {
                let response;
                if (mediaType === 'video') {
                    // Ensure a file is uploaded for videos
                    if (!mediaFile) {
                        throw createError(400, 'Video file is required for Video media type!');
                    }

                    // Create a FormData instance for video
                    const formData = new FormData();
                    formData.append('access_token', pageAccessToken);
                    formData.append('description', message);
                    formData.append('file', mediaFile.buffer, { filename: mediaFile.originalname });

                    const facebookUrl = `https://graph-video.facebook.com/v21.0/${pageId}/videos`;

                    // Make the API call for video uploads
                    response = await axios.post(facebookUrl, formData, {
                        headers: {
                            ...formData.getHeaders(),
                        },
                    });
                } else if (mediaType === 'photo') {
                    // Ensure a file is uploaded for photos
                    if (!mediaFile) {
                        throw createError(400, 'Photo file is required for Photo media type!');
                    }

                    // Create a FormData instance for photo
                    const formData = new FormData();
                    formData.append('message', message);
                    formData.append('file', mediaFile.buffer, { filename: mediaFile.originalname });

                    const facebookUrl = `https://graph.facebook.com/v21.0/${pageId}/photos?access_token=${pageAccessToken}`;

                    // Make the API call for photo uploads
                    response = await axios.post(facebookUrl, formData, {
                        headers: {
                            ...formData.getHeaders(),
                        },
                    });
                } else if (mediaType === 'text') {
                    // Ensure message or link is provided for text posts
                    if (!message && !link) {
                        throw createError(400, 'Message or Link field is required for Text media type!');
                    }

                    const facebookUrl = `https://graph.facebook.com/v21.0/${pageId}/feed?access_token=${pageAccessToken}`;

                    // Make the API call for text posting
                    response = await axios.post(facebookUrl, {
                        message,
                        link,
                    });
                } else {
                    throw createError(400, 'Invalid media type!');
                }

                // Collect successful result
                results.push({
                    pageId,
                    status: 'success',
                    data: response.data,
                });
            } catch (err) {
                // Collect error result for this page
                results.push({
                    pageId,
                    status: 'error',
                    message: err.message || 'An error occurred while posting',
                });
            }
        }

        // Send the consolidated response
        successResponse(res, {
            status: 200,
            message: 'Posting completed',
            payload: { results },
        });
    } catch (err) {
        next(err);
    }
};