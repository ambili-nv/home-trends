const express = require("express");
const router = express();
const authController = require("../../controllers/admin/authController");
const { ensureLoggedIn, ensureLoggedOut } = require("connect-ensure-login");
const { ensureAdmin } = require("../../Middlewares/authMiddleware");
const passport = require('passport');

router.use((req, res, next) => {
    req.app.set("layout", "admin/layout");
    next()
})

// router.get('/login',  authController.loginpage);
router.get("/login", ensureLoggedOut({redirectTo:"/admin/dashboard"}), authController.loginpage);
// router.get("/logout", ensureLoggedIn({redirectTo:"/admin/login"}),authController.logout);
router.get("/logout", ensureLoggedIn({redirectTo:"/admin/login"}), authController.logout);
//post
router.post("/login",passport.authenticate("local", { successReturnToOrRedirect: "/admin/dashboard",failureRedirect: "/admin/login",failureFlash: true,}));

module.exports=router;