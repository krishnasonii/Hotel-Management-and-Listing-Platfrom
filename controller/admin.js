const Listing = require("../models/listing");
const User = require("../models/user");
const Booking = require("../models/booking");
const Room = require("../models/room");

module.exports.dashboard = async (req, res) => {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalHotels = await Listing.countDocuments();
    const totalBookings = await Booking.countDocuments();
    
    
    const confirmedBookings = await Booking.find({ status: "confirmed" });
    const totalRevenue = confirmedBookings.reduce((acc, curr) => acc + curr.totalPrice, 0);

    
    const recentBookings = await Booking.find({})
        .populate("user")
        .populate("listing")
        .sort({ createdAt: -1 })
        .limit(5);

    
    const statusCounts = {
        confirmed: await Booking.countDocuments({ status: "confirmed" }),
        cancelled: await Booking.countDocuments({ status: "cancelled" }),
        pending: await Booking.countDocuments({ status: "pending" })
    };

    
    const revenueHistory = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const start = new Date(d.setHours(0,0,0,0));
        const end = new Date(d.setHours(23,59,59,999));
        
        const dayBookings = await Booking.find({
            status: "confirmed",
            createdAt: { $gte: start, $lte: end }
        });
        const dayRevenue = dayBookings.reduce((acc, curr) => acc + curr.totalPrice, 0);
        revenueHistory.push({ date: d.toLocaleDateString('en-IN', { weekday: 'short' }), amount: dayRevenue });
    }

    res.render("admin/dashboard", { 
        stats: { totalUsers, totalHotels, totalBookings, totalRevenue },
        recentBookings,
        statusCounts,
        revenueHistory
    });
};

module.exports.manageHotels = async (req, res) => {
    const allHotels = await Listing.find({}).populate("owner");
    res.render("admin/hotels", { allHotels });
};

module.exports.manageRooms = async (req, res) => {
    const allRooms = await Room.find({}).populate("hotel");
    
    const priceSuggestions = "AI Suggestion: Increase 'Deluxe' room prices by 10% for the upcoming weekend.";
    res.render("admin/rooms", { allRooms, priceSuggestions });
};

module.exports.manageUsers = async (req, res) => {
    const allUsers = await User.find({ role: "user" });
    res.render("admin/users", { allUsers });
};

module.exports.toggleBlockUser = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/admin/users");
    }
    user.isBlocked = !user.isBlocked;
    await user.save();
    req.flash("success", `User ${user.username} ${user.isBlocked ? "blocked" : "unblocked"} successfully`);
    res.redirect("/admin/users");
};

module.exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/admin/users");
    }
    
    await User.findByIdAndDelete(id);
    req.flash("success", "User deleted successfully");
    res.redirect("/admin/users");
};

module.exports.manageBookings = async (req, res) => {
    let { status, minPrice, maxPrice, startDate, endDate, username } = req.query;
    let query = {};

    if (status && status !== "all") {
        query.status = status;
    }

    if (minPrice || maxPrice) {
        query.totalPrice = {};
        if (minPrice) query.totalPrice.$gte = Number(minPrice);
        if (maxPrice) query.totalPrice.$lte = Number(maxPrice);
    }

    if (startDate || endDate) {
        query.checkIn = {};
        if (startDate) query.checkIn.$gte = new Date(startDate);
        if (endDate) query.checkIn.$lte = new Date(endDate);
    }

    if (username) {
        const userFound = await User.findOne({ username: new RegExp(username, "i") });
        if (userFound) {
            query.user = userFound._id;
        } else {
            
            query.user = null; 
        }
    }

    const allBookings = await Booking.find(query).populate("user").populate("listing");
    res.render("admin/bookings", { allBookings, filters: req.query });
};

module.exports.reports = async (req, res) => {
    
    const monthlyRevenue = [12000, 19000, 3000, 5000, 2000, 3000]; 
    res.render("admin/reports", { monthlyRevenue });
};
