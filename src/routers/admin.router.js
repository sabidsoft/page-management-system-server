const router = require("express").Router();
const { adminLogin, adminSignUp } = require("../controllers/admin.controller");

router.post("/admin-login", adminLogin);
router.post("/admin-signup", adminSignUp);

module.exports = router;