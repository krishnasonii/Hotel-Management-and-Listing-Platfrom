//Main work of index.js Hum filee ke data ko db mei savee kara raheee h---
//Ismei alg file isliye bny h index ka hum isi mei deletee insert kr rhe ---
//ismei hum kiye h alreacdy data para hua h use completely clean kr rhe h by initdb func() se     

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/website";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});
  
  initData.data=initData.data.map((obj)=>({...obj,//iss harr ek listings ke saath owner id create  hoga
    owner:"68e9fa5f410480b6b66feee2"}));
  
    await Listing.insertMany(initData.data); //ye initdata data.js require kiye h usi ka variblee namee h--
  //initdata.data ko access kiye h -- ye data key h sampledata ka jo liyee the
  console.log("data was initialized");
};

initDB();//yha call kiyee h to sara ye delte aur insert work krega--
;