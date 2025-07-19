import mongoose, { mongo } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    name:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
        match : /.+\@.+\..+/,
        lowercase: true,
        trim: true,
    },
    password:{
        type: String,
        required : true,
        minlength: 6,
        select: false, 
    },
    role:{
        type: String,
        enum: ['admin', 'hr', 'employee'],
        default: 'employee',
    },
    isProfileComplete: {
    type: Boolean,
    default: false,
    },
    profile:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
        default: null,
    }

},{
    timestamps: true,
    versionKey: false
});

userSchema.pre("save", async function(next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password,10);
    }
    next();
});

userSchema.methods.matchPassword = async function(password){
    return await bcrypt.compare(password, this.password);
}
















const User = mongoose.model("User",userSchema);
export default User;