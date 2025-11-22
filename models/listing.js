const mongoose=require("mongoose");
const Schema = mongoose.Schema;


const listingSchema =new Schema({
    title:  {
        type:String,
        required:true,
    },
    description: String,
    image:{  
        url:String,  
        filename:String, 

        
       
        
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



const Listing= mongoose.model("Listing",listingSchema); // collection--  Listing
module.exports=Listing;

