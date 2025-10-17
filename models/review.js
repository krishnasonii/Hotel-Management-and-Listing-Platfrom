
const mongoose =require("mongoose");
const Schema =mongoose.Schema;  //schema banae ke liye 

const reviewSchema=new Schema({
     comment:String,
     rating:{
        type:Number,
        min:1,      //Min and Max 1&5 hogi
        max:5
     },
     createdAt:{
        type:Date,
        default:Date.now()//agr koi review ke saath date nii hoga to bydefault set hoga ye current date
     },
     author:{
      type:Schema.Types.ObjectId,
      ref:"User",
     }
});

module.exports=mongoose.model("Review",reviewSchema);//ye Review naam ka collection h

//next step One to Many 

