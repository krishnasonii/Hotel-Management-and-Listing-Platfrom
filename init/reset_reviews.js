const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
require('dotenv').config({ path: '../.env' });

const MONGO_URL = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/website";

async function resetReviews() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to DB successfully");

        
        const reviewDeleteResult = await Review.deleteMany({});
        console.log(`Deleted ${reviewDeleteResult.deletedCount} reviews from the Review collection.`);

        
        const listingUpdateResult = await Listing.updateMany({}, { $set: { reviews: [] } });
        console.log(`Cleared reviews array for ${listingUpdateResult.modifiedCount} listings.`);

        console.log("Review data reset complete!");
        process.exit(0);
    } catch (err) {
        console.error("Error resetting reviews:", err);
        process.exit(1);
    }
}

resetReviews();
