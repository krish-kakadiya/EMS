// routes/chatRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Message } from '../server.js';
import cloudinary from '../config/cloudinary.config.js';

const router = express.Router();

// Create temporary uploads directory if it doesn't exist
const tempUploadsDir = 'uploads/temp';
if (!fs.existsSync(tempUploadsDir)) {
    fs.mkdirSync(tempUploadsDir, { recursive: true });
}

// Configure multer for temporary file uploads before Cloudinary
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempUploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit (Cloudinary supports larger files)
    fileFilter: (req, file, cb) => {
        // More comprehensive file type support for Cloudinary
        const allowedTypes = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|7z|mp4|mov|avi|mkv|webm|mp3|wav|ogg/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = file.mimetype && (
            file.mimetype.startsWith('image/') ||
            file.mimetype.startsWith('video/') ||
            file.mimetype.startsWith('audio/') ||
            file.mimetype.includes('pdf') ||
            file.mimetype.includes('document') ||
            file.mimetype.includes('spreadsheet') ||
            file.mimetype.includes('presentation') ||
            file.mimetype.includes('text') ||
            file.mimetype.includes('zip') ||
            file.mimetype.includes('rar') ||
            file.mimetype.includes('7z')
        );
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed types: images, videos, audio, documents, archives'));
        }
    }
});

// Upload file endpoint with Cloudinary
router.post('/upload', upload.single('file'), async (req, res) => {
    let uploadResult = null;
    
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                error: 'No file uploaded' 
            });
        }

        const filePath = req.file.path;
        const fileName = req.file.originalname;
        const fileSize = req.file.size;
        const mimeType = req.file.mimetype;

        // Determine Cloudinary resource type
        let resourceType = 'auto';
        if (mimeType.startsWith('image/')) {
            resourceType = 'image';
        } else if (mimeType.startsWith('video/')) {
            resourceType = 'video';
        } else if (mimeType.startsWith('audio/')) {
            resourceType = 'video'; // Cloudinary uses 'video' for audio files
        } else {
            resourceType = 'raw'; // For documents, archives, etc.
        }

        // Upload to Cloudinary
        uploadResult = await cloudinary.uploader.upload(filePath, {
            folder: 'chat_attachments',
            public_id: `chat_${Date.now()}_${Math.round(Math.random() * 1E9)}`,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true,
            // Optimization for images
            ...(resourceType === 'image' && {
                transformation: [
                    { width: 2000, height: 2000, crop: 'limit' },
                    { fetch_format: 'auto', quality: 'auto' }
                ]
            })
        });

        // Clean up temporary file
        try {
            await fs.promises.unlink(filePath);
        } catch (unlinkError) {
            console.warn('Failed to delete temporary file:', unlinkError.message);
        }

        res.json({
            success: true,
            file: {
                name: fileName,
                size: fileSize,
                type: mimeType,
                url: uploadResult.secure_url,
                public_id: uploadResult.public_id,
                resource_type: uploadResult.resource_type
            }
        });

    } catch (error) {
        console.error('Cloudinary upload error:', error);

        // Clean up temporary file on error
        if (req.file && req.file.path) {
            try {
                await fs.promises.unlink(req.file.path);
            } catch (unlinkError) {
                console.warn('Failed to delete temporary file after error:', unlinkError.message);
            }
        }

        res.status(500).json({ 
            success: false,
            error: 'File upload failed: ' + (error.message || 'Unknown error')
        });
    }
});

// Get messages for a project (respecting user's hidden messages)
router.get('/messages/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { limit = 100, skip = 0, userId } = req.query;

        let query = { projectId };
        let total = await Message.countDocuments({ projectId });

        // If userId is provided, check for hidden messages
        if (userId) {
            const HiddenMessage = req.app.get('HiddenMessage');
            const hiddenMessage = await HiddenMessage.findOne({ userId, projectId });
            
            if (hiddenMessage) {
                // Only get messages created after the user cleared their history
                query.timestamp = { $gt: hiddenMessage.hiddenAt };
                total = await Message.countDocuments(query);
            }
        }

        const messages = await Message.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .lean();

        res.json({
            success: true,
            messages: messages.reverse(),
            total,
            hiddenAt: userId ? (await req.app.get('HiddenMessage').findOne({ userId, projectId }))?.hiddenAt : null
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch messages' 
        });
    }
});

// Delete a message
router.delete('/messages/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ 
                success: false,
                error: 'Message not found' 
            });
        }

        // Delete associated file from Cloudinary if exists
        if (message.attachment && message.attachment.public_id) {
            try {
                await cloudinary.uploader.destroy(message.attachment.public_id, {
                    resource_type: message.attachment.resource_type || 'auto'
                });
                console.log('Deleted file from Cloudinary:', message.attachment.public_id);
            } catch (cloudinaryError) {
                console.warn('Failed to delete file from Cloudinary:', cloudinaryError.message);
                // Continue with message deletion even if Cloudinary cleanup fails
            }
        }

        await Message.findByIdAndDelete(messageId);

        res.json({ 
            success: true, 
            message: 'Message deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to delete message' 
        });
    }
});

// Get unread message count for a user in a project
router.get('/unread/:projectId/:userId', async (req, res) => {
    try {
        const { projectId, userId } = req.params;
        
        const count = await Message.countDocuments({
            projectId,
            senderId: { $ne: userId },
            isRead: false
        });

        res.json({ 
            success: true, 
            count 
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to get unread count' 
        });
    }
});

// Mark messages as read
router.post('/mark-read', async (req, res) => {
    try {
        const { messageIds, projectId, userId } = req.body;

        if (messageIds && messageIds.length > 0) {
            // Mark specific messages as read
            await Message.updateMany(
                { _id: { $in: messageIds } },
                { $set: { isRead: true } }
            );
        } else if (projectId && userId) {
            // Mark all messages in project for this user as read
            await Message.updateMany(
                { 
                    projectId,
                    senderId: { $ne: userId },
                    isRead: false 
                },
                { $set: { isRead: true } }
            );
        } else {
            return res.status(400).json({
                success: false,
                error: 'Either messageIds or (projectId and userId) required'
            });
        }

        res.json({ 
            success: true, 
            message: 'Messages marked as read' 
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to mark messages as read' 
        });
    }
});

// Get chat statistics for a project
router.get('/stats/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;

        const totalMessages = await Message.countDocuments({ projectId });
        const messagesWithAttachments = await Message.countDocuments({ 
            projectId,
            'attachment.url': { $exists: true, $ne: null }
        });

        // Get unique senders
        const uniqueSenders = await Message.distinct('senderId', { projectId });

        // Get messages from last 24 hours
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentMessages = await Message.countDocuments({
            projectId,
            timestamp: { $gte: yesterday }
        });

        res.json({
            success: true,
            stats: {
                totalMessages,
                messagesWithAttachments,
                uniqueSenders: uniqueSenders.length,
                recentMessages
            }
        });
    } catch (error) {
        console.error('Error fetching chat stats:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch chat statistics' 
        });
    }
});

// Search messages in a project
router.get('/search/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { query, limit = 50 } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }

        const messages = await Message.find({
            projectId,
            message: { $regex: query, $options: 'i' }
        })
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .lean();

        res.json({
            success: true,
            messages,
            total: messages.length
        });
    } catch (error) {
        console.error('Error searching messages:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to search messages' 
        });
    }
});

// Clear chat history for a user (user-specific hiding)
router.delete('/clear-history/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { userId, userRole } = req.body;

        // Validate required fields
        if (!projectId || !userId || !userRole) {
            return res.status(400).json({
                success: false,
                error: 'Project ID, user ID, and user role are required'
            });
        }

        // Validate user role (only project managers and employees can clear history)
        if (!['pm', 'employee', 'admin', 'hr'].includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized: Only project managers and employees can clear chat history'
            });
        }

        // Import HiddenMessage model
        const HiddenMessage = req.app.get('HiddenMessage');

        // Check if user already has hidden messages for this project
        const existingHidden = await HiddenMessage.findOne({ userId, projectId });

        if (existingHidden) {
            // Update the hidden timestamp
            existingHidden.hiddenAt = new Date();
            await existingHidden.save();
        } else {
            // Create new hidden message record
            await HiddenMessage.create({
                userId,
                projectId,
                hiddenAt: new Date()
            });
        }

        console.log(`Chat history cleared for user ${userId} in project ${projectId}`);

        res.json({
            success: true,
            message: 'Chat history cleared for user',
            userId: userId,
            projectId: projectId
        });

        // DO NOT emit socket event to all users - this is user-specific clearing
        // Each user will handle their own message clearing locally

    } catch (error) {
        console.error('Error clearing chat history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear chat history'
        });
    }
});

export default router;