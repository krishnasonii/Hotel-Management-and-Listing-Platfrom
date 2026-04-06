const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/Wrapasync.js");
const { isLoggedIn } = require("../middleware.js");

// Main Dashboard Redirection
router.get("/", isLoggedIn, (req, res) => {
    if (req.user.role === "admin") {
        return res.redirect("/admin/dashboard");
    } else {
        return res.redirect("/user/dashboard");
    }
});

module.exports = router;
