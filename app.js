
// Load environment variables in non-production
//agr hamrai node envrmnt ki value production p nii h to dotenv ka use krge
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const tls = require("tls");
tls.DEFAULT_MIN_VERSION = "TLSv1.2";


const express=require("express");
const app=express();
const mongoose=require("mongoose");
const path =require("path");
const Listing =require("./models/listing.js");
const methodOverride = require("method-override");
const ejsMate =require("ejs-mate");
//const wrapAsync=require("./utils/Wrapasync.js");
const ExpressError=require("./utils/ExpressError.js");


const listingRouter=require("./routes/listings.js");
const reviewRouter=require("./routes/review.js");
const  userRouter=require("./routes/user.js");

const session=require("express-session");
const MongoStore = require('connect-mongo');
 
const { createSecretKey } = require("crypto");
const flash= require("connect-flash");

const passport=require("passport");
const LocalStrategy =require("passport-local");
const User=require("./models/user.js"); 


app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate); 
app.use(express.static(path.join(__dirname, "/public")));


const dbUrl = process.env.ATLASDB_URL;

async function connectWithRetry() {
    try {
        await mongoose.connect(dbUrl, {
            tls: true,                       // Force TLS
            tlsAllowInvalidCertificates: false,
            serverSelectionTimeoutMS: 5000   // Fail quickly if network issues
        });
        console.log("Connected to MongoDB Atlas!");
    } catch (err) {
        console.error("MongoDB connection error, retrying in 5s", err);
        setTimeout(connectWithRetry, 5000);
    }
}
connectWithRetry();


/* mongo session --isse ab session ki informatino mongo atlad mei online hoga*/
const store=MongoStore.create({
    mongoUrl: dbUrl,
    crypto:{
        secret:process.env.SECRET
    },
    touchAfter:24*3600,//Har 24 hours mein ek baar session ko update karega, bar bar unnecessary writes nahi karega
});

store.on("error", () =>{
    console.log("Error in Mongo session store",err);
});

const sessionOptions={
    store,//Mongostore ki information pass kiye h//Session MongoDB mein store hoga, memory mein nahi
    secret: process.env.SECRET,//session data ko encrypt krta h//Cookie encrypt karne ke liye
    resave:false,//Agar session change nahi hua toh dubara save mat karo
    saveUninitialized:false, //Naya session turant create nahi hoga jab tak kuch store na ho
    //ye hum login validity set krega koi website pr kitne din tkk rh skte h login
    cookie:{
        expires:Date.now() + 7*24*60*60*100,//7 days 24 hours 60min 60sec 100milisec//Login session 7 din tak valid rahega
        maxAge:7*24*60*60*100,
        httpOnly:true,//Browser JavaScript se cookie access nahi kar sakta — security feature
    },
};




app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());//passport initialize krne k liye
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());//login k time session serialize krna baar baar login na karna pre
passport.deserializeUser(User.deserializeUser());//agr session end ho ya to user ko deserialize krna
 
app.use((req,res,next)=>{
    res.locals.success=req.flash("success");//koi bhi flash msg ko print k liye ise locals ke andr save krna hota h
   res.locals.error=req.flash("error");
    res.locals.currUser=req.user;//user ki infomation ko store kar rha h 
   next();
});


app.use("/listings",listingRouter); /* yhi single line code express router ko chala rha h  */
 
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);

// Catch-all for any undefined route (404)
app.use((req, res, next) => {
    next(new ExpressError(404, "Page not found"));
});

app.use((err,req,res,next)=>{
    //locals ko hum  ejs mei aasani se access kr sakte h for print something
   let {statusCode=500,message="something wrong"}=err;//ye err se hum nikale h agr ye dono aaye page not msg print krga
  res.status(statusCode).render("error.ejs",{message});
 //res.render("error.ejs",{err}); //ye message pass kiye h error.ejs mei whi print krga
   

});


app.listen(8080,()=>{
    console.log("app listen successfully");
    
});