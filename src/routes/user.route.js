import { Router } from "express";
import { registerUser, loginUser, loggedOutUser, AccessRefreshToken, changeCurrentPassword, getCurrentUser, updateCurrentAccount, updateUserAvtar, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from "../controller/user.controller.js";
import { upload } from "../middleware/multer.middleware.js"
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()


router.route("/register").post(
    upload.fields([
        {
            name: "avtar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

// secure routes
router.route("/logout").post(verifyJWT, loggedOutUser)
router.route("/refresh-token").post(AccessRefreshToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateCurrentAccount)

router.route("/avtar").patch(verifyJWT, upload.single("avtar"), updateUserAvtar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router