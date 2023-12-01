const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {roles} = require("../utils/constants");
const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema (
    {
       
        email:{
            type:String,
            required: true,
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
        
        salt:String
    },

    {timestamps:true}

);

module.exports = mongoose.model("admin", adminSchema);