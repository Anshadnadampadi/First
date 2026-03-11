import User from "../models/User.js";
import express from "express"
import {
    getHome,
    otpSignup,
     getAddress,
     postAddress,
      putAddress,deleteAddress,
    patchDefaultAddress,
    getProfile,
    geteditProfile,
    postEditProfile,
    postUpdateProfile,
    postChangePassword,
    getSignup,
    postSignup,
    postLogin,
    getlogin,
    getForgotPassword,
    postForgotPassword,
    loadVerifyOtp,
    postVerifyOtp,
    resendOtp,
    emailVerify,
    resetPassword,
    postResetPassword,
    resetSuccess,
    logout,
    updateProfileImage,
    removeProfileImage,
    requestEmailChangeOtp,
    verifyAndActivateEmailChange
} from "../controllers/user/userController.js";
import { ensureLoggedIn, ensureLoggedOut } from "../middlewares/authMiddleware.js";
import passport from "passport";
import { uploadProfileImage } from "../middlewares/uploadMiddleware.js";




const router = express.Router();

router.route("/signup")
    .get( ensureLoggedOut, getSignup)
    .post( ensureLoggedOut, postSignup)
    
// landingPage
router.get("/", getHome)
//signUp


//login
router.get("/login", ensureLoggedOut, getlogin)
router.get("/logout",ensureLoggedIn, logout)
router.post("/login", ensureLoggedOut, postLogin)

router.get("/forgot",  ensureLoggedOut, getForgotPassword);
router.post("/forgot",  ensureLoggedOut, postForgotPassword);
router.post('/verify-email',  ensureLoggedOut, emailVerify);
router.get('/resend-otp',  ensureLoggedOut, resendOtp);

router.get("/verify-otp",  ensureLoggedOut, loadVerifyOtp);
router.post("/verify-otp",  ensureLoggedOut, postVerifyOtp);

router.get("/reset-password",  ensureLoggedOut, resetPassword);
router.post("/reset-password",  ensureLoggedOut, postResetPassword);
router.get("/reset-success",  ensureLoggedOut, resetSuccess);

router.get('/address', ensureLoggedIn, getAddress)
router.post('/address', ensureLoggedIn, postAddress);
router.put('/address/:id', ensureLoggedIn, putAddress);
router.delete('/address/:id', ensureLoggedIn, deleteAddress);
router.patch('/address/default/:id', ensureLoggedIn, patchDefaultAddress);

router.get("/profile", ensureLoggedIn, async (req, res) => {

    try{

        const msg = req.query.msg || null;
        const icon = req.query.icon || null;

        const user = await User.findById(req.session.user);

        res.render("user/userProfile", {
            user,
            msg,
            icon
        });

    }catch(error){

        console.log("Profile page error:",error);
        res.redirect("/");

    }

});

// normalized path
router.post("/profile", ensureLoggedIn, postUpdateProfile)
router.post("/profile/password",  ensureLoggedIn, postChangePassword)
router.get("/editProfile",  ensureLoggedIn, geteditProfile)
router.post("/editProfile", ensureLoggedIn, uploadProfileImage.single("profileImage"), postEditProfile)
router.post("/change-email/request", ensureLoggedIn, requestEmailChangeOtp)
router.post("/change-email/verify", ensureLoggedIn, verifyAndActivateEmailChange)

router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/login?error=blocked" }),
    (req, res) => {
        req.session.user = req.user._id; // Store user ID in session
        res.redirect("/");
    }
);

router.post("/upload-profile", ensureLoggedIn, uploadProfileImage.single("profileImage"),
updateProfileImage
)
router.delete("/upload-profile", ensureLoggedIn, removeProfileImage);

export default router;
