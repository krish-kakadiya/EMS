import User from "../model/user.model.js";
import Counter from "../model/counter.model.js";
import Salary from "../model/salary.model.js";
import Profile from "../model/profile.model.js";

// const createAdmin = async (req, res) => {
//   try {
//     // Step 1: Check or create "Administration" department
//     let adminDept = await Department.findOne({ name: "Administration" });

//     if (!adminDept) {
//       adminDept = await Department.create({
//         name: "Administration",
//         description: "System-level administrators and superusers",
//       });
//       console.log("✅ 'Administration' department created.");
//     }

//     // Step 2: Check if admin already exists
//     const existingAdmin = await User.findOne({ role: "admin" });
//     if (existingAdmin) {
//       return res.status(400).json({ message: "Admin already exists" });
//     }

//     // Step 3: Generate employee ID from counter
//     const counter = await Counter.findOneAndUpdate(
//       { role: "admin" },
//       { $inc: { count: 1 } },
//       { new: true, upsert: true }
//     );
//     const employeeId = `ADM${String(counter.count).padStart(3, "0")}`;

//     // Step 4: Create the admin user
//     const admin = await User.create({
//       employeeId,
//       name: "Super Admin",
//       email: "krishkakadiya000007@gmail.com",
//       password: "123456", // Will be hashed by pre-save hook
//       role: "admin",
//       department: adminDept._id,
//       isProfileComplete: false,
//     });

//     console.log("✅ Admin user created.");

//     res.status(201).json({
//       message: "Admin user created successfully",
//       admin: {
//         id: admin._id,
//         employeeId: admin.employeeId,
//         name: admin.name,
//         email: admin.email,
//         role: admin.role,
//       },
//     });
//   } catch (error) {
//     console.error("Error creating admin user:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

export const login = async (req,res)=>{
  try {

    const { email, password, employeeId } = req.body;

    if(!email && !employeeId)
    {
      return res.status(400).json({
        success: false,
        message: "Email or EmployeeID required"
      })
    }

    if(!password)
    {
      return res.status(400).json({
        success: false,
        message:"Password require"
      })
    }

    const user = await User.findOne({
      $or: [
        {email: email},
        {employeeId: employeeId}
      ]
    }).select("+password").populate("department");

    if(!user)
    {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    if(!(await user.matchPassword(password)))
    {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    const token = user.generateAuthToken();
    
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
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
    })
    
  } catch (error) {
    console.error("Error while login:",error);
    return res.status(500).json({ message: "Internal server error" });
  }
}


export const me = async (req, res) => {
  try {
    // Fetch user (excluding password)
  const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Fetch salary and profile
    const [salary, profile] = await Promise.all([
      Salary.findOne({ user: user._id }),
      Profile.findOne({ user: user._id })
    ]);

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        salary: salary ? { basic: salary.basic } : null,
        profile: profile ? {
          gender: profile.gender || null,
          maritalStatus: profile.maritalStatus || null,
          dob: profile.dob || null,
          phone: profile.phone || null,
          joiningDate: profile.joiningDate || null,
          address: profile.address || null,
          profilePicture: profile.profilePicture || null,
          _id: profile._id
        } : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const logout =  (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}