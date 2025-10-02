// controller/profile.controller.js
import path from 'path';
import fs from 'fs';
import cloudinary from '../config/cloudinary.config.js';
import Profile from '../model/profile.model.js';
import User from '../model/user.model.js';

export const upsertMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gender, maritalStatus, dob, phone, joiningDate, address } = req.body;

    // Basic validation
    if (gender && !['male','female'].includes(gender)) {
      return res.status(400).json({ success:false, message:'Invalid gender' });
    }
    if (maritalStatus && !['single','married'].includes(maritalStatus)) {
      return res.status(400).json({ success:false, message:'Invalid marital status' });
    }

    let profile = await Profile.findOne({ user: userId });
    if (!profile) {
      profile = await Profile.create({
        user: userId,
        gender: gender || undefined,
        maritalStatus: maritalStatus || undefined,
        dob: dob ? new Date(dob) : undefined,
        phone: phone || undefined,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
        address: address || undefined,
      });
      await User.findByIdAndUpdate(userId, { profile: profile._id, isProfileComplete: true });
    } else {
      if (gender !== undefined) profile.gender = gender;
      if (maritalStatus !== undefined) profile.maritalStatus = maritalStatus;
      if (dob !== undefined) profile.dob = dob ? new Date(dob) : null;
      if (phone !== undefined) profile.phone = phone;
      if (joiningDate !== undefined) profile.joiningDate = joiningDate ? new Date(joiningDate) : null;
      if (address !== undefined) profile.address = address;
      await profile.save();
    }

    const populated = await Profile.findById(profile._id);
    return res.json({ success:true, profile: populated, message:'Profile updated' });
  } catch (error) {
    console.error('Profile update error', error);
    return res.status(500).json({ success:false, message:'Failed to update profile', error: error.message });
  }
};


export const uploadProfileImage = async (req, res) => {
  let uploadResult = null;
  const uploadDir = path.join(process.cwd(), 'uploads', 'profile');

  try {
    if (!req.file) {
      return res.status(400).json({ success:false, message:'No file uploaded' });
    }

    const userId = req.user.id;
    // prefer req.file.path (multer diskStorage sets this), fallback to manual path
    const filePath = req.file.path || path.join(uploadDir, req.file.filename);

    // Upload to Cloudinary from local file
    uploadResult = await cloudinary.uploader.upload(filePath, {
      folder: 'profile_photos',
      public_id: `user_${userId}_${Date.now()}`,
      resource_type: 'image',
      overwrite: true,
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { fetch_format: 'auto', quality: 'auto' }
      ]
    });

    // DB update
    let profile = await Profile.findOne({ user: userId });
    const oldPublicId = profile?.profilePicturePublicId;

    if (!profile) {
      profile = await Profile.create({
        user: userId,
        profilePicture: uploadResult.secure_url,
        profilePicturePublicId: uploadResult.public_id
      });
      await User.findByIdAndUpdate(userId, { profile: profile._id, isProfileComplete: true });
    } else {
      profile.profilePicture = uploadResult.secure_url;
      profile.profilePicturePublicId = uploadResult.public_id;
      await profile.save();

      // Delete old image from Cloudinary (best effort)
      if (oldPublicId && oldPublicId !== uploadResult.public_id) {
        try {
          await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'image' });
        } catch (err) {
          console.warn('Failed to delete old Cloudinary image:', err.message || err);
        }
      }
    }

    // Remove local file (best effort)
    try {
      await fs.promises.unlink(filePath);
    } catch (err) {
      console.warn('Failed to delete local file after upload:', filePath, err.message || err);
    }

    return res.json({
      success: true,
      message: 'Image uploaded',
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id
    });

  } catch (error) {
    console.error('Upload error', error);

    // If upload to Cloudinary succeeded but DB or later step failed, try to clean uploaded Cloudinary image
    if (uploadResult && uploadResult.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadResult.public_id, { resource_type: 'image' });
        console.warn('Rolled back uploaded Cloudinary image due to error.');
      } catch (err) {
        console.warn('Failed to rollback Cloudinary upload:', err.message || err);
      }
    }

    return res.status(500).json({ success:false, message:'Failed to upload image', error: error.message });
  }
};
