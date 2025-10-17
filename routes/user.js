const express=require("express");
const router=express.Router();
const User=require("../models/user.js");
const Wrapasync = require("../utils/Wrapasync.js");
const passport=require("passport");

router.get("/signup",(req,res)=>{
    res.render("users/signup.ejs");
}); 

router.post("/signup",Wrapasync(async(req,res)=>{
    try{
           let {username,email,password}=req.body;//ye extract krge ab body se
    //ab naye user ko create krge
    const newUser=new User({email,username}); 
  const registeredUser= await User.register(newUser,password);//ye registered user return krega aur DB mei save krega
     console.log(registeredUser);
     //ye signup hone pr automatic login bhi kr dega
     req.login(registeredUser,(err)=>{
        if(err){
            return next(err);
        }
    req.flash("success","Welcome the Hotel Listings and Reservation Site!");//ye succeess registrere bdd flash krega msg
     res.redirect("/listings");
     });
     //message flash kryegee agr succefully registeered kr lega to--
     //req.flash("success","Welcome the Hotel Listings and Reservation Site!");//ye succeess registrere bdd flash krega msg
    // res.redirect("/listings");
    }catch(e){
        req.flash("error",e.message);
        res.redirect("/signup");
    }
        //try catch se samee page pr error show hoga koi random page pr nii jyeege hum
})
);


router.get("/login",(req,res)=>{
    res.render("users/login.ejs");
});

//ye passport implement kr rha h agr user exit ya wrong kuch bhi hoga to redirect krke msg flash krega error ka
router.post("/login", passport.authenticate("local",{failureRedirect: '/login',failureFlash: true, }),//ye middleware phlee check krega login form
async(req,res)=>{
    req.flash("success","welcome Back to this site! You are logged in!");
    res.redirect("/listings");
}
);

//log out-
router.get("/logout",(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            next(err);
        }
        req.flash("success","you are logged out");
        res.redirect("/listings");
    })
})
module.exports= router;