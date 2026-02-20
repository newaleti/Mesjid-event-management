import mongoose from "mongoose";
const MarklistSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true,
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    attendanceScore: { type: Number, default: 0, min: 0, max: 10 },
    testScore: { type: Number, default: 0, min: 0, max: 20 },
    midExam: { type: Number, default: 0, min: 0, max: 30 },
    finalExam: { type: Number, default: 0, min: 0, max: 40 },
    totalScore: { type: Number, default: 0 },
    grade: { type: String }, // e.g., "A", "B", "Pass"
    teacherNote: { type: String },
}, { timestamps: true });
// Auto-calculate total score before saving
MarklistSchema.pre("save", function () {
    this.totalScore =
        this.attendanceScore + this.testScore + this.midExam + this.finalExam;
});
export default mongoose.model("Marklist", MarklistSchema);
