const mongoose = require("mongoose");

const connectDatabase = () => {
    mongoose
        .connect(process.env.MONGODB_ATLAS_URI)
        .then(() => console.log("database connection is successful"))
        .catch((error) => console.error(error))
}

module.exports = connectDatabase;