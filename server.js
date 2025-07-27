const express = require("express")
const mongoose = require("mongoose")
const path = require("path")
const bcrypt = require("bcrypt")
const app = express()



app.use(express.static(__dirname))
app.use(express.urlencoded({extended:true}))
app.use(express.json());


app.get("/login",(req,res)=>{
    res.sendFile(path.join(__dirname,"login.html"))
})

mongoose.connect("mongodb+srv://vishnu:vishnu12345@cluster0.7qkvmrq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",)
const db = mongoose.connection



const userSchema = new mongoose.Schema({
    name:String,
    email:String,
    password:String,
    adhar:Number
})

const User = mongoose.model("data",userSchema)

app.post("/post", async (req, res) => {
    try {
        const { name, email, password, adhar } = req.body;

        // Optional: Check if fields exist
        if (!name || !email || !password || !adhar) {
            return res.status(400).send("All fields are required");
        }

        // Optional: Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            adhar
        });

        await user.save();
        console.log("User saved:", user);

        res.redirect("/login"); // ✅ Only this response is sent
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).send("Something went wrong"); // ✅ Make sure only one response is sent
    }
});

// Booking Schema
const bookingSchema = new mongoose.Schema({
    email: String,
    roomType: String,
    persons: Number,
    checkIn: Date,
    checkOut: Date
});

const Booking = mongoose.model("booking", bookingSchema); // ✅ Define this



app.post("/login-book", async (req, res) => {
   const { email, password, roomType, persons, checkIn, checkOut } = req.body;


    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ message: "User not found!" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ message: "Incorrect password!" });
        }

        // Check room availability
        const isBooked = await Booking.findOne({
            roomType,
            $or: [
                { checkIn: { $lt: new Date(checkOut), $gte: new Date(checkIn) } },
                { checkOut: { $gt: new Date(checkIn), $lte: new Date(checkOut) } },
                { checkIn: { $lte: new Date(checkIn) }, checkOut: { $gte: new Date(checkOut) } }
            ]
        });

        if (isBooked) {
            return res.json({ message: "Room not available for selected dates." });
        }

        const booking = new Booking({
            email,
            roomType,
            persons,
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut)
        });

        await booking.save();
        return res.json({ message: "Room booked successfully!" });

    } catch (error) {
        console.error("Login-Book Error:", error);
        return res.status(500).json({ message: "Server error occurred" });
    }
});





db.once("open",()=>{
    console.log("mongo db connected")
})


app.get("/signup",(req,res)=>{
    res.sendFile(path.join(__dirname,"signup.html"))
})




app.listen(8000,()=>{
    console.log("port is running on 8000")
})