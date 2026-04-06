const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/Wrapasync.js");
const { isLoggedIn } = require("../middleware.js");
const userController = require("../controller/user_dashboard.js");


router.use(isLoggedIn);


router.get("/dashboard", wrapAsync(userController.dashboard));


router.get("/bookings", wrapAsync(userController.bookings));


router.get("/orders", wrapAsync(userController.orders));


router.get("/profile", wrapAsync(userController.profile));


router.get("/wishlist", wrapAsync(userController.wishlist));


router.get("/cart", wrapAsync(userController.cart));


router.delete("/bookings/:id", wrapAsync(userController.cancelBooking));


router.get("/bookings/:id/invoice", wrapAsync(userController.generateInvoice));

module.exports = router;
