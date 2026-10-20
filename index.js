const express = require("express");
const app = express();
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const RoomBooking = require("./models/room.models");
const multer = require("multer");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const Admin = require("./models/admin");
const session = require("express-session");
const Booking = require("./models/booking.models");
const Contact = require("./models/contact.models");
const Review = require("./models/review.models");
const Subscribe = require("./models/subscribe.models");
const Setting = require("./models/setting.models");

app.use(
  session({
    secret: process.env.SESSION_SECRET || "saleem123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  }),
);

function requireAdminLogin(req, res, next) {
  if (req.session && req.session.isAdminLoggedIn) {
    return next();
  }
  res.redirect("/admin");
}

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// middleware setting

app.use(async (req, res, next) => {
  try {
    res.locals.settings = await Setting.findOne().lean();
    next();
  } catch (err) {
    next(err);
  }
});

// Sirf development ke liye ya protected route
app.post("/create-admin", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin already exists
    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = new Admin({ email, password });
    await admin.save();

    res.json({ message: "Admin created successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/admin", (req, res) => {
  res.render("admin", { message: null });
});

//Admin Login
app.post("/adminlogin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return res.render("admin", {
        message: "Invalid Email Or Password",
        type: "error",
      });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.render("admin", {
        message: "Invalid Email Or Password",
        type: "error",
      });
    }

    req.session.isAdminLoggedIn = true;
    req.session.adminEmail = admin.email;

    res.redirect("/dashboard?success=Login successful");
  } catch (err) {
    console.error(err);
    res.render("admin", {
      message: "Something went wrong",
      type: "error",
    });
  }
});

// Update Password
app.post("/update-password", requireAdminLogin, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.redirect("/dashboard?error=All fields are required");
    }

    if (newPassword !== confirmPassword) {
      return res.redirect(
        "/dashboard?error=New password and Confirm password do not match",
      );
    }

    const admin = await Admin.findOne({ email: req.session.adminEmail });
    if (!admin) return res.redirect("/admin");

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.redirect("/dashboard?error=Current password is incorrect");
    }

    admin.password = newPassword;
    await admin.save();

    res.redirect("/dashboard?success=Password updated successfully!");
  } catch (err) {
    console.error(err);
    res.redirect(
      "/dashboard?error=Something went wrong while updating password",
    );
  }
});

//Image upload middleware
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    const newfilename = Date.now() + path.extname(file.originalname);
    cb(null, newfilename);
  },
});
const filefilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only Image are allowed..!"));
  }
};
const upload = multer({
  storage: storage,
  fileFilter: filefilter,
  limits: {
    fileSize: 1024 * 1024 * 3,
  },
});

//Home page
app.get("/", async (req, res) => {
  try {
    const rooms = await RoomBooking.find();
    const review = await Review.find().sort({ createdAt: -1 });
    res.render("index", {
      rooms,
      success: req.query.success || null,
      error: req.query.error || null,
      bookingSuccess: req.query.booking === "success",
      review: review,
    });
  } catch (error) {
    res.render("index", {
      rooms: [],
      success: null,
      error: "Error loading rooms",
      bookingSuccess: false,
    });
  }
});

// Room Add
app.post(
  "/saveroom",
  requireAdminLogin,
  upload.single("image"),
  async (req, res) => {
    try {
      const roomData = new RoomBooking({
        roomnumber: req.body.roomnumber,
        roomtype: req.body.roomtype,
        roomfloor: req.body.roomfloor,
        roomrupees: req.body.roomrupees,
        roomstatus: req.body.roomstatus,
        roomdesc: req.body.roomdesc,
        image: req.file ? req.file.filename : undefined,
      });

      await roomData.save();
      res.redirect("/dashboard?success=Room added successfully");
    } catch (error) {
      console.log("Error →", error.message);
      res.redirect("/dashboard?error=Failed to add room");
    }
  },
);

// Delete Room
app.get("/delete/:id", requireAdminLogin, async (req, res) => {
  try {
    const room = await RoomBooking.findByIdAndDelete(req.params.id);

    if (room && room.image) {
      const filepath = path.join(__dirname, "uploads", room.image);
      fs.unlink(filepath, (err) => {
        if (err) console.log("Failed to delete image:", err.message);
      });
    }

    res.redirect("/dashboard?success=Room deleted successfully");
  } catch (err) {
    res.redirect("/dashboard?error=Failed to delete room");
  }
});

app.post(
  "/editroom/:id",
  requireAdminLogin,
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        roomnumber,
        roomtype,
        roomfloor,
        roomrupees,
        roomstatus,
        roomdesc,
      } = req.body;
      const roomId = req.params.id;

      const room = await RoomBooking.findById(roomId);
      if (!room) {
        return res.redirect("/dashboard?error=Room not found");
      }

      room.roomnumber = roomnumber;
      room.roomtype = roomtype;
      room.roomfloor = roomfloor;
      room.roomrupees = roomrupees;
      room.roomstatus = roomstatus;
      room.roomdesc = roomdesc;

      if (req.file) {
        if (room.image) {
          const oldImagePath = path.join(__dirname, "uploads", room.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        room.image = req.file.filename;
      }

      await room.save();
      res.redirect("/dashboard?success=Room updated successfully");
    } catch (err) {
      console.error("Update Error:", err);
      res.redirect("/dashboard?error=Failed to update room");
    }
  },
);

app.get("/room/:id", async (req, res) => {
  try {
    const room = await RoomBooking.findById(req.params.id);

    if (!room) {
      return res.status(404).send("Room not found");
    }

    const review = await Review.find().sort({ createdAt: -1 });

    res.render("roomdetails", {
      room,
      review,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/dashboard", requireAdminLogin, async (req, res) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    Pragma: "no-cache",
    Expires: "0",
  });

  try {
    const room = await RoomBooking.find();
    const bookings = await Booking.find().sort({ createdAt: -1 });
    const contact = await Contact.find().sort({ createdAt: -1 });
    const review = await Review.find().sort({ createdAt: -1 });
    const subscribe = await Subscribe.find().sort({ createdAt: -1 });
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }

    res.render("dashboard", {
      message: null,
      room,
      bookings,
      contact,
      review,
      subscribe,
      settings,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) {
    res.render("dashboard", {
      message: "Error loading data",
      room: [],
      bookings: [],
      contact: [],
      success: null,
      error: "Error loading data",
    });
  }
});

//Booked Room
app.post("/book-room", async (req, res) => {
  try {
    const { fullName, email, mobile, moveInDate, message } = req.body;

    if (!fullName || !email || !mobile || !moveInDate) {
      return res.redirect("/?error=Please fill all required fields");
    }

    const booking = new Booking({
      fullName,
      email,
      mobile,
      moveInDate,
      message,
    });

    await booking.save();
    res.redirect(
      "/?success=Booking submitted successfully! We will contact you soon.",
    );
  } catch (err) {
    console.error("Booking Error:", err);
    res.redirect("/?error=Something went wrong. Please try again.");
  }
});

// Booking Confirm
app.get("/booking/confirm/:id", requireAdminLogin, async (req, res) => {
  try {
    await Booking.findByIdAndUpdate(req.params.id, { status: "Confirmed" });
    res.redirect("/dashboard?success=Booking confirmed successfully!");
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard?error=Failed to confirm booking");
  }
});

app.get("/booking/cancel/:id", requireAdminLogin, async (req, res) => {
  try {
    await Booking.findByIdAndUpdate(req.params.id, { status: "Cancelled" });
    res.redirect("/dashboard?success=Booking cancelled");
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard?error=Failed to cancel booking");
  }
});

app.get("/booking/delete/:id", requireAdminLogin, async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.redirect("/dashboard?success=Booking deleted successfully");
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard?error=Failed to delete booking");
  }
});

//Contact Us
app.post("/submitcontact", async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;

    if (!name || !phone || !email || !message) {
      return res.redirect("/?error=Please fill all required fields");
    }

    const newContact = new Contact({ name, phone, email, message });
    await newContact.save();

    res.redirect(
      "/?success=Message sent successfully! We will get back to you soon.",
    );
  } catch (err) {
    console.error("Contact Error:", err);
    res.redirect("/?error=Something went wrong. Please try again.");
  }
});

// delete contact
app.post("/delete-contact/:id", requireAdminLogin, async (req, res) => {
  try {
    const data = await Contact.findByIdAndDelete(req.params.id);

    if (data) {
      return res.redirect("/dashboard?success=Contact message deleted");
    } else {
      return res.redirect("/dashboard?error=Contact message not found");
    }
  } catch (error) {
    console.error("Delete Contact Error:", error);
    res.redirect("/dashboard?error=Something went wrong while deleting");
  }
});

// Review Data
app.post("/reviewsubmit", async (req, res) => {
  try {
    const { name, rating, message } = req.body;
    if (!name || !rating || !message) {
      return res.redirect("/?error=Please fill all required fields");
    }
    const review = new Review({ name, rating, message });
    await review.save();
    res.redirect("/?success=Thanks for the review.");
  } catch (err) {
    console.error("Contact Error:", err);
    res.redirect("/?error=Something went wrong. Please try again.");
  }
});

//Delete Review
app.get("/deletereview/:id", requireAdminLogin, async (req, res) => {
  try {
    const data = await Review.findByIdAndDelete(req.params.id);
    if (!data) {
      res.redirect("/dashboard?error=Failed to delete Review");
    }
    res.redirect("/dashboard?success=Review deleted successfully");
  } catch (error) {
    res.redirect("/dashboard?error=Failed to delete Review");
  }
});

// Subscribe Email
app.post("/subscribesubmit", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.redirect("/?error=Please enter your email address.");
    }
    // Check duplicate email
    const existingSubscribe = await Subscribe.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingSubscribe) {
      return res.redirect("/?error=You are already subscribed.");
    }
    const subscribe = new Subscribe({
      email: email.trim().toLowerCase(),
    });

    await subscribe.save();

    res.redirect("/?success=Thanks for subscribing!");
  } catch (err) {
    console.error("Subscribe Error:", err);
    res.redirect("/?error=Something went wrong. Please try again.");
  }
});

// Deleted Subscribe
app.get("/deletesubscribe/:id", requireAdminLogin, async (req, res) => {
  try {
    await Subscribe.findByIdAndDelete(req.params.id);

    res.redirect("/dashboard?success=Subscriber deleted successfully");
  } catch (err) {
    console.error("Delete Subscribe Error:", err);
    res.redirect("/dashboard?error=Unable to delete subscriber");
  }
});

// Update Logo email phone email address

app.post(
  "/settingupdate",
  requireAdminLogin,
  upload.single("logo"),
  async (req, res) => {
    try {
      const fields = [
        "address",
        "phone",
        "email",
        "mapLink",
        "facebook",
        "instagram",
        "linkedin",
        "twitter",
      ];

      const updateData = {};

      fields.forEach((field) => {
        updateData[field] = (req.body[field] || "").trim();
      });

      if (req.file) {
        updateData.logo = req.file.filename;
      }

      await Setting.findOneAndUpdate(
        {},
        { $set: updateData },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );

      res.redirect("/dashboard?success=Settings updated successfully");
    } catch (err) {
      console.error("Update Settings Error:", err);

      res.redirect("/dashboard?error=Unable to update settings");
    }
  },
);

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.log(err);
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Database Connected");

    app.listen(3000, () => {
      console.log("Server running on port 3000");
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exitCode = 1;
  }
}

startServer();
