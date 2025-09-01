import Leave from "../model/leave.model.js";

// 🟢 Apply for Leave
export const applyLeave = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("User from token:", req.user);
    const { type, reason, fromDate, toDate } = req.body;

    if (!type || !fromDate || !toDate) {
      return res.status(400).json({ success: false, message: "All required fields must be filled" });
    }

    const leave = new Leave({
      user: req.user.id, // assuming auth middleware sets req.user
      type,
      reason,
      fromDate,
      toDate
    });

    await leave.save();
    res.status(201).json({ success: true, message: "Leave request submitted", leave });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error applying for leave", error: error.message });
  }
};

// 🟢 Get All Leaves (Admin)
export const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate("user", "employeeId name email") // populate user info
      .sort({ createdAt: -1 });

    res.json({ success: true, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching leaves", error: error.message });
  }
};

// 🟢 Get My Leaves (Employee)
export const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching leaves", error: error.message });
  }
};

// 🟢 Update Leave Request (only before approval/rejection)
export const updateLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave not found" });
    }

    if (leave.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to update this leave" });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({ success: false, message: "Cannot update leave after approval/rejection" });
    }

    const updates = req.body;
    Object.assign(leave, updates);
    await leave.save();

    res.json({ success: true, message: "Leave updated successfully", leave });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating leave", error: error.message });
  }
};

// 🟢 Delete Leave Request (only if pending)
export const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave not found" });
    }

    if (leave.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this leave" });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({ success: false, message: "Cannot delete leave after approval/rejection" });
    }

    await leave.deleteOne();
    res.json({ success: true, message: "Leave deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting leave", error: error.message });
  }
};

// 🟢 Approve/Reject Leave (Admin)
export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    let leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    leave.status = status;
    await leave.save();

    // re-fetch with populated user so frontend always gets employeeId + name + email
    leave = await Leave.findById(id).populate("user", "employeeId name email");

    res.json({
      success: true,
      message: `Leave ${status} successfully`,
      leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating leave status",
      error: error.message,
    });
  }
};

