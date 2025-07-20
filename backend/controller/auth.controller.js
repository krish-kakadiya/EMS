import User from "../model/user.model.js";

const login  = async (req , res)=>{
    try {
        const { email, password, employeeId } =  req.body;
        if(!email && !employeeId){
            return res.status(400).json({message: "Email or Employee ID is required"});
        }
        if(!password){
            return res.status(400).json({message: "Password is required"});
        }
        const user = await User.findOne({
            $or: [
                {email: email},
                {employeeId: employeeId}
            ]
        }).select("+password");

        if(!user){
            return res.status(400).json({message: "User not found!"});
        }

        const isMatch = await user.matchPassword(password);
        if(!isMatch){
            return res.status(400).json({message: "Invalid credentials"});
        }
        const token = user.generateAuthToken(); 
        res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });

    } catch (error) {
        console.error("Login error:",error);
        return res.status(500).json({ message:"Internal server error"});
    }
}

export {login};