  import User from "../model/user.model.js";
  import Salary from "../model/salary.model.js";
  import Counter from "../model/counter.model.js";
  import Profile from "../model/profile.model.js";
import ExcelJS from "exceljs";


  const createEmployee = async (req, res) => {
    try {
      const { name, email, role, department, salary } = req.body;

      // 1. Validate required fields
      if (!name || !email || !role || !department || !salary) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if(!emailPattern.test(email))
      {
        return res.status(401).json({
          success:false,
          message: "Invalid Email"
        })
      }

      // 2. Check for existing user by email
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Employee already exists with this email",
        });
      }

      // 3. Auto-generate ID based on role
      const rolePrefix = role.slice(0, 3).toUpperCase(); // EMP, ADM, HR

      let counter = await Counter.findOne({ role });
      if (!counter) {
        counter = await Counter.create({ role, count: 1 });
      } else {
        counter.count += 1;
        await counter.save();
      }

      const formattedCount = String(counter.count).padStart(3, "0"); // 001, 002, etc.
      const employeeId = `${rolePrefix}${formattedCount}`; // e.g., EMP001


      
      const rawPassword = email.slice(0, 6);


      const password = rawPassword.toLowerCase();

      // 5. Create the user
      const newUser = await User.create({
        name,
        email,
        role,
        department, 
        password,
        employeeId, // add this in your schema
      });

      // 6. Create the salary record
      await Salary.create({
        user: newUser._id,
        basic: salary,
      });

      return res.status(201).json({
        success: true,
        message: "Employee created successfully",
        employeeId,
        rawPassword, // ⚠️ return only if needed; otherwise avoid for security
      });

    } catch (error) {
      console.error("Error creating employee", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error while creating employee",
      });
    }
  };

  const getAllEmployees = async (req, res) => {
  try {
    const employees = await User.aggregate([
      {
        $match: {
          role: { $nin: ["hr","pm"] }, // exclude hr and pm
        },
      },
      {
        $lookup: {
          from: "salaries", // collection name
          localField: "_id",
          foreignField: "user",
          as: "salary",
        },
      },
      {
        $unwind: {
          path: "$salary",
          preserveNullAndEmptyArrays: true, // keep employees even if no salary
        },
      },
      {
        $project: {
          _id: 1,
          employeeId: 1,
          name: 1,
          email: 1,
          role: 1,
          department: 1,
          "salary.basic": 1, // only return basic salary field
        },
      },
    ]);

    if (!employees || employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No employees found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employees fetched successfully",
      employees,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching employees",
    });
  }
};


  const deleteEmployee  = async (req,res) => {
    try {
      const { id } = req.params;
      if(!id)
      {
        return res.status(400).json({
          success: false,
          message: "Id is required"
        })
      }
      
      const employee = await User.findByIdAndDelete(id);

      if(!employee){
        return res.status(404).json({
          success: false,
          message: "Employee not found"
        })
      }
      
      const [deletedSalary, deletedProfile] = await Promise.all([
        Salary.findOneAndDelete({ user: id }),
        Profile.findOneAndDelete({ user: id })
      ]);

      if (!deletedSalary) console.warn(`No salary found for user ${id}`);
      if (!deletedProfile) console.warn(`No profile found for user ${id}`);

      return res.status(200).json({
        success: true,
        message: "Employee deleted successfully"
      });

    } catch (error) {
      console.error("Error deleting employee",error);
      return res.status(500).json({
        success: false,
        message: "Internal server error while deleting employee"
      })
    }
  }


  const monthlyPay = async (req, res) => {
  try {
    const result = await Salary.aggregate([
      {
        $lookup: {
          from: 'users', // join with User collection
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $match: {
          'user.role': { $ne: 'admin' }
        }
      },
      {
        $group: {
          _id: null,
          totalMonthlyPay: { $sum: '$basic' }
        }
      }
    ]);

    const totalMonthlyPay = result[0]?.totalMonthlyPay || 0;

    return res.status(200).json({
      success: true,
      message: "Total monthly salary calculated successfully",
      totalMonthlyPay
    });

  } catch (error) {
    console.error("Error calculating monthly pay", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while calculating monthly pay"
    });
  }
};

// controllers/employeeController.js

export const exportEmployees = async (req, res) => {
  try {
    const employees = await User.aggregate([
      { $match: { role: { $ne: "admin" } } },
      {
        $lookup: {
          from: "salaries",
          localField: "_id",
          foreignField: "user",
          as: "salary",
        },
      },
      {
        $unwind: { path: "$salary", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          employeeId: 1,
          name: 1,
          email: 1,
          role: 1,
          department: 1,
          "salary.basic": 1,
        },
      },
    ]);

    // Create workbook & worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Employees");

    // Add header row
    worksheet.columns = [
      { header: "Employee ID", key: "employeeId", width: 15 },
      { header: "Name", key: "name", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "Role", key: "role", width: 15 },
      { header: "Department", key: "department", width: 20 },
      { header: "Basic Salary", key: "salary", width: 15 },
    ];

    // Add employee rows
    employees.forEach((emp) => {
      worksheet.addRow({
        employeeId: emp.employeeId,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        department: emp.department,
        salary: emp.salary?.basic || "N/A",
      });
    });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=employees.xlsx");

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting employees:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while exporting employees",
    });
  }
};

// PUT /employees/:id/salary
export const updateEmployeeSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { basic } = req.body;

    if (!basic) {
      return res.status(400).json({ success: false, message: "Basic salary is required" });
    }

    const salary = await Salary.findOneAndUpdate(
      { user: id },
      { basic },
      { new: true, upsert: true }
    );

    const employee = await User.findById(id).lean();

    return res.status(200).json({
      success: true,
      message: "Salary updated successfully",
      employee: { ...employee, salary },
    });
  } catch (error) {
    console.error("Error updating salary:", error);
    res.status(500).json({ success: false, message: "Internal server error while updating salary" });
  }
};




  export { createEmployee, getAllEmployees, deleteEmployee, monthlyPay };
