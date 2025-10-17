const express=require("express");
const router=express.Router();
const wrapAsync=require("../utils/Wrapasync.js");
const {listingSchema}=require("../schema.js");  
const ExpressError=require("../utils/ExpressError.js");
const Listing =require("../models/listing.js");

const multer  = require('multer');
const{storage}=require("../cloudConfig.js");//ye storagee ko requir kre
//const upload = multer({ dest: 'uploads/' });//iske andr file save hoga localstorage meei
const upload = multer({storage});//ye cloudinary ki storagee meei jaak save kryga

const validateListing=(req,res,next)=>{
    let {error}=listingSchema.validate(req.body);//yee body se sara shchema validatee krgea agr error ho to eeror dega
    if(error){
        throw new ExpressError(400,error);
    }else{
        next();
    }
} 

/* ismei common part listings h to listing sab jgh se hata degee */
router.get("/",wrapAsync(async(req,res)=>{
    let alllistings= await Listing.find({});
    res.render("listings/index.ejs",{alllistings});
}));

    // 2--Create route-- y show ke baad aata lekin phle aaya kyu ki wo error de rha tha---
    //New Route--
router.get("/new",(req,res)=>{
    console.log(req.user);//ye login ke baad ka user ka details show krta h
    if(!req.isAuthenticated()){ //ye authenticatee krti h user logged in hai ya nii
        req.flash("error","you must be logged in to create listings");
        return res.redirect("/login");
    }
    res.render("listings/new.ejs" );

});
    //1---SHOW ROUTE-- ye id ke basis pr sara deetails print krega--
router.get("/:id",wrapAsync(async(req,res)=>{
    let {id}=req.params;
    //const listing=await Listing.findById(id).populate("reviews");//id ke basis p ye open hoga--
           //populate means ye id ke basis pr review ka whole data print krega

   // const listing=await Listing.findById(id).populate("reviews").populate("owner");
        /* Nested populate- */

   const listing=await Listing.findById(id)
   /* ye hrr ek review ke saath author ke name and id ko print krega */
   .populate({
    path:"reviews",
    populate:{
        path:"author",
    },
   
   })
    .populate("owner")
   
    //ye review ke saath saath owner ka detail bhi show krge by using populate
        if(!listing){//agr listing exist nhii krti h to flash krwyegee msg
            req.flash("error","Listing you requested for doesn't exist");
            return res.redirect("/listings");
        }
        console.log(listing);
    res.render("listings/show.ejs",{listing});
}));

//Create route 
router.post("/", upload.single('listing[image]'),validateListing,  wrapAsync(async(req,res,next)=>{ //wrapAsync error handle and async for db data extract
      if(!req.isAuthenticated()){ //ye authenticatee krti h user logged in hai ya nii
        req.flash("error","you must be logged in to create listings");
        return res.redirect("/login");
    }
       // Joi validation
   let result= listingSchema.validate(req.body);
   console.log(result); 
   if(result.error){  //agr error aa rha h joi kee andr to ye error throw krega 
    throw new ExpressError(400,result.error);
   }

        //ye isliy comment kiye kyu ki ab hum iss cloudinary ko mongo se connect kr rhee h
   /*   console.log("REQ FILE:", req.file);
    return res.send(req.file);  //  stops here and shows file info in browser
  */

            //cloudinary work--->
            let url=req.file?.path;//url ka path req kiye h jiise sirf path aayega
            //ye url ke jgh path isliye kiye h req kyu ki cloudinary ye path name se save krta h
           
            let filename=req.file?.filename;  //ye fileename ko req kiye h jismei data store h
           // console.log(url,"..",filename); 

    const neweListing =new Listing(req.body.listing);  //ye request ki body se listing nikal rahe h mtlb pura object
    //ye owner ke wjh se add kiye req.user wala nii to error dga agr new listing create krge to--
    neweListing.owner=req.user._id;
    neweListing.image={url,filename};
    await neweListing.save();//phir iss listings ko add kr rhee h db mei jo save ho jyga
    //console.log(neweListing);
    req.flash("success","New Listing Created!"); 
    res.redirect("/listings");

}));  


    //Edit-Show---
router.get("/:id/edit",wrapAsync(async(req,res)=>{
    let{id}=req.params;
    let listing=await Listing.findById(id);
      if(!req.isAuthenticated()){ //ye authenticatee krti h user logged in hai ya nii
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

//Update to Edit--Merge--
router.put("/:id", upload.single('listing[image]'),validateListing,wrapAsync(async(req,res)=>{
    let {id}=req.params;
     
      if(!req.isAuthenticated()){ //ye authenticatee krti h user logged in hai ya nii
        req.flash("error","you must be logged in to create listings");
        return res.redirect("/login");
    }
    //  if(!req.body.listing){  //ye khh rha h agr listing nhi mila mltb pura data db se to ye error throw kr do
    //     throw new ExpressError(400,"send valid data for listing");
    // }

    //ye hum check kr rhe agr logged in user owner kee equl h tbhi edit ya dltee kr payee
    //nahi to error msg flash hoga ismei sirf samee useer hi apnee listing ko dlte ya edit kr skta h
    let listings=await Listing.findById(id);
    if(!listings.owner._id.equals(res.locals.currUser._id)){
        req.flash("error","you don't have permission to edit");
        return res.redirect(`/listings/${id}`);
    }

   //await Listing.findByIdAndUpdate(id,{...req.body.listing});//use for all field update--
   //await Listing.findByIdAndUpdate(id, { ...req.body.listing });

             let listing= await Listing.findByIdAndUpdate(id, { ...req.body.listing });
   //cloudinary work
   if(typeof req.file !=="undefined"){//agr file upload nii kiya gya to underfine show krega yhi rukk jyega code nahi to aage bhdega
          let url=req.file.path;
      let filename=req.file.filename;
        listing.image={url,filename};
        await listing.save();
   }
    

   //for specfic field 
   //await Listing.findByIdAndUpdate(id, { description: req.body.listing.description });
    //res.redirect("/listings"); //yhe main page pr redirect kreega
        req.flash("success"," Listing Updated!"); 

    res.redirect(`/listings/${id}`);//ye show wale route r redirect krega--
}));

//DELETE ROUTE--
router.delete("/:id",wrapAsync(async(req,res)=>{
    let {id}=req.params;
      if(!req.isAuthenticated()){ //ye authenticatee krti h user logged in hai ya nii
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

   // console.log(deleted);
    res.redirect("/listings");
}));

module.exports=router;