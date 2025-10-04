import User from "../model/user.model.js";
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Generate and send OTP
export const sendResetCode = async (req, res) => {
  try {
    const { email } = req.body;

    console.log("📧 OTP request for:", email);

    // Check environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error("❌ EMAIL_USER or EMAIL_PASSWORD not set in .env");
      return res.status(500).json({
        success: false,
        message: "Email service not configured. Contact administrator.",
      });
    }

    console.log("📧 Using email:", process.env.EMAIL_USER);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    // Generate 6-digit OTP
    const resetCode = crypto.randomInt(100000, 999999).toString();
    console.log("🔐 Generated OTP:", resetCode);
    
    // Save OTP to database
    user.resetCode = resetCode;
    user.resetCodeExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();
    console.log("✅ OTP saved to database");

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify transporter
    try {
      await transporter.verify();
      console.log("✅ Email transporter verified");
    } catch (verifyError) {
      console.error("❌ Transporter verification failed:", verifyError.message);
      return res.status(500).json({
        success: false,
        message: "Email configuration error. Check credentials.",
      });
    }

    // Email content
    const mailOptions = {
      from: `"Employee System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Login OTP Code',
      html: `
        <div style="font-family: Arial; padding: 20px; max-width: 600px;">
          <h2>🔐 Login OTP</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Your OTP code is:</p>
          <h1 style="color: #667eea; letter-spacing: 8px; text-align: center;">${resetCode}</h1>
          <p style="color: #666;">Valid for 10 minutes</p>
          <hr>
          <p style="font-size: 12px; color: #999;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    };

    // Send email
    console.log("📤 Sending email...");
    await transporter.sendMail(mailOptions);
    console.log("✅ OTP email sent successfully");

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.error("❌ Error in sendResetCode:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP: " + error.message,
    });
  }
};

// Verify OTP
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    console.log("🔍 Verifying OTP for:", email);

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.resetCode) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Request a new one.",
      });
    }

    if (user.resetCode !== code) {
      console.log("❌ Invalid OTP");
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (Date.now() > user.resetCodeExpiry) {
      console.log("❌ OTP expired");
      return res.status(400).json({
        success: false,
        message: "OTP expired. Request a new one.",
      });
    }

    // Clear OTP but mark that password must be reset before full access
    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;
    user.passwordResetRequired = true;
    await user.save();

    console.log("✅ OTP verified successfully; password reset required before normal access");

    // Issue auth token so user can call reset-password endpoint only; frontend will redirect away from protected pages until reset
    const token = user.generateAuthToken();
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "OTP verified. Please set a new password to continue.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
        passwordResetRequired: true,
      },
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};