const express=require("express");
const router=express.Router({mergeParams: true}); 
const wrapAsync=require("../utils/Wrapasync.js");
const ExpressError=require("../utils/ExpressError.js");
const {reviewSchema}=require("../schema.js"); 
const  Review =require("../models/review.js");
const Listing =require("../models/listing.js");



const validateReview=(req,res,next)=>{
    let {error}=reviewSchema.validate(req.body);    
    if(error){
        throw new ExpressError(400,error);
    }else{
        next();
    }
}


router.post("/",validateReview, wrapAsync(async(req,res)=>{ 
    
    let listing=await Listing.findById(req.params.id);

       if(!req.isAuthenticated()){ 
        req.flash("error","you must be logged in to create Reviews");
        return res.redirect("/login");
    }



    /* same but 2nd way is good */
    
    
    let newReview   =new Review(req.body.review)
    newReview.author=req.user._id;
    listing.reviews.push(newReview);
     await newReview.save();
     await listing.save();
        req.flash("success","New Review Created!"); 
     
    
    console.log(newReview);
    res.redirect(`/listings/${listing._id}`);
}));



router.delete("/:reviewId",wrapAsync(async(req,res)=>{
    let {id,reviewId}=req.params;
       if(!req.isAuthenticated()){ 
        req.flash("error","you must be logged in to delete reviews");
        return res.redirect("/login");
    }

    await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
    await Review.findById(reviewId);
        req.flash("success","Review Deleted!"); 
    res.redirect(`/listings/${id}`);
}));

module.exports=router;