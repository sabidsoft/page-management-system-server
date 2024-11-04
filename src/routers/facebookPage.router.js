const router = require("express").Router();
const multer = require('multer');
const verifyToken = require("../middlewares/verifyToken");
const {
    facebookPageLogin,
    getFacebookPages,
    getFacebookPage,
    getFacebookPagePosts,
    createPagesPost
} = require("../controllers/facebookPage.controller");

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory for quick access
const upload = multer({ storage: storage });

router.get("/", verifyToken, getFacebookPages);
router.get("/:pageId", verifyToken, getFacebookPage);
router.get("/:pageId/posts", verifyToken, getFacebookPagePosts);

router.post("/facebook-page-login", verifyToken, facebookPageLogin);
router.post("/create-pages-post", verifyToken, upload.single('mediaFile'), createPagesPost);

module.exports = router;