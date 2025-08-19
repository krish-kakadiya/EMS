import User from "../model/user.model.js";
import Counter from "../model/counter.model.js";

const createSuperAdmin = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password || !department) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and department are required",
      });
    }

    // 2. Check if a super admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Super Admin already exists",
      });
    }

    // 3. Generate admin employeeId
    let counter = await Counter.findOne({ role: "admin" });
    if (!counter) {
      counter = await Counter.create({ role: "admin", count: 1 });
    } else {
      counter.count += 1;
      await counter.save();
    }

    const formattedCount = String(counter.count).padStart(3, "0");
    const employeeId = `ADM${formattedCount}`;

    // 4. Create the super admin
    const superAdmin = await User.create({
      name,
      email,
      password, // will be hashed by userSchema.pre("save")
      department,
      role: "admin",
      employeeId,
    });

    return res.status(201).json({
      success: true,
      message: "Super Admin created successfully",
      employeeId: superAdmin.employeeId,
    });

  } catch (error) {
    console.error("Error creating super admin:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating super admin",
    });
  }
};

export { createSuperAdmin };
