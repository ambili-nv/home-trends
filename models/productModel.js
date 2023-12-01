const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        title:{
            type:String,
            require:true,
            trim:true,
        },
        description: {
            type: String,
            required: true,
        },
        productPrice: {
            type: Number,
            required: true,
        },
        salePrice: {
            type: Number,
            required: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        isListed: {
            type: Boolean,
            default: true,
        },
        quantity: {
            type: Number,
            required: true,
        },

        images: [{ type: mongoose.Schema.Types.ObjectId, ref: "Images" }],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);