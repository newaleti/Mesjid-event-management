import express from "express";
import Event from "../models/Event.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import Attendance from "../models/Attendance.js";
const router = express.Router();
// @desc    Submit attendance for an event
router.post("/submit", protect, authorize("teacher"), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not authorized" });
        }
        const { eventId, records, date } = req.body;
        // 1. Check if event exists
        const event = await Event.findById(eventId);
        if (!event)
            return res.status(404).json({ message: "Event not found" });
        // 2. SECURITY: Is this the teacher assigned to this event?
        if (!event.teacher) {
            return res.status(400).json({
                message: "This event does not have a teacher assigned.",
            });
        }
        if (event.teacher.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Access Denied: You are not the assigned teacher for this event.",
            });
        }
        // 3. Create the attendance record
        const newAttendance = new Attendance({
            event: eventId,
            teacher: req.user.id,
            date: date || Date.now(),
            records,
        });
        await newAttendance.save();
        res.status(201).json({
            message: "Attendance recorded successfully",
            attendance: newAttendance,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error saving attendance" });
    }
});
// @desc    Get all attendance records for a specific event
router.get("/:eventId", protect, async (req, res) => {
    try {
        const records = await Attendance.find({ event: req.params.eventId })
            .populate("records.student", "firstName lastName")
            .sort({ date: -1 });
        res.json(records);
    }
    catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});
export default router;
