// routes/chatRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Message } from '../server.js';

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|zip|rar|mp4|mov|avi/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed types: images, PDFs, documents, videos, archives'));
        }
    }
});

// Upload file endpoint
router.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                error: 'No file uploaded' 
            });
        }

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        
        res.json({
            success: true,
            file: {
                name: req.file.originalname,
                size: req.file.size,
                type: req.file.mimetype,
                url: fileUrl
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            success: false,
            error: 'File upload failed' 
        });
    }
});

// Get messages for a project
router.get('/messages/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { limit = 100, skip = 0 } = req.query;

        const messages = await Message.find({ projectId })
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .lean();

        const total = await Message.countDocuments({ projectId });

        res.json({
            success: true,
            messages: messages.reverse(),
            total
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

        // Delete associated file if exists
        if (message.attachment && message.attachment.url) {
            const filename = path.basename(message.attachment.url);
            const filepath = path.join(uploadsDir, filename);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
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

export default router;