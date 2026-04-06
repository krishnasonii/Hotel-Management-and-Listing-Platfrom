const Booking = require("../models/booking");
const Order = require("../models/order");
const User = require("../models/user");

module.exports.dashboard = async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    
    const totalBookings = await Booking.countDocuments({ user: userId, status: { $ne: "cancelled" } });
    const upcomingStays = await Booking.find({ 
        user: userId, 
        status: { $ne: "cancelled" },
        checkIn: { $gte: new Date() } 
    }).populate("listing").limit(3);

    
    const fields = ['email', 'phone', 'bio', 'username'];
    let filledCount = 0;
    fields.forEach(f => { if (user[f]) filledCount++; });
    const profileProgress = Math.round((filledCount / fields.length) * 100);

    
    let loyaltyTier = "Guest";
    if (totalBookings >= 10) loyaltyTier = "Voyager (Gold)";
    else if (totalBookings >= 5) loyaltyTier = "Explorer (Silver)";
    else if (totalBookings >= 1) loyaltyTier = "Adventurer (Bronze)";

    
    const monthlyData = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const name = monthNames[d.getMonth()] + " " + (d.getFullYear() % 100);
        
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        
        const count = await Booking.countDocuments({
            user: userId,
            createdAt: { $gte: start, $lte: end },
            status: { $ne: "cancelled" }
        });
        monthlyData.push({ month: name, count });
    }

    res.render("user/dashboard", { 
        stats: { totalBookings, profileProgress, loyaltyTier }, 
        upcomingStays,
        monthlyData 
    });
};

module.exports.bookings = async (req, res) => {
    const userId = req.user._id;
    const myBookings = await Booking.find({ user: userId })
        .populate("listing")
        .sort({ createdAt: -1 });
    
    res.render("user/bookings", { myBookings });
};

module.exports.orders = async (req, res) => {
    const userId = req.user._id;
    const myOrders = await Order.find({ user: userId })
        .populate("hotel")
        .sort({ createdAt: -1 });
    
    res.render("user/orders", { myOrders });
};

module.exports.profile = async (req, res) => {
    const user = await User.findById(req.user._id);
    res.render("user/profile", { user });
};

module.exports.wishlist = async (req, res) => {
    const user = await User.findById(req.user._id).populate("wishlist");
    res.render("user/wishlist", { wishlist: user.wishlist });
};

module.exports.cart = async (req, res) => {
    const user = await User.findById(req.user._id).populate("cart");
    res.render("user/cart", { cart: user.cart });
};

module.exports.cancelBooking = async (req, res) => {
    const { id } = req.params;
    const booking = await Booking.findOneAndUpdate(
        { _id: id, user: req.user._id }, 
        { status: "cancelled" },
        { new: true }
    );
    
    if (!booking) {
        req.flash("error", "Booking not found or unauthorized");
        return res.redirect("/user/bookings");
    }
    
    req.flash("success", "Booking cancelled successfully.");
    res.redirect("/user/bookings");
};

module.exports.generateInvoice = async (req, res) => {
    const { id } = req.params;
    const booking = await Booking.findOne({ _id: id, user: req.user._id }).populate("listing").populate("user");
    if (!booking) {
        req.flash("error", "Invoice not found or unauthorized");
        return res.redirect("/user/bookings");
    }
    res.render("user/invoice", { booking });
};
