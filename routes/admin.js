const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/Wrapasync.js");
const { isLoggedIn, isAdmin } = require("../middleware.js");
const adminController = require("../controller/admin.js");


router.use(isLoggedIn, isAdmin);


router.get("/dashboard", wrapAsync(adminController.dashboard));


router.get("/hotels", wrapAsync(adminController.manageHotels));


router.get("/rooms", wrapAsync(adminController.manageRooms));

router.get("/users", wrapAsync(adminController.manageUsers));
router.patch("/users/:id/toggle-block", wrapAsync(adminController.toggleBlockUser));
router.delete("/users/:id", wrapAsync(adminController.deleteUser));


router.get("/bookings", wrapAsync(adminController.manageBookings));


router.get("/reports", wrapAsync(adminController.reports));

module.exports = router;
