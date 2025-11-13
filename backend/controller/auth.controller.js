import User from "../model/user.model.js";
import Salary from "../model/salary.model.js";
import Profile from "../model/profile.model.js";
import bcrypt from "bcrypt";

// ====================== LOGIN ======================
export const login = async (req, res) => {
  try {
    const { email, password, employeeId } = req.body;

    if (!email && !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Email or EmployeeID required",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password required",
      });
    }

    const user = await User.findOne({
      $or: [{ email: email }, { employeeId: employeeId }],
    })
      .select("+password")
      .populate("department");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = user.generateAuthToken();

    // ✅ Proper cookie settings for cross-site (Render + Vercel)
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // Render uses HTTPS
      sameSite: "None", // Required for cross-site cookies
      path: "/", // Applies to entire domain
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isProfileComplete: user.isProfileComplete,
      },
    });
  } catch (error) {
    console.error("Error while login:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ====================== FETCH CURRENT USER ======================
export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const [salary, profile] = await Promise.all([
      Salary.findOne({ user: user._id }),
      Profile.findOne({ user: user._id }),
    ]);

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        salary: salary ? { basic: salary.basic } : null,
        profile: profile
          ? {
              gender: profile.gender || null,
              maritalStatus: profile.maritalStatus || null,
              dob: profile.dob || null,
              phone: profile.phone || null,
              joiningDate: profile.joiningDate || null,
              address: profile.address || null,
              profilePicture: profile.profilePicture || null,
              _id: profile._id,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ====================== LOGOUT ======================
export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
  });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

// ====================== CHANGE PASSWORD ======================
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "All fields (currentPassword, newPassword, confirmPassword) are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const strengthRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strengthRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must include upper, lower, number, and special character",
      });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    user.password = newPassword;
    await user.save();

    // ✅ Set cookie again safely
    const newToken = user.generateAuthToken();
    res.cookie("token", newToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};

// ====================== RESET PASSWORD ======================
export const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body || {};

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Both newPassword and confirmPassword are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const strengthRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strengthRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must include upper, lower, number, and special character",
      });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.passwordResetRequired) {
      return res.status(400).json({
        success: false,
        message: "Password reset is not required",
      });
    }

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from previous password",
      });
    }

    user.password = newPassword;
    user.passwordResetRequired = false;
    await user.save();

    // ✅ Set cookie safely again
    const token = user.generateAuthToken();
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Password reset successful. You may continue.",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};
