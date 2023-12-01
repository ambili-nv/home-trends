const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const categorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },
      isListed: {
        type: Boolean,
        default: true,
      },    
},
{ timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;