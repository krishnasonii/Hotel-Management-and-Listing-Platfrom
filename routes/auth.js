const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/Wrapasync.js");
const passport = require("passport");


router.get("/select-role", (req, res) => {
    res.render("auth/role-selection.ejs");
});


router.get("/admin/login", (req, res) => {
    res.render("admin/login.ejs");
});

router.post("/admin/login", passport.authenticate("local",{failureRedirect: '/auth/admin/login',failureFlash: true, }),
(req,res,next)=>{
    if (req.user.role !== "admin") {
         req.logout((err) => {
            if (err) return next(err);
            req.flash("error", "Access denied: You do not have admin privileges.");
            return req.session.save(() => {
                res.redirect("/auth/admin/login");
            });
         });
    } else {
         req.flash("success","Welcome Back Admin!");
         req.session.save(() => {
             res.redirect("/admin/dashboard");
         });
    }
}
);

router.get("/admin/signup", (req, res) => {
    res.render("admin/signup.ejs");
});

router.post("/admin/signup", wrapAsync(async(req, res, next) => {
    try {
        let { username, email, password } = req.body;
        const newUser = new User({ email, username, role: "admin" }); 
        const registeredUser = await User.register(newUser, password);
        
        req.login(registeredUser, (err) => {
            if(err){
                return next(err);
            }
            req.flash("success", "Admin account created successfully!");
            req.session.save(() => {
                res.redirect("/admin/dashboard");
            });
        });
    } catch(e) {
        req.flash("error", e.message);
        res.redirect("/auth/admin/signup");
    }
}));


router.get("/user/login", (req, res) => {
    res.redirect("/login");
});

router.get("/user/signup", (req, res) => {
    res.redirect("/signup");
});

module.exports = router;
