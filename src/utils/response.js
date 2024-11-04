exports.errorResponse = (res, { status = 500, message = "Internal server error" }) => {
    res.status(status).json({
        success: false,
        message,
    });
};

exports.successResponse = (res, { status = 200, message = "Success", payload = {} }) => {
    res.status(status).json({
        success: true,
        message,
        data: payload
    });
};