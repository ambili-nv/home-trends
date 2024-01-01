const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('../models/userModel');

passport.use(
    new LocalStrategy({ usernameField: "email", passwordField: "password" }, async (email, password, done) => {
        try {
            const user = await User.findOne({ email });
            if (!user) {
                return done(null, false, { message: "Email not registered" });
            }

            if (user.isBlocked) {
                return done(null, false, { message: "Your account is blocked" });
            }

            if(user.isEmailVerified==false) {
                return done(null,false,{message:"Email not Verified"})
            }

            const isPasswordValid = await user.isPasswordMatched(password);
            console.log(isPasswordValid,"ispasswordvalid");
            if (!isPasswordValid) {
                return done(null, false, { message: "Incorrect Password" });
            }
            

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    })
);

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
});

module.exports = passport;