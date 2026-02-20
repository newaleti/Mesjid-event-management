import express from "express";
import Marklist from "../models/Marklist.js";
import Event from "../models/Event.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
const router = express.Router();
// @route   POST /api/marklist/upsert
// @desc    Create or Update a student's grade
router.post("/upsert", protect, authorize("teacher"), async (req, res) => {
    try {
        const { eventId, studentId, attendanceScore, quizScore, midExam, finalExam, teacherNote, } = req.body;
        if (!req.user) {
            return res.status(401).json({ message: "Not authorized" });
        }
        // 1. Check if event exists
        const event = await Event.findById(eventId);
        if (!event)
            return res.status(404).json({ message: "Event not found" });
        if (!event.teacher) {
            return res
                .status(400)
                .json({ message: "This event does not have a teacher assigned." });
        }
        if (event.teacher.toString() !== req.user.id) {
            return res
                .status(403)
                .json({ message: "Unauthorized or Event not found." });
        }
        // 2. Find existing marklist or create new one
        let marklist = await Marklist.findOne({
            event: eventId,
            student: studentId,
        });
        if (marklist) {
            marklist.attendanceScore = attendanceScore || marklist.attendanceScore;
            marklist.testScore = quizScore || marklist.testScore;
            marklist.midExam = midExam || marklist.midExam;
            marklist.finalExam = finalExam || marklist.finalExam;
            marklist.teacherNote = teacherNote || marklist.teacherNote;
        }
        else {
            marklist = new Marklist({
                event: eventId,
                student: studentId,
                teacher: req.user.id,
                attendanceScore,
                quizScore,
                midExam,
                finalExam,
                teacherNote,
            });
        }
        await marklist.save();
        res.status(200).json({ message: "Grades updated successfully", marklist });
    }
    catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});
// @route   GET /api/marklist/event/:eventId
// @desc    Get all grades for a specific class (for Teacher/Admin)
router.get("/event/:eventId", protect, async (req, res) => {
    const grades = await Marklist.find({ event: req.params.eventId }).populate("student", "firstName lastName");
    res.json(grades);
});
export default router;
