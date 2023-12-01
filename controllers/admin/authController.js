const asynchandler = require("express-async-handler");
// const {validationResult } = require('express-validator');
const User =require('../../models/userModel');

//Admin Login
exports.loginpage = asynchandler(async (req, res) => {
    try {
        const messages = req.flash();
        res.render("admin/pages/login", { title: "Login", messages });
    } catch (error) {
        throw new Error(error);
    }
});




//Admin Logout
exports.logout = asynchandler(async (req, res, next) => {
    try {
        req.logout((err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Logged Out!");
            res.redirect("/admin/login");
        });
    } catch (error) {
        throw new Error(error);
    }
});