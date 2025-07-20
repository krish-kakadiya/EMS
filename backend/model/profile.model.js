import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  gender: { type: String, enum: ["male", "female", "other"] },
  dob: { type: Date },
  phone: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
  },
  joiningDate: { type: Date },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String,
  },
  maritalStatus: { type: String, enum: ["single", "married", "other"] },
  profilePicture: {
    type: String,
    default: "https://avatar.iran.liara.run/public/46",
  },
}, { timestamps: true });

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;