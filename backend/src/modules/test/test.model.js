const mongoose = require('mongoose');

// Purely for verifying the MongoDB connection end-to-end (CRUD round trip).
// Not part of the e-commerce domain model.
const testSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Test', testSchema);
