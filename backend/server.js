import dotenv from 'dotenv';
dotenv.config();
import app from "./app.js";
import { Server as SocketIOServer } from 'socket.io';
import connectDB from './config/db.js';
import mongoose from 'mongoose';

const port = process.env.PORT || 3000; // Align with frontend axios baseURL

// Clear existing model if it exists (for hot reload)
if (mongoose.models.Message) {
    delete mongoose.models.Message;
}

// Message Schema for Chat
const messageSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  senderId: {
    type: String,
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderPhoto: {
    type: String
  },
  message: {
    type: String,
    default: ''
  },
  attachment: {
    name: { type: String, required: false },
    size: { type: Number, required: false },
    type: { type: String, required: false },
    url: { type: String, required: false },
    public_id: { type: String, required: false }, // Cloudinary public_id for deletion
    resource_type: { type: String, required: false } // Cloudinary resource type (image, video, raw)
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  strict: false // Allow additional fields if needed
});

const Message = mongoose.model('Message', messageSchema);

// Hidden Messages Schema - tracks which messages each user has hidden
const hiddenMessageSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  hiddenAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
hiddenMessageSchema.index({ userId: 1, projectId: 1 }, { unique: true });

const HiddenMessage = mongoose.model('HiddenMessage', hiddenMessageSchema);

// Store active users per project room
const activeUsers = new Map();

const startServer = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB');

        const server = app.listen(port, () => {
            console.log(`Server is running on: http://localhost:${port}`);
        });

        // Socket.IO setup
        const io = new SocketIOServer(server, {
            cors: {
                origin: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(o => o.trim()),
                credentials: true
            },
            pingTimeout: 120000, // 2 minutes
            pingInterval: 25000, // 25 seconds
            upgradeTimeout: 30000, // 30 seconds for upgrade
            allowUpgrades: true,
            transports: ['websocket', 'polling'],
            allowEIO3: true
        });
        app.set('io', io); // make io accessible in controllers via req.app.get('io')
        app.set('HiddenMessage', HiddenMessage); // make HiddenMessage model accessible in routes

        io.on('connection', (socket) => {
            console.log('New client connected:', socket.id);
            
            // Handle client errors
            socket.on('error', (error) => {
                console.error(`Socket error from ${socket.id}:`, error);
            });

            // Original: Optional join room by project or user for future usage
            socket.on('joinProject', (projectId) => {
                if (projectId) socket.join(`project:${projectId}`);
            });
            socket.on('joinUser', (userId) => {
                if (userId) socket.join(`user:${userId}`);
            });

            // ===== CHAT SYSTEM EVENTS =====

            // Join project chat room
            socket.on('join_project', async (data) => {
                const { projectId, userId, userName, userPhoto } = data;
                
                socket.join(projectId);
                
                // Store user info
                if (!activeUsers.has(projectId)) {
                    activeUsers.set(projectId, new Map());
                }
                activeUsers.get(projectId).set(socket.id, {
                    userId,
                    userName,
                    userPhoto,
                    socketId: socket.id
                });

                console.log(`User ${userName} joined project chat ${projectId}`);

                // Notify others in the room
                socket.to(projectId).emit('user_joined', {
                    userId,
                    userName,
                    userPhoto,
                    timestamp: new Date()
                });

                // Send active users list
                const projectUsers = Array.from(activeUsers.get(projectId).values());
                io.to(projectId).emit('active_users', projectUsers);

                // Load message history (exclude messages hidden by this user)
                try {
                    // Check if user has hidden messages for this project
                    const hiddenMessage = await HiddenMessage.findOne({ userId, projectId });
                    
                    let messages = [];
                    if (hiddenMessage) {
                        // Get messages created after the user cleared their history
                        messages = await Message.find({ 
                            projectId,
                            timestamp: { $gt: hiddenMessage.hiddenAt }
                        })
                        .sort({ timestamp: 1 })
                        .limit(100)
                        .lean();
                    } else {
                        // Get all messages if user hasn't cleared history
                        messages = await Message.find({ projectId })
                            .sort({ timestamp: 1 })
                            .limit(100)
                            .lean();
                    }
                    
                    socket.emit('message_history', messages);
                } catch (error) {
                    console.error('Error loading messages:', error);
                    socket.emit('error', { message: 'Failed to load message history' });
                }
            });

            // Handle sending messages
            socket.on('send_message', async (data) => {
                const { projectId, senderId, senderName, senderPhoto, message, attachment } = data;

                try {
                    // Parse attachment if it's a string (Socket.IO serialization issue)
                    let parsedAttachment = attachment;
                    if (attachment) {
                        if (typeof attachment === 'string' && attachment.startsWith('{')) {
                            try {
                                parsedAttachment = JSON.parse(attachment);
                            } catch (parseError) {
                                console.error('Error parsing attachment:', parseError);
                                parsedAttachment = null;
                            }
                        }
                    } else {
                        parsedAttachment = null;
                    }

                    // Validate required fields
                    if (!projectId || !senderId || !senderName) {
                        throw new Error('Missing required fields: projectId, senderId, or senderName');
                    }

                    // Validate projectId format
                    if (!mongoose.Types.ObjectId.isValid(projectId)) {
                        throw new Error('Invalid projectId format');
                    }

                    console.log('Creating message with data:', {
                        projectId,
                        senderId,
                        senderName,
                        senderPhoto,
                        message,
                        attachmentType: typeof parsedAttachment,
                        attachment: parsedAttachment
                    });

                    const newMessage = new Message({
                        projectId,
                        senderId,
                        senderName,
                        senderPhoto,
                        message: message || '',
                        attachment: parsedAttachment,
                        timestamp: new Date()
                    });

                    await newMessage.save();

                    // Broadcast to all users in the project room
                    io.to(projectId).emit('receive_message', {
                        id: newMessage._id,
                        projectId: newMessage.projectId,
                        senderId: newMessage.senderId,
                        senderName: newMessage.senderName,
                        senderPhoto: newMessage.senderPhoto,
                        message: newMessage.message,
                        attachment: newMessage.attachment,
                        timestamp: newMessage.timestamp
                    });

                    console.log(`Message sent in project ${projectId} by ${senderName}`);
                } catch (error) {
                    console.error('Error saving message:', error);
                    console.error('Error details:', {
                        name: error.name,
                        message: error.message,
                        stack: error.stack,
                        data: { projectId, senderId, senderName, message, attachment: attachment }
                    });
                    socket.emit('error', { 
                        message: 'Failed to send message',
                        details: error.message 
                    });
                }
            });

            // Handle typing indicator
            socket.on('typing', (data) => {
                const { projectId, userName } = data;
                socket.to(projectId).emit('user_typing', { userName });
            });

            socket.on('stop_typing', (data) => {
                const { projectId, userName } = data;
                socket.to(projectId).emit('user_stop_typing', { userName });
            });

            // Handle message read status
            socket.on('mark_read', async (data) => {
                const { messageId, projectId } = data;
                
                try {
                    await Message.findByIdAndUpdate(messageId, { isRead: true });
                    io.to(projectId).emit('message_read', { messageId });
                } catch (error) {
                    console.error('Error marking message as read:', error);
                }
            });

            // Handle bulk messages read status
            socket.on('messages_read', async (data) => {
                const { projectId, userId } = data;
                
                try {
                    // Mark all unread messages in this project for this user as read
                    // (messages that are not sent by this user)
                    await Message.updateMany(
                        { 
                            projectId,
                            senderId: { $ne: userId },
                            isRead: false 
                        },
                        { $set: { isRead: true } }
                    );

                    // Notify all users in the project room that messages have been read
                    io.to(projectId).emit('messages_marked_read', { 
                        projectId, 
                        readByUserId: userId 
                    });
                } catch (error) {
                    console.error('Error marking messages as read:', error);
                }
            });

            // Handle leaving a project room
            socket.on('leave_project', (data) => {
                const { projectId } = data;
                socket.leave(projectId);
                
                if (activeUsers.has(projectId)) {
                    const projectUsers = activeUsers.get(projectId);
                    if (projectUsers.has(socket.id)) {
                        const user = projectUsers.get(socket.id);
                        projectUsers.delete(socket.id);
                        
                        socket.to(projectId).emit('user_left', {
                            userId: user.userId,
                            userName: user.userName,
                            timestamp: new Date()
                        });

                        // Update active users list
                        const remainingUsers = Array.from(projectUsers.values());
                        io.to(projectId).emit('active_users', remainingUsers);
                    }
                }
            });

            // Handle disconnect
            socket.on('disconnect', (reason) => {
                console.log('Client disconnected:', socket.id, 'Reason:', reason);

                // Remove user from active users
                activeUsers.forEach((projectUsers, projectId) => {
                    if (projectUsers.has(socket.id)) {
                        const user = projectUsers.get(socket.id);
                        projectUsers.delete(socket.id);
                        
                        // Notify others
                        socket.to(projectId).emit('user_left', {
                            userId: user.userId,
                            userName: user.userName,
                            timestamp: new Date()
                        });

                        // Update active users list
                        const remainingUsers = Array.from(projectUsers.values());
                        io.to(projectId).emit('active_users', remainingUsers);
                    }
                });
            });
        });

        const shutdown = (signal) => {
            console.log(`\n${signal} received. Closing server...`);
            server.close(() => {
                console.log('HTTP server closed.');
                process.exit(0);
            });
            // Force exit if not closed in 10s
            setTimeout(() => process.exit(1), 10000).unref();
        };
        ['SIGINT', 'SIGTERM'].forEach(sig => process.on(sig, () => shutdown(sig)));

    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

startServer();

// Export models for use in routes if needed
export { Message, HiddenMessage };