import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    records: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["present", "absent", "late"],
          default: "present",
        },
        note: String, // Optional: "Sick", "Travel", etc.
      },
    ],
  },
  { timestamps: true },
);

// Ensure a teacher doesn't accidentally submit attendance twice for the same event on the same day
AttendanceSchema.index({ event: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", AttendanceSchema);
