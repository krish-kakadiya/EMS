import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // e.g. PRJ001
  name: { type: String, required: true },
  client: { type: String },
  description: { type: String },
  status: { type: String, enum: ['pending','in-progress','completed','on-hold'], default: 'pending' },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // role pm
  teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startDate: { type: Date },
  endDate: { type: Date }
},{ timestamps: true });

const Project = mongoose.model('Project', projectSchema);
export default Project;
