const mongoose=require("mongoose");
const Schema = mongoose.Schema;  //schema bananee k liye
//const Review =require("./review.js ");

// const listingSchema =new Schema({
//     title:  String,
//     description: String,
//     image: String,
//     price:Number,
//     location:String,
//     country:String,
// });  //aiesee bhi likh sakte h

const listingSchema =new Schema({
    title:  {
        type:String,
        required:true,
    },
    description: String,
    image:{//for cloudinary 
        url:String,  //path for cloudinary 
        filename:String, //folder for cloudinary

        
        //ye cloud nhii tha tb use krte thee
        /* type:String,
        default:
            "https://images.unsplash.com/photo-1757137911521-458496283554?q=80&w=388&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        set:(v)=>v===""
        ?"https://images.unsplash.com/photo-1757137911521-458496283554?q=80&w=388&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D": v, */
    },
    price:{
        type:Number,
        default:0,
    },
    location:String,
    country:String,
    reviews:[
        {
            type:Schema.Types.ObjectId,
            ref:"Review",
        },
    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },
     category: String,
    
});
    listingSchema.index({
    title: "text",
    description: "text",
    location: "text",
    country: "text",
   
});

  


//delete mongoose middleware
//yee basically listing lega uske andr ke sare review delete hone ke baad uske object id k basis pr use bhhi dlte krega
// listingSchema.post("findOneAndDelete",async(listing)=>{
//     if(listing){
//          await Review.deleteMany({_id:{$in: listing.reviews}});
     
//     }
// });

const Listing= mongoose.model("Listing",listingSchema); // collection--  Listing
module.exports=Listing;

