import express from "express";
import User from "../model/user.model.js"; // make sure path is correct

const seedRouter = express.Router();

seedRouter.post("/", async (req, res) => {
  try {
    // Seed data
    const seedUsers = [
      {
        employeeId: "HR001",
        name: "HR Admin",
        email: "hr@gmail.com",
        password: "123456",
        role: "hr",
        department: "Human Resources",
      },
      {
        employeeId: "PM001",
        name: "Project Manager",
        email: "pm@gmail.com",
        password: "123456",
        role: "pm",
        department: "Project Management",
      },
    ];

    const createdUsers = [];

    for (const userData of seedUsers) {
      // Check if already exists
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        const newUser = new User(userData);
        await newUser.save();
        createdUsers.push(newUser);
      }
    }

    if (createdUsers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Seed users already exist",
      });
    }
    console.log("Seed users created:", createdUsers);
    res.status(201).json({
      success: true,
      message: "Seed users created successfully",
      users: createdUsers,
    });
  } catch (error) {
    console.error("Seeding error:", error);
    res.status(500).json({
      success: false,
      message: "Seeding failed",
      error: error.message,
    });
  }
});

export default seedRouter;
