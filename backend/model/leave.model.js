import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["sick", "casual", "earned", "unpaid", "maternity", "paternity", "other"],
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
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // usually an admin or HR
    default: null,
  },
  rejectionReason: {
    type: String,
    default: null,
  }
}, {
  timestamps: true
});

const Leave = mongoose.model("Leave", leaveSchema);

export default Leave;
