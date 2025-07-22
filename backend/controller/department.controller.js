import Department from "../model/department.model.js";

const getAllDepartments = async (req, res) => {
    try {
        const departments = await Department.find();

        res.status(200).json({
            success: true,
            message: "Departments retrieved successfully.",
            data: departments,
        });
    } catch (error) {
        console.error("Error fetching departments:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error while fetching departments.",
        });
    }
};


export { getAllDepartments };