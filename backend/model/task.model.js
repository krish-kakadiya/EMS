import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // TSK001
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  description: { type: String },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  priority: { type: String, enum: ['low','medium','high'], default: 'medium' },
  status: { type: String, enum: ['not-started','in-progress','completed','on-hold'], default: 'not-started' },
  startDate: { type: Date },
  dueDate: { type: Date },
  lastEmployeeMessage: { type: String, default: '' },
  statusUpdates: [{
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['not-started','in-progress','completed','on-hold'] },
    message: { type: String },
    at: { type: Date, default: Date.now }
  }]
},{ timestamps: true });

const Task = mongoose.model('Task', taskSchema);
export default Task;
