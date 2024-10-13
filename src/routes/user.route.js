import { Router } from "express";
import { registerUser, loginUser, loggedOutUser, AccessRefreshToken } from "../controller/user.controller.js";
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

export default router