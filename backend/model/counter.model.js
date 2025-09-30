import mongoose from "mongoose";

// Generic counter usable for roles, projects, tasks, etc.
const counterSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["admin", "hr", "employee", "pm", "project", "task"],
    required: true,
    unique: true,
  },
  count: {
    type: Number,
    default: 0,
  },
});

counterSchema.index({ role: 1 });

const Counter = mongoose.model("Counter", counterSchema);

export default Counter;
