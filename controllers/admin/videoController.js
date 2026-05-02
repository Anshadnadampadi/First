import Settings from '../../models/admin/Settings.js';
import cloudinary from '../../config/cloudinary.js';

export const getVideoManagement = async (req, res) => {
    try {
        const settings = await Settings.find({ key: { $regex: /^hero_video_/ } });
        const videoMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        res.render('admin/marketing/videoManagement', {
            title: 'Video Management',
            videoMap,
            breadcrumbs: [
                { label: 'Admin', url: '/admin/dashboard' },
                { label: 'Marketing', url: '/admin/marketing/offers' },
                { label: 'Video Management', url: '/admin/marketing/videos' }
            ],
            msg: req.query.msg || null,
            icon: req.query.icon || null
        });
    } catch (error) {
        console.error('Error loading video management:', error);
        res.redirect('/admin/dashboard?msg=Failed to load video management&icon=error');
    }
};

export const uploadHeroVideo = async (req, res) => {
    try {
        const { slot } = req.body; // e.g., 'iphone_hero'
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No video file uploaded' });
        }

        const videoUrl = req.file.path; // Cloudinary URL
        const key = `hero_video_${slot}`;

        await Settings.findOneAndUpdate(
            { key },
            { value: videoUrl, description: `Hero video for ${slot} slot` },
            { upsert: true, new: true }
        );

        res.json({ 
            success: true, 
            message: 'Video uploaded and updated successfully!',
            url: videoUrl 
        });
    } catch (error) {
        console.error('Error uploading hero video:', error);
        res.status(500).json({ success: false, message: 'Failed to upload video' });
    }
};

export const deleteHeroVideo = async (req, res) => {
    try {
        const { slot } = req.params;
        const key = `hero_video_${slot}`;
        
        const setting = await Settings.findOne({ key });
        if (setting) {
            // Optional: Delete from Cloudinary as well
            // We'd need to extract the public_id from the URL
            await Settings.deleteOne({ key });
        }

        res.json({ success: true, message: 'Video mapping removed successfully' });
    } catch (error) {
        console.error('Error deleting hero video:', error);
        res.status(500).json({ success: false, message: 'Failed to remove video' });
    }
};
