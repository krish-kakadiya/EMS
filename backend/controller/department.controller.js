import Department from "../model/department.model.js";

const getAllDepartments = async (req, res) => {
    try {
        const departments = await Department.find();

        res.status(200).json({
            success: true,
            message: "Departments retrieved successfully.",
            departments
        });
    } catch (error) {
        console.error("Error fetching departments:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error while fetching departments.",
        });
    }
};

const createDepartment = async (req,res)=>{
    try {
        const { name } = req.body;
        if(!name)
        {
            return res.status(400).json({
                success: false,
                message: "Department name is required"
            });
        }

        const isDepartmentExists = await Department.findOne({ name });

        if(isDepartmentExists)
        {
            return res.status(400).json({
                success: false,
                message: "Deparment already exists"
            })
        }

        const department = await Department.create({name});
        if(!department)
        {
            return res.status(400).json({
                success: false,
                message: "Failed to create department"
            });
        }
    
        res.status(201).json({
            success: true,
            message: "department created successfully",
            department
        })

    } catch (error) {
        console.error("Error creating department",error);
        return res.status(500).json({
            success:false,
            message:"Internal server error while creating department"
        })
    }
}

const deleteDepartment = async (req,res)=>{
    try {
        const { name } = req.body;
        if(!name)
        {
            return res.status(400).json({
                success: false,
                message: "Department name is required"
            })
        }
        const department  = await Department.findOneAndDelete({ name });
        if(!department)
        {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Department deleted successfully",
            department
        });

    } catch (error) {
        console.error("Error deleting department",error);
        return res.status(500).json({
            success:false,
            message:"Internal server error while deleting department"
        })
    }
}


export { getAllDepartments, createDepartment, deleteDepartment };