
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

// const tls = require("tls");
// tls.DEFAULT_MIN_VERSION = "TLSv1.2";


const express=require("express");
const app=express();
const mongoose=require("mongoose");
const path =require("path");
const Listing =require("./models/listing.js");
const methodOverride = require("method-override");
const ejsMate =require("ejs-mate");
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
            serverSelectionTimeoutMS: 5000,
            ssl: true,
            tls: true,
            tlsAllowInvalidCertificates: false,
            retryWrites: true
        });

        console.log("Connected to MongoDB Atlas!");
    } catch (err) {
        console.error("MongoDB connection error, retrying in 5s", err);
        setTimeout(connectWithRetry, 5000);
    }
}
connectWithRetry();

const store = MongoStore.create({
    mongoUrl: dbUrl,
    mongoOptions: {
        ssl: true,
        tls: true,
        tlsAllowInvalidCertificates: false
    },
    crypto: {
        secret: process.env.SECRET
    },
    touchAfter: 24 * 3600
});


store.on("error", (err) => {
    console.log("Error in Mongo session store", err);
});

const sessionOptions={
    store,
    secret: process.env.SECRET,
    resave:false,
    saveUninitialized:false, 
    
    cookie:{
        expires:Date.now() + 7*24*60*60*100,
        maxAge:7*24*60*60*100,
        httpOnly:true,
    },
};

/*----------*/ 


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
 
app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
   res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
   next();
});


app.use("/listings",listingRouter); 
 
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);


app.use((req, res, next) => {
    next(new ExpressError(404, "Page not found"));
});

app.use((err,req,res,next)=>{
    
   let {statusCode=500,message="something wrong"}=err;
  res.status(statusCode).render("error.ejs",{message});
 
   

});


app.listen(8080,()=>{
    console.log("app listen successfully");
    
});