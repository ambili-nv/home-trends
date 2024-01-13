const mongoose = require('mongoose');
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
      offer: {
        type: Number,
      },
      offerDescription: {
        type: String,
      },
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
    },  
{ timestamps: true }
);


module.exports = mongoose.model("Category", categorySchema);