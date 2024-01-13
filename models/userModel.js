const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {roles} = require("../utils/constants");
const bcrypt = require('bcrypt');
const crypto = require("crypto");

const userSchema = new mongoose.Schema (
    {
        name: {
            type:String,
            required: true,
        },

        email:{
            type:String,
            required: true,
        },

        image: {
            type: String,
        },

        isBlocked: {
            type: Boolean,
            default: false,
        },

        isEmailVerified: {
            type: Boolean,
            default: false,
        },

        token:{
            type:String,
            default:''
        },

        password:{
            type:String,
            required:true,
        },

        role: {
            type: String,
            enum: [roles.user, roles.admin],
            default: roles.user,
        },

        address: [{ type: mongoose.Schema.Types.ObjectId, ref: "Address" }],
        wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

        passwordChangedAt: Date,
        passwordResetToken: String,
        passwordResetTokenExpires: Date,
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        updatedAt: {
            type: Date,
            default: Date.now(),
        },
       
        refferalId: {
            type:String,
            unique:true,
        },
        refferedBy:{
            type:String,
        },
        
        salt:String
    },
   

    {timestamps:true}

);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    if(this.isNew){
        const salt = await bcrypt.genSaltSync(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    if (this.email === process.env.ADMIN_EMAIL.toLowerCase()) {
        this.role = roles.superAdmin;
    }
    next();
});

userSchema.methods.isPasswordMatched = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.createResetPasswordToken = async function () {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

userSchema.pre("save",function(next){
    if(this.isNew){
        const randomToken = crypto.randomBytes(2).toString("hex");
        const last4Digits = this._id.toString().slice(-4);
        this.refferalId = "HT" + last4Digits + randomToken;
    }
    next();
})

module.exports = mongoose.model("User", userSchema);