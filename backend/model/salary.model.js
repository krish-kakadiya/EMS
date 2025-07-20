import mongoose from "mongoose";

const salarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  basic: { type: Number, required: true },
  hra: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  total: { type: Number, required: true },
}, { timestamps: true });

const Salary = mongoose.model("Salary", salarySchema);

export default Salary;
