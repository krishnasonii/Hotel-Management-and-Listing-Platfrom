const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const roomSchema = new Schema({
    hotel: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true,
    },
    roomNumber: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["Single", "Double", "Suite", "Deluxe"],
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["Available", "Booked", "Maintenance"],
        default: "Available",
    },
    amenities: [String],
    description: String,
});

module.exports = mongoose.model("Room", roomSchema);
