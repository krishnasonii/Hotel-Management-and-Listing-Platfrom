const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/Wrapasync.js");
const { isLoggedIn, isAdmin } = require("../middleware.js");
const adminController = require("../controller/admin.js");

// All admin routes are prefixed with /admin
router.use(isLoggedIn, isAdmin);

// Admin Dashboard
router.get("/dashboard", wrapAsync(adminController.dashboard));

// Hotel Management
router.get("/hotels", wrapAsync(adminController.manageHotels));

// Room Management
router.get("/rooms", wrapAsync(adminController.manageRooms));

router.get("/users", wrapAsync(adminController.manageUsers));
router.patch("/users/:id/toggle-block", wrapAsync(adminController.toggleBlockUser));
router.delete("/users/:id", wrapAsync(adminController.deleteUser));

// Booking Management
router.get("/bookings", wrapAsync(adminController.manageBookings));

// Reports
router.get("/reports", wrapAsync(adminController.reports));

module.exports = router;
