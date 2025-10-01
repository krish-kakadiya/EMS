import express from "express";
import User from "../model/user.model.js"; // make sure path is correct
import Project from "../model/project.model.js";
import { generateSequentialCode } from "../utils/generateCode.js";

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

    // Ensure at least one project exists
    let project = await Project.findOne();
    if (!project) {
      // Pick PM user
      const pmUser = await User.findOne({ role: 'pm' });
      if (pmUser) {
        const code = await generateSequentialCode('project','PRJ');
        project = await Project.create({
          code,
          name: 'Sample Project',
          client: 'Internal',
          description: 'Auto generated sample project',
          manager: pmUser._id,
          teamMembers: [],
          status: 'in-progress'
        });
      }
    }

    if (createdUsers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Seed users already exist",
        project
      });
    }

    res.status(201).json({
      success: true,
      message: "Seed users created successfully",
      users: createdUsers,
      project
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
