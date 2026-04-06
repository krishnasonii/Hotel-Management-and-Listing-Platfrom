const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
require('dotenv').config({ path: '../.env' });

const MONGO_URL = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/website";

main()
  .then(() => {
    console.log("Connected to DB successfully");
  })
  .catch((err) => {
    console.log("Error connecting to DB:", err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
    await Listing.deleteMany({});
    
    initData.data = initData.data.map((obj) => ({
        ...obj,
        owner: "68e9fa5f410480b6b66feee2",
        geometry: {
            type: "Point",
            coordinates: [77.2090, 28.6139] 
        }
    }));
    
    await Listing.insertMany(initData.data);
    console.log("data was initialized with coordinates");
};

initDB();
;