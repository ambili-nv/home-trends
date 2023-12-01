const User = require('../../models/userModel');
const asynchandler = require('express-async-handler');
const {validationResult } = require('express-validator');
const otpGenerator = require("../../utils/otpGenerator");
const emailSender = require("../../utils/emailSender");
const Otp = require("../../models/otpModel");
const generateOTP = require("../../utils/otpGenerator");
const sendEmail = require("../../utils/emailSender");
const validateMongoDbId = require('../../utils/validateMongoDbId');
const crypto = require("crypto");


//Login Page
//GET MEthod
exports. loadLogin = asynchandler(async (req,res)=>{
    try {
        const messages = req.flash()
        res.render('./shop/pages/login',{ title: "Login", page: "login",messages})
    } catch (error) {
        throw new Error(error);
    }
})

//Register Page
//GET Method

exports. loadReg = asynchandler(async (req,res)=>{
    try {
        const messages = req.flash()
        res.render('./shop/pages/register',{
            title: "Register",
            page: "register",
            data: "",
            messages,
        });
    } catch (error) {
        console.log(error);
    }
})

//Register Page
//POST Method

exports.userRegister = asynchandler(async (req, res) => {
    try {
        const errors = validationResult(req);
        const messages = req.flash();
        
        if (!errors.isEmpty()) {
            errors.array().forEach((error) => {
                req.flash("error", error.msg);
            });
            const messages = req.flash();
            res.render("shop/pages/register", {
                title: "Register",
                page: "Login",
                messages,
                data: req.body,
            });
        } else {
            const email = req.body.email;
            const existingUser = await User.findOne({ email: email });

            if (!existingUser) {
                const newUser = await User.create(req.body);
                await newUser.save();
                const otp = await Otp.create({
                    user_id: newUser._id,
                    user_email: newUser.email,
                    otp_code: generateOTP(),
                    expiration_time: Date.now() + 5 * 60 * 1000,
                });


                try {
                    const html = `<!DOCTYPE html>
                          <html lang="en">
                          <head>
                              <meta charset="UTF-8">
                              <meta name="viewport" content="width=device-width, initial-scale=1.0">
                              <title>Email Verification</title>
                          </head>
                          <body>
                              <table cellspacing="0" cellpadding="0" width="100%">
                                  <tr>
                                      <td align="center" style="background-color: #f4f4f4; padding: 40px 0;">
                                          <table cellspacing="0" cellpadding="0" width="600" style="background-color: #ffffff; border-radius: 6px; box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1); overflow: hidden;">
                                              <tr>
                                                  <td style="text-align: center; padding: 30px;">
                                                      <h2>Verify Your Email Address</h2>
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td style="text-align: center; padding: 20px;">
                                                      <p>Dear ${newUser.name},</p>
                                                      <p>Thank you for registering with Home Trends! To complete the registration process and ensure the security of your account, please verify your email address.</p>
                                                      <p>Here is your one-time verification code:</p>
                                                      <p style="font-size: 24px; font-weight: bold;">OTP Code: ${otp.otp_code}</p>
                                                      <p>Please use this code within the next 5 minutes to confirm your email address. If you do not verify your email within this time frame, you will need to request a new OTP.</p>
                                                      <p>If you did not sign up for an account with Home Trends, please disregard this email.</p>
                                                  </td>
                                              </tr>
                                          </table>
                                      </td>
                                  </tr>
                              </table>
                          </body>
                          </html>`;

                          sendEmail({
                            email: newUser.email,
                            subject: "Email Verification",
                            html: html,
                          });

                          return res.render("shop/pages/verify_otp", {
                            title: "Verify Email",
                            page: "Verify Email",
                            email: newUser.email,
                            messages,
                          });
                        } catch (error) {
                          req.flash("danger", "Failed to send mail");
                          return res.render("shop/pages/verify_otp", {
                            title: "Verify Email",
                            page: "Verify Email",
                            email: newUser.email,
                            messages,
                          });
                        }
            } else {
                req.flash("warning", "Email already registered. Please login.");
                res.redirect('/register');
            }
        }
    } catch (error) {
        console.log(error);
    }
});

//verify Email
//POST Method

exports.verifyOtp = asynchandler(async (req, res) => {
    try {
      const otp = await Otp.findOne({
        otp_code: req.body.otp,
        expiration_time: { $gt: Date.now() },
        isused: false,
      });



      if (!otp) {
        req.flash("danger", "invalid OTP");
        res.redirect("/verify-otp");
      }
  
      await otp.updateOne({ expiration_time: null, isused: true });
  
      const user = await User.findByIdAndUpdate(otp.user_id, {
        isEmailVerified: true,
      });

      // req.flash("success", "Email Vefifed successfully You can login now");
      res.redirect("/login");

    } catch (error) {
        throw new Error(error);
      }
});

//Resend Email
//POST Method

exports.resendEmail = asynchandler(async (req, res) => {
    const email = req.body.email;
  
    try {
      const messages = req.flash();
      const user = await User.findOne({ email: email });
      const otp = await Otp.create({
        user_id: user._id,
        user_email: user.email,
        otp_code: generateOTP(),
        expiration_time: Date.now() + 60000,
        
      });
    

      const html = `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
      </head>
      <body>
          <table cellspacing="0" cellpadding="0" width="100%">
              <tr>
                  <td align="center" style="background-color: #f4f4f4; padding: 40px 0;">
                      <table cellspacing="0" cellpadding="0" width="600" style="background-color: #ffffff; border-radius: 6px; box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1); overflow: hidden;">
                          <tr>
                              <td style="text-align: center; padding: 30px;">
                                  <h2>Verify Your Email Address</h2>
                              </td>
                          </tr>
                          <tr>
                              <td style="text-align: center; padding: 20px;">
                                  <p>Dear ${user.email},</p>
                                  <p>Thank you for registering with Home trends To complete the registration process and ensure the security of your account, please verify your email address.</p>
                                  <p>Here is your one-time verification code:</p>
                                  <p style="font-size: 24px; font-weight: bold;">OTP Code: ${otp.otp_code}</p>
                                  <p>Please use this code within the next 60 second to confirm your email address. If you do not verify your email within this time frame, you will need to request a new OTP.</p>
                                  <p>If you did not sign up for an account with Craftopia, please disregard this email.</p>
                              </td>
                          </tr>
                          <tr>
                              <td style="text-align: center; padding: 30px;">
                                  <p>Thank you for choosing Craftopia. We look forward to serving you!</p>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
      </body>
      </html>
      `;

      sendEmail({
        email: user.email,
        subject: "Email Verification",
        html: html,
      });
      req.flash("success", "Email Send Please check your inbox");
      return res.render("shop/pages/verify_otp", {
        title: "Verify Email",
        page: "Verify Email",
        email: user.email,
        messages,
      });
    } catch (error) {
      throw new Error(error);
    }
  });

  //Verify OTP
  //GET Method

  exports.verifyOtppage = asynchandler(async (req, res) => {
    try {
      const email = req.body?.email || req.user?.email;
      const messages = req.flash();
      res.render("shop/pages/verify_otp", {
        title: "Send Otp",
        page: "Send Otp",
        messages,
        email,
      });
    } catch (error) {
      throw new Error(error);
    }
  });

 //Check email
 //POST Method
  exports.checkemail = asynchandler(async (req, res) => {
    try {
      const existingEmail = await User.findOne({ email: req.body.email });
      if (existingEmail) {
        res.json({ message: "email already registered" });
      } else {
        res.json({ message: "" });
      }
    } catch (error) {
      throw new Error(error);
    }
  });







  exports.resetPasswordpage = asynchandler(async (req, res) => {
    try {
      const token = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetTokenExpires: { $gt: Date.now() },
      });
  
      if (!user) {
        req.flash("warning", "Token is invalid or has expired");
       
      }

      res.render("/shop/pages/userprofile", {
        title: "Reset password",
        page: "User Profile",
        token : req.params.token
    })
    } catch (error) {
      throw new Error(error);
    }
  });







  exports.resetPassword = asynchandler(async (req, res) => {
    const token = req.params.token;
    try {
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetTokenExpires: { $gt: Date.now() },
      });
  
      if (!user) {
        req.flash("warning", "Token is invalid or has expired");
        // res.redirect("/auth/forgot-password");
      }
  
      user.password = req.body.password;
      user.passwordResetToken = null;
      user.passwordResetTokenExpires = null;
      user.passwordChangedAt = Date.now();
  
      await user.save();
  
      req.flash("success", "Password changed");
      res.redirect("/login");
    } catch (error) {
      throw new Error(error);
    }
  });



//Logout 
//GET MEthod

exports.logoutUser = asynchandler(async (req, res, next) => {
    try {
      req.logout((err) => {
        if (err) {
          return next(err);
        }
        req.flash("success", "Logged Out!");
        res.redirect("/login");
      });
    } catch (error) {
      throw new Error(error);
    }
  });



