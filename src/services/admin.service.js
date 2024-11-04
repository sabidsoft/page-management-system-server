const Admin = require("../models/Admin");

exports.createNewAdmin = async (data) => {
    const admin = await Admin.create(data);
    return admin;
}

exports.getAdminByEmail = async (email) => {
    const admin = await Admin.findOne({ email });
    return admin;
}

exports.getAdminById = async (adminId) => {
    const admin = await Admin.findOne({ _id: adminId });
    return admin;
}
