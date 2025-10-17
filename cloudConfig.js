const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({  //config kr rhe h mtlb jor rheee h cloudnary account kee saath
    //YE SARA cloudinary ke file ko configuree kr liye mtb jor liye 
    cloud_name:process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET

});

const storage = new CloudinaryStorage({//storage bana rhee h jismi kaha p jaake kismei save krna h filee ko
                                    //kaun kaun se formats wale file ko save krna h
  cloudinary: cloudinary,
  params: {
    folder: 'wanderlust_DEV',
    allowerdFormats: ["png","jpg","jpeg"], //iss trike ki file save krwa sktee h
   
  },
});

module.exports={//ise hum use krgee listing.js mei isliy export kiye eh
    cloudinary,
    storage,
};