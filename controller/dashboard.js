const Listing = require("../models/listing");
const User = require("../models/user");
const Booking = require("../models/booking");

module.exports.adminDashboard = async (req, res) => {
    const totalListings = await Listing.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();
    
    // Aggregating total revenue
    const bookings = await Booking.find({ status: "confirmed" });
    const totalRevenue = bookings.reduce((acc, curr) => acc + curr.totalPrice, 0);

    const recentBookings = await Booking.find()
        .populate("listing")
        .populate("user")
        .sort({ createdAt: -1 })
        .limit(5);

    const allUsers = await User.find().limit(10);
    const allListings = await Listing.find().populate("owner").limit(10);

    res.render("dashboard/admin", {
        stats: { totalListings, totalUsers, totalBookings, totalRevenue },
        recentBookings,
        allUsers,
        allListings
    });
};

module.exports.ownerDashboard = async (req, res) => {
    const userId = req.user._id;
    const myListings = await Listing.find({ owner: userId });
    const myListingIds = myListings.map(l => l._id);

    const totalRooms = myListings.length;
    const myBookings = await Booking.find({ listing: { $in: myListingIds } })
        .populate("listing")
        .populate("user")
        .sort({ createdAt: -1 });

    const totalBookings = myBookings.length;
    const totalRevenue = myBookings
        .filter(b => b.status === "confirmed")
        .reduce((acc, curr) => acc + curr.totalPrice, 0);

    // Mock occupancy for UI demonstration
    const occupancy = totalRooms > 0 ? 74 : 0; 

    res.render("dashboard/owner", {
        stats: { totalRooms, totalBookings, totalRevenue, occupancy },
        listings: myListings,
        bookings: myBookings.slice(0, 5)
    });
};
