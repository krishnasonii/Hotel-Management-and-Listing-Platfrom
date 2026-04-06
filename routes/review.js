const express=require("express");
const router=express.Router({mergeParams: true}); 
const wrapAsync=require("../utils/Wrapasync.js");
const ExpressError=require("../utils/ExpressError.js");
const {reviewSchema}=require("../schema.js"); 
const  Review =require("../models/review.js");
const Listing =require("../models/listing.js");
const Booking = require("../models/booking.js");
const { isLoggedIn, isReviewAuthor } = require("../middleware.js");

const validateReview=(req,res,next)=>{
    let {error}=reviewSchema.validate(req.body);    
    if(error){
        throw new ExpressError(400,error);
    }else{
        next();
    }
}


router.post("/", isLoggedIn, validateReview, wrapAsync(async(req,res)=>{ 
    
    let listing=await Listing.findById(req.params.id);


    // Check if stayed (for verified badge only, not for blocking)
    const hasStayed = await Booking.exists({ listing: req.params.id, user: req.user._id, status: "confirmed" });

    let newReview = new Review(req.body.review);

    newReview.author = req.user._id;
    newReview.isVerified = hasStayed;
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    req.flash("success", "New Review Created!");
     
    
    console.log(newReview);
    res.redirect(`/listings/${listing._id}`);
}));

// API for REAL-TIME RATING
router.post("/api", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;


    // Check if stayed (for verified badge only)
    const hasStayed = await Booking.exists({ listing: id, user: req.user._id, status: "confirmed" });

    const { rating } = req.body;
    
    const listing = await Listing.findById(id).populate("reviews");
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    let review = await Review.findOne({ listing: id, author: req.user._id });

    if (review) {
        review.rating     = rating;
        review.isVerified = hasStayed; // Update verification status too
        await review.save();
    } else {
        review = new Review({
            rating,
            author: req.user._id,
            comment: "Quick Rating",
            isVerified: hasStayed
        });
        await review.save();
        listing.reviews.push(review._id);
        await listing.save();
    }

    // Recalculate average
    const updatedListing = await Listing.findById(id).populate("reviews");
    const totalReviews = updatedListing.reviews.length;
    const sumRatings = updatedListing.reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = totalReviews > 0 ? (sumRatings / totalReviews).toFixed(1) : "0.0";

    res.json({ 
        success: true, 
        average, 
        count: totalReviews,
        message: "Rating saved!" 
    });
}));

// API for FULL AJAX REVIEW (Comment + Rating)
router.post("/api/full", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const Review = require("../models/review.js");
    const Listing = require("../models/listing.js");
    const Booking = require("../models/booking.js");


    const { rating, comment } = req.body;
    if (!rating || !comment) return res.status(400).json({ error: "Comment and Rating are required" });

    const hasStayed = await Booking.exists({ listing: id, user: req.user._id, status: "confirmed" });

    const listing = await Listing.findById(id).populate("reviews");
    let review = await Review.findOne({ author: req.user._id, listing: id });

    if (review) {
        review.rating = rating; review.comment = comment; review.isVerified = hasStayed;
        await review.save();
    } else {
        review = new Review({ rating, comment, author: req.user._id, listing: id, isVerified: hasStayed });
        await review.save();
        listing.reviews.push(review._id);
        await listing.save();
    }

    const updatedListing = await Listing.findById(id).populate("reviews");
    const count = updatedListing.reviews.length;
    const avg = count > 0 ? (updatedListing.reviews.reduce((acc, r) => acc + r.rating, 0) / count).toFixed(1) : "0.0";
    res.json({ success: true, average: avg, count });
}));



router.delete("/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(async(req,res)=>{
    let {id,reviewId}=req.params;


    await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
    await Review.findByIdAndDelete(reviewId); // Corrected to actually delete the review document too
        req.flash("success","Review Deleted!"); 
    res.redirect(`/listings/${id}`);
}));

// UPDATE REVIEW ROUTE
router.put("/:reviewId", isLoggedIn, isReviewAuthor, validateReview, wrapAsync(async (req, res) => {
    let { id, reviewId } = req.params;
    await Review.findByIdAndUpdate(reviewId, { ...req.body.review, createdAt: Date.now() }); // Update timestamp too
    req.flash("success", "Review updated successfully!");
    res.redirect(`/listings/${id}`);
}));

module.exports=router;