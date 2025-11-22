const express=require("express");
const router=express.Router();
const wrapAsync=require("../utils/Wrapasync.js");
const {listingSchema}=require("../schema.js");  
const ExpressError=require("../utils/ExpressError.js");
const Listing =require("../models/listing.js");

const multer  = require('multer');
const{storage}=require("../cloudConfig.js");

const upload = multer({storage});

const validateListing=(req,res,next)=>{
    let {error}=listingSchema.validate(req.body);
    if(error){
        throw new ExpressError(400,error);
    }else{
        next();
    }
} 

router.get("/",wrapAsync(async(req,res)=>{
    let filter = {};
    if (req.query.q) {
        filter.$text = { $search: req.query.q };
    }
    
    if (req.query.category) {
        filter.category = req.query.category;
    }

    let alllistings = await Listing.find(filter);
   
    res.render("listings/index.ejs",{alllistings});
}));

    
    
router.get("/new",(req,res)=>{
    console.log(req.user);
    if(!req.isAuthenticated()){ 
        req.flash("error","you must be logged in to create listings");
        return res.redirect("/login");
    }
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
    });

    res.render("listings/index.ejs", { alllistings: listinged });
});


    
router.get("/:id",wrapAsync(async(req,res)=>{
    let {id}=req.params;
    
           

   
        /* Nested populate- */

   const listing=await Listing.findById(id)
   .populate({
    path:"reviews",
    populate:{
        path:"author",
    },
   
   })
    .populate("owner")
   
    
        if(!listing){
            req.flash("error","Listing you requested for doesn't exist");
            return res.redirect("/listings");
        }
        console.log(listing);
    res.render("listings/show.ejs",{listing});
}));


router.post("/", upload.single('listing[image]'),validateListing,  wrapAsync(async(req,res,next)=>{ 
      if(!req.isAuthenticated()){ 
        req.flash("error","you must be logged in to create listings");
        return res.redirect("/login");
    }
       
   let result= listingSchema.validate(req.body);
   console.log(result); 
   if(result.error){  
    throw new ExpressError(400,result.error);
   }

        

            
            let url=req.file?.path;
            
           
            let filename=req.file?.filename;  
           

    const neweListing =new Listing(req.body.listing);  
    
    neweListing.owner=req.user._id;
    neweListing.image={url,filename};
    await neweListing.save();
    
    req.flash("success","New Listing Created!"); 
    res.redirect("/listings");

}));  
 
router.get("/:id/edit",wrapAsync(async(req,res)=>{
    let{id}=req.params;
    let listing=await Listing.findById(id);
      if(!req.isAuthenticated()){ 
        req.flash("error","you must be logged in to create listings");
        return res.redirect("/login");
    }

             let listings =await Listing.findById(id);
    if(!listings.owner._id.equals(res.locals.currUser._id)){
        req.flash("error","you don't have permission to edit");
        return res.redirect(`/listings/${id}`);
    }
    
        if(!listing){
            req.flash("error","Listing you requested for doesn't exist");
            return res.redirect("/listings");
        }          

 

    res.render("listings/edit.ejs",{listing});

}));


router.put("/:id", upload.single('listing[image]'),validateListing,wrapAsync(async(req,res)=>{
    let {id}=req.params;
     
      if(!req.isAuthenticated()){ 
        req.flash("error","you must be logged in to create listings");
        return res.redirect("/login");
    }
    
    
    

    
    
    let listings=await Listing.findById(id);
    if(!listings.owner._id.equals(res.locals.currUser._id)){
        req.flash("error","you don't have permission to edit");
        return res.redirect(`/listings/${id}`);
    }

   
   

             let listing= await Listing.findByIdAndUpdate(id, { ...req.body.listing });
   
   if(typeof req.file !=="undefined"){
          let url=req.file.path;
      let filename=req.file.filename;
        listing.image={url,filename};
        await listing.save();
   }
    

   
   
    
        req.flash("success"," Listing Updated!"); 

    res.redirect(`/listings/${id}`);
}));


router.delete("/:id",wrapAsync(async(req,res)=>{
    let {id}=req.params;
      if(!req.isAuthenticated()){ 
        req.flash("error","you must be logged in to delete listings");
        return res.redirect("/login");
    }

      let listings=await Listing.findById(id);
    if(!listings.owner._id.equals(res.locals.currUser._id)){
        req.flash("error","you don't have permission to edit");
        return res.redirect(`/listings/${id}`);
    }

    let deleted=await Listing.findByIdAndDelete(id);
     req.flash("success","Deleted Successfully!"); 

   
    res.redirect("/listings");
}));




module.exports=router;