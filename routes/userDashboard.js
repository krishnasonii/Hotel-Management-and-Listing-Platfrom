const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/Wrapasync.js");
const { isLoggedIn } = require("../middleware.js");
const userController = require("../controller/user_dashboard.js");

// All user routes are prefixed with /user
router.use(isLoggedIn);

// User Dashboard
router.get("/dashboard", wrapAsync(userController.dashboard));

// Booking History
router.get("/bookings", wrapAsync(userController.bookings));

// Service Orders
router.get("/orders", wrapAsync(userController.orders));

// Profile
router.get("/profile", wrapAsync(userController.profile));

// Wishlist
router.get("/wishlist", wrapAsync(userController.wishlist));

// Cart
router.get("/cart", wrapAsync(userController.cart));

// Cancel/Delete Booking
router.delete("/bookings/:id", wrapAsync(userController.cancelBooking));

// Generate Invoice
router.get("/bookings/:id/invoice", wrapAsync(userController.generateInvoice));

module.exports = router;
