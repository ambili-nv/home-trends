const express = require('express');
const router = express.Router();
const authController = require('../../controllers/shop/authController');
// const 
const {ensureLoggedIn, ensureLoggedOut } = require("connect-ensure-login");
const { body } = require('express-validator');
const passport = require('passport');
const bcrypt = require('bcrypt')
router.use((req, res, next) => {
    req.app.set("layout", "shop/layout");
    next()
})


router.get('/login',authController.loadLogin);
router.get('/register',authController.loadReg);
router.get("/logout", ensureLoggedIn({redirectTo:"/login"}), authController.logoutUser);
router.get("/verify-otp", authController.verifyOtppage);



router.post("/verify-otp", authController.verifyOtp);
router.post("/check-email",authController.checkemail);
router.post("/resend-email", authController.resendEmail);
router.post('/login',passport.authenticate('local',{
    successRedirect:'/',
    failureRedirect:'/login',
    failureFlash:true
}));


router.get("/blocked/:id", authController.blockedUser);



router.post('/register',
[
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").trim().isEmail().withMessage("Email must be valid").normalizeEmail().toLowerCase(),
    // body("password").trim().isLength(6).withMessage("minimum 5 characters required"),
    body('password')
  .trim()
  .isLength({ min: 8 })
  .withMessage('Minimum 8 characters required')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
  .withMessage('Enter a Strong password'),

    body("confirm-password").custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error("Password do not match");
        }
        return true;
    }),

],
authController.userRegister);




router.put('/changepassword',authController.updatePassword);



router.get("/forgot-password",authController.forgotPasswordpage);
router.get("/reset-password/:token",authController.resetPasswordpage);
router.post("/forgot-password", authController.forgotPassword);
router.put("/reset-password/:token",authController.resetPassword);

module.exports=router;