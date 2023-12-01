const mongoose = require("mongoose");

const optSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    user_email: {
        type: String,
        default: null,
    },
    otp_code: {
        type: String,
        required: true,
    },
    expiration_time: {
        type : Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    isused: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model("Otp", optSchema);