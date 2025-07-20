import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["admin", "hr", "employee"],
    required: true,
    unique: true,
  },
  count: {
    type: Number,
    default: 0,
  },
});

const Counter = mongoose.model("Counter", counterSchema);

export default Counter;
