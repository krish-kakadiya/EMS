import User from "../model/user.model.js";
import Department from "../model/department.model.js";
import Counter from "../model/counter.model.js";

const createAdmin = async (req, res) => {
  try {
    // Step 1: Check or create "Administration" department
    let adminDept = await Department.findOne({ name: "Administration" });

    if (!adminDept) {
      adminDept = await Department.create({
        name: "Administration",
        description: "System-level administrators and superusers",
      });
      console.log("✅ 'Administration' department created.");
    }

    // Step 2: Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Step 3: Generate employee ID from counter
    const counter = await Counter.findOneAndUpdate(
      { role: "admin" },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    const employeeId = `ADM${String(counter.count).padStart(3, "0")}`;

    // Step 4: Create the admin user
    const admin = await User.create({
      employeeId,
      name: "Super Admin",
      email: "krishkakadiya000007@gmail.com",
      password: "123456", // Will be hashed by pre-save hook
      role: "admin",
      department: adminDept._id,
      isProfileComplete: false,
    });

    console.log("✅ Admin user created.");

    res.status(201).json({
      message: "Admin user created successfully",
      admin: {
        id: admin._id,
        employeeId: admin.employeeId,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default createAdmin;
