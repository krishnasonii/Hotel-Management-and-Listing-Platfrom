const express=require("express");
const router=express.Router();
const wrapAsync=require("../utils/Wrapasync.js");
const Listing =require("../models/listing.js");
const User = require("../models/user");
const Booking = require("../models/booking");
const Review = require("../models/review");
const { isLoggedIn, isOwner, validateListing, isAdmin } = require("../middleware.js");

const multer  = require('multer');
const{storage}=require("../cloudConfig.js");

const upload = multer({storage});


async function geocodeNominatim(location) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`, {
            headers: { 'User-Agent': 'HotelifyApp/1.0' } 
        });
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                type: "Point",
                coordinates: [parseFloat(data[0].lon), parseFloat(data[0].lat)]
            };
        }
    } catch (e) {
        console.error("Geocoding error:", e);
    }
    
    return { type: "Point", coordinates: [77.2090, 28.6139] }; 
}



router.get("/",wrapAsync(async(req,res)=>{
    let filter = {};
    if (req.query.q) {
        filter.$text = { $search: req.query.q };
    }
    
    if (req.query.category) {
        filter.category = req.query.category;
    }

    let alllistings = await Listing.find(filter).populate("reviews");
    let currCategory = req.query.category;
   
    res.render("listings/index.ejs",{alllistings, currCategory});
}));

    
    


router.get("/new", isLoggedIn, isAdmin, (req,res)=>{
    res.render("listings/new.ejs" );
});

router.get("/search", async (req, res) => {
    const q = req.query.q;

    const listinged = await Listing.find({
        $or: [
            { title: { $regex: q, $options: "i" } },  
            { location: { $regex: q, $options: "i" } },
            { country: { $regex: q, $options: "i" } },
            { description: { $regex: q, $options: "i" } },
        ]
    }).populate("reviews");

    res.render("listings/index.ejs", { alllistings: listinged });
});
 
router.get("/:id",wrapAsync(async(req,res)=>{
    let {id}=req.params;   
   
        
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing you requested for doesn't exist");
        return res.redirect("/listings");
    }

    
    let averageRating = 0;
    let ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (listing.reviews && listing.reviews.length > 0) {
        const total = listing.reviews.reduce((acc, r) => acc + r.rating, 0);
        averageRating = (total / listing.reviews.length).toFixed(1);
        listing.reviews.forEach(r => {
            if (ratingCounts[r.rating] !== undefined) ratingCounts[r.rating]++;
        });
    }

    
    let hasStayed = false;
    if (req.user) {
        hasStayed = await Booking.exists({ listing: id, user: req.user._id, status: "confirmed" });
    }

    res.render("listings/show.ejs", { listing, hasStayed, averageRating, ratingCounts });
}));


router.post("/", isLoggedIn, isAdmin, upload.single('listing[image]'), validateListing, wrapAsync(async(req,res,next)=>{ 
    const neweListing = new Listing(req.body.listing);  
    neweListing.owner = req.user._id;
    neweListing.image = {url: req.file?.path, filename: req.file?.filename};
    
    
    neweListing.geometry = await geocodeNominatim(req.body.listing.location);

    await neweListing.save();
    req.flash("success","New Listing Created!"); 
    res.redirect("/listings");
}));
 
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(async(req,res)=>{
    let{id}=req.params;
    let listing = await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you requested for doesn't exist");
        return res.redirect("/listings");
    }          
    res.render("listings/edit.ejs",{listing});
}));


router.post("/:id/wishlist", isLoggedIn, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  const index = user.wishlist.indexOf(id);
  if (index === -1) {
    user.wishlist.push(id);
    req.flash("success", "Added to wishlist");
  } else {
    user.wishlist.splice(index, 1);
    req.flash("success", "Removed from wishlist");
  }
  await user.save();
  res.redirect("back");
}));


router.post("/:id/wishlist/api", isLoggedIn, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  const index = user.wishlist.findIndex(wid => wid.toString() === id);
  let wishlisted;
  if (index === -1) {
    user.wishlist.push(id);
    wishlisted = true;
  } else {
    user.wishlist.splice(index, 1);
    wishlisted = false;
  }
  await user.save();
  res.json({ success: true, wishlisted });
}));


router.post("/:id/cart", isLoggedIn, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);

  const index = user.cart.indexOf(id);

  if (index === -1) {
    user.cart.push(id);
    req.flash("success", "Added to Cart!");
  } else {
    user.cart.splice(index, 1);
    req.flash("success", "Removed from Cart!");
  }

  await user.save();
  res.redirect("back");
}));



router.post("/:id/cart/api", isLoggedIn, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  const index = user.cart.findIndex(cid => cid.toString() === id);
  let inCart;
  if (index === -1) { user.cart.push(id); inCart = true; }
  else              { user.cart.splice(index, 1); inCart = false; }
  await user.save();
  res.json({ success: true, inCart });
}));
router.put("/:id", isLoggedIn, isOwner, upload.single('listing[image]'), validateListing, wrapAsync(async(req,res)=>{
    let {id}=req.params;
    let listing = await Listing.findById(id);
    
    
    Object.assign(listing, req.body.listing);
    
    if(typeof req.file !=="undefined"){
        listing.image = {url: req.file.path, filename: req.file.filename};
    }

    
    if (req.body.listing.location) {
        listing.geometry = await geocodeNominatim(req.body.listing.location);
    }

    await listing.save();
    req.flash("success"," Listing Updated!"); 
    res.redirect(`/listings/${id}`);
}));


router.delete("/:id", isLoggedIn, isOwner, wrapAsync(async(req,res)=>{
    let {id}=req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success","Deleted Successfully!"); 
    res.redirect("/listings");
}));


router.post("/:id/book", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { checkIn, checkOut, guests, phone, email, message } = req.body;
    
    const listing = await Listing.findById(id);
    if(!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    const checkInDate = checkIn ? new Date(checkIn) : new Date();
    const checkOutDate = checkOut ? new Date(checkOut) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const numGuests = guests ? parseInt(guests) : 1;

    const diffDays = Math.max(1, Math.ceil(Math.abs(checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));

    const newBooking = new Booking({
        listing: id,
        user: req.user._id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: numGuests,
        phone: phone || req.user.phone || "N/A",
        email: email || req.user.email || "not-provided@example.com",
        message: message || "",
        totalPrice: (listing.price || 0) * diffDays,
        status: "confirmed"
    });
    await newBooking.save();
    req.flash("success", `Booking successful for ${listing.title}!`);
    res.redirect(`/listings/${id}/confirmation/${newBooking._id}`);
}));



router.get("/:id/confirmation/:bookingId", isLoggedIn, wrapAsync(async (req, res) => {
    const { id, bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate("listing").populate("user");
    if (!booking) {
        req.flash("error", "Booking not found");
        return res.redirect("/listings");
    }
    res.render("listings/confirmation.ejs", { booking });
}));



router.post("/:id/book/api", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { checkIn, checkOut, guests, phone, email, message } = req.body;
    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ success: false, error: "Listing not found" });
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const numGuests = guests ? parseInt(guests) : 1;
    const diffDays = Math.max(1, Math.ceil(Math.abs(checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));
    const totalPrice = (listing.price || 0) * diffDays;

    const newBooking = new Booking({
        listing: id,
        user: req.user._id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: numGuests,
        phone: phone || "N/A",
        email: email || req.user.email || "not-provided@example.com",
        message: message || "",
        totalPrice,
        status: "confirmed"
    });
    await newBooking.save();
    res.json({
        success: true,
        bookingId: newBooking._id,
        title: listing.title,
        nights: diffDays,
        totalPrice,
        checkIn: checkInDate.toDateString(),
        checkOut: checkOutDate.toDateString()
    });
}));

module.exports=router;