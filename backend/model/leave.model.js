import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["medical","personal", "other"],
    required: true,
  },
  reason: {
    type: String,
    trim: true,
  },
  fromDate: {
    type: Date,
    required: true,
  },
  toDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  }
}, {
  timestamps: true
});

const Leave = mongoose.model("Leave", leaveSchema);

export default Leave;
