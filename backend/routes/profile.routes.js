// routes/profile.routes.js
import express from 'express';
import { protectedRoutes } from '../middleware/auth.middleware.js';
import { upsertMyProfile, uploadProfileImage } from '../controller/profile.controller.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'profile');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// diskStorage: store locally first
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    const uid = (req.user && req.user.id) ? req.user.id : 'unknown';
    cb(null, `${uid}-${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (/^image\//.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// routes
router.put('/me', protectedRoutes, upsertMyProfile);
router.post('/me/photo', protectedRoutes, upload.single('photo'), uploadProfileImage);

export default router;
