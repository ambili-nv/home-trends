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
const bcrypt = require("bcrypt");
const Wallet = require('../../models/walletModel');
const WalletTransaction = require('../../models/walletTransactionModel');


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
                const wallet = await Wallet.create({user:newUser._id});
                console.log(wallet,"wallet created");
                await newUser.save();
                const otp = await Otp.create({
                    user_id: newUser._id,
                    user_email: newUser.email,
                    otp_code: generateOTP(),
                    expiration_time: Date.now() + 5 * 60 * 1000,
                });

                console.log(otp,"is the otp");


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

      const referalCode = user.refferedBy;
      console.log(referalCode,"referalcode");
      

      if(referalCode) {
        const refferedUser = await User.findOne({refferalId:referalCode});
        console.log(refferedUser,"refferedUser");

        const refferedUserWallet = await Wallet.findOneAndUpdate({user:refferedUser._id},{$inc:{balance:100}});
        console.log(refferedUserWallet,"refferedUserWallet");

        const refferedUserWalletTransaction = await WalletTransaction.create({
          wallet:refferedUserWallet._id,
          amount:100,
          type:"credit"
        });
        console.log(refferedUserWalletTransaction,"refferedUserWalletTransaction");


        const userWallet = await Wallet.findOneAndUpdate({user:user._id},{$inc:{balance:50}});
        console.log(userWallet,"userWallet");

        const userWalletTransaction = await WalletTransaction.create({
          wallet:userWallet._id,
          amount:50,
          type:"credit"
        })

        console.log(userWalletTransaction,"userWalletTransaction");

      }



      req.flash("success", "Email Vefifed successfully You can login now");
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
                                  <p>If you did not sign up for an account with home_trends, please disregard this email.</p>
                              </td>
                          </tr>
                          <tr>
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



  exports.blockedUser = asynchandler(async (req, res) => {
    try {
      const id = req.params.id;
      validateMongoDbId(id);
      const user = await User.findById(id);
      res.render("shop/pages/blocked", {
        title: "Blocked",
        page: "blocked",
        user,
      });
    } catch (error) {
      throw new Error(error);
    }
  });




//change Password

exports.updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!oldPassword || !newPassword) {
      console.error('Old password or new password not provided');
      return res.status(400).json({ error: 'Old password or new password not provided' });
    }

    // Compare the old password
    const isPasswordValid = await user.isPasswordMatched(oldPassword);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Old password is incorrect' });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    console.log(hashedNewPassword,"hashed");
    // Update user's password with the hashed new password
    user.password = hashedNewPassword;
   console.log(user.password,"userPassword");
    // Save the updated user
    await user.save();
    req.flash("success",'Password changed Successfully')
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


//forgot password
//GET Method

exports.forgotPasswordpage = asynchandler(async (req, res) => {
  try {
    const messages = req.flash();
    res.render("shop/pages/forgot-password", {
      title: "Forgot Password",
      page: "forgot-password",
      messages,
    });
  } catch (error) {
    throw new Error(error);
  }
});

//POST Method

exports.forgotPassword = asynchandler(async (req, res) => {
  try {
    const email = req.body
    console.log(email,"email::::::::::::::::");
    const user = await User.findOne({ email: req.body.email });
    console.log(user,"userrrrrrrrrrrrrrrr");

    if (!user) {
      req.flash("danger", "Email Not Found");
      return res.redirect("/forgot-password");
    }

    const resetToken = await user.createResetPasswordToken();
    await user.save();

    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/reset-password/${resetToken}`;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td>
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse;">
                    <tr>
                        <td align="center" bgcolor="#007bff" style="padding: 40px 0;">
                            <h1 style="color: #ffffff;">Password Reset</h1>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#ffffff" style="padding: 40px 30px;">
                            <p>Dear ${user.name},</p>
                            <p>We have received a request to reset your password. To reset your password, click the button below:</p>
                            <p style="text-align: center;">
                                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                            </p>
                            <p>If you didn't request a password reset, you can ignore this email. Your password will remain unchanged.</p>
                            <p>Thank you for using our service!</p>
                        </td>
                    </tr>
                    <tr>

                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

    try {
      sendEmail({
        email: user.email,
        subject: "Password Reset",
        html: html,
      });

      req.flash("success", "Reset Link sent to your mail id");
      return res.redirect("/forgot-password");
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpires = undefined;
      console.error(error);
      req.flash(
        "danger",
        "There was an error sending the password reset email, please try again later"
      );
      return res.redirect("/forgot-password");
    }
  } catch (error) {
    console.error(error);
    req.flash("danger", "An error occurred, please try again later");
    return res.redirect("/forgot-password");
  }
});


//Reset Password
//GET Method
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
      res.redirect("/forgot-password");
    }

    res.render("shop/pages/reset-password", {
      title: "Reset Password",
      page: "Reset-password",
      token,
    });
  } catch (error) {
    throw new Error(error);
  }
});

//PUT Method
// exports.resetPassword = asynchandler(async (req, res) => {
//   const token = req.params.token;
//   try {
//     const user = await User.findOne({
//       passwordResetToken: token,
//       passwordResetTokenExpires: { $gt: Date.now() },
//     });

//     if (!user) {
//       req.flash("warning", "Token is invalid or has expired");
//       res.redirect("/forgot-password");
//     }

//     user.password = req.body.password;
//     const password = req.body.password
//     console.log(password,"password::::::::::::::::::::::");
//     user.passwordResetToken = null;
//     user.passwordResetTokenExpires = null;
//     user.passwordChangedAt = Date.now();

//     await user.save();

//     req.flash("success", "Password changed");
//     res.redirect("/login");
//   } catch (error) {
//     throw new Error(error);
//   }
// });


exports.resetPassword = asynchandler(async (req, res) => {
  const token = req.params.token;
  try {
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("warning", "Token is invalid or has expired");
      res.redirect("/forgot-password");
      return; // Add a return statement to exit the function if no user is found
    }

    // Hash the new password before saving it
    const newPassword = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
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
