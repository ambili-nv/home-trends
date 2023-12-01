const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
    name:{
        type:String,
        require:true,
    },
    street: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    }, 
    state: {
        type: String,
        required: true,
    },
    pincode: {
        type: String,
        required: true,
    },
    landmark: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        required: true,
    },
    alternativenumber: {
        type: String,
        required: true,
    },
},
   { timestamps: true }
);

module.exports = mongoose.model("Address", addressSchema);