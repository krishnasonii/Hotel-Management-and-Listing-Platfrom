const express=require("express");
const router=express.Router({mergeParams: true}); //y print kryega review ko id k basis pr
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

//create review
router.post("/",validateReview, wrapAsync(async(req,res)=>{ //db mei save kryeg isliye asyc use kiye h
    //console.log(req.params.id);
    let listing=await Listing.findById(req.params.id);//ye listing find krega

       if(!req.isAuthenticated()){ //ye authenticatee krti h user logged in hai ya nii
        req.flash("error","you must be logged in to create Reviews");
        return res.redirect("/login");
    }



    /* same but 2nd way is good */
    //const { comment, rating } = req.body.review;
    //let newReview = await Review.create({ comment, rating });
    let newReview   =new Review(req.body.review)//ye review ke andr jo rating,comment h usko pass krega sara obj
    newReview.author=req.user._id;//yee author ko add kiyee review create hoga to author ka name bhi dega
    listing.reviews.push(newReview);
     await newReview.save();
     await listing.save();
        req.flash("success","New Review Created!"); 
     //console.log("new review saved");
    // res.send("new review saved");
    console.log(newReview);
    res.redirect(`/listings/${listing._id}`);//ye /listing/:id wale p redirect kar rha h matlb same page pr
}));


//Deleete review route--
router.delete("/:reviewId",wrapAsync(async(req,res)=>{
    let {id,reviewId}=req.params;
       if(!req.isAuthenticated()){ //ye authenticatee krti h user logged in hai ya nii
        req.flash("error","you must be logged in to delete reviews");
        return res.redirect("/login");
    }

    await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
    await Review.findById(reviewId);
        req.flash("success","Review Deleted!"); 
    res.redirect(`/listings/${id}`);//same whi page pr redirect krega
}));

module.exports=router;