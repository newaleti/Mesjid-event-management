import express from "express";
import Event from "../models/Event.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. CREATE an Event (Protected)
router.post("/", protect, async (req, res) => {
  try {
    const { title, description, date, location, image } = req.body;

    // Basic validation
    if (!title || !description || !date || !location || !image) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }

    const newEvent = new Event({
      title: title.trim(),
      description: description.trim(),
      date: parsedDate,
      location: location.trim(),
      image: image.trim(),
      organiser: req.user.id,
    });

    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating event" });
  }
});

// 2. GET ALL Events with Search and Filter
router.get("/", async (req, res) => {
  try {
    let query = {};

    // 1. Search by a keyword in title
    if (req.query.keyword) {
      query.title = {
        $regex: req.query.keyword.trim(),
        $options: "i",
      };
    }
    // 2. Filter by Location
    if (req.query.location) {
      query.location = {
        $regex: req.query.location.trim(),
        $options: "i",
      };
    }
    // 3. Filter by Date Range (Upcoming vs All)
    if (req.query.upcoming === "true") {
      const today = new Date();
      query.date = { $gte: today };
    }

    // 1. Setup Pagination Variables (cap limit)
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    // 2. Count total matches BEFORE limiting
    const totalEvents = await Event.countDocuments(query);

    // 3. Execute search with limit and skip (sorted)
    const events = await Event.find(query)
      .populate("organiser", "username email")
      .sort({ date: 1 })
      .limit(limit)
      .skip(skip);

    // 4. Send structured response (even if empty)
    res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(totalEvents / limit),
      totalEvents,
      events,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching events" });
  }
});

// 3. UPDATE an event (Only for the owner)
router.put("/:id", protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.organiser.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this event" });
    }

    // Whitelist fields
    const updates = {};
    if (req.body.title) updates.title = req.body.title.trim();
    if (req.body.description) updates.description = req.body.description.trim();
    if (req.body.location) updates.location = req.body.location.trim();
    if (req.body.image) updates.image = req.body.image.trim();
    if (req.body.date) {
      const parsedDate = new Date(req.body.date);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Invalid date" });
      }
      updates.date = parsedDate;
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    res.status(200).json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: "Error updating event" });
  }
});

// 4. DELETE an event (Only for the owner)
router.delete("/:id", protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check Ownership
    if (event.organiser.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "User not authorized to delete this event" });
    }

    await event.deleteOne();
    res.status(200).json({ message: "Event removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
