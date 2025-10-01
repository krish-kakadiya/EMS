import Profile from '../model/profile.model.js';
import User from '../model/user.model.js';

export const upsertMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gender, maritalStatus, dob, phone, joiningDate, address } = req.body;

    // Basic validation
    if (gender && !['male','female'].includes(gender)) {
      return res.status(400).json({ success:false, message:'Invalid gender'});
    }
    if (maritalStatus && !['single','married'].includes(maritalStatus)) {
      return res.status(400).json({ success:false, message:'Invalid marital status'});
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
  try {
    if (!req.file) {
      return res.status(400).json({ success:false, message:'No file uploaded' });
    }
    const userId = req.user.id;
    const relativePath = `/uploads/profile/${req.file.filename}`;
    let profile = await Profile.findOne({ user: userId });
    if (!profile) {
      profile = await Profile.create({ user: userId, profilePicture: relativePath });
      await User.findByIdAndUpdate(userId, { profile: profile._id });
    } else {
      profile.profilePicture = relativePath;
      await profile.save();
    }
  const base = `${req.protocol}://${req.get('host')}`;
  return res.json({ success:true, message:'Image uploaded', path: relativePath, url: base + relativePath });
  } catch (error) {
    console.error('Upload error', error);
    return res.status(500).json({ success:false, message:'Failed to upload image', error: error.message });
  }
};
