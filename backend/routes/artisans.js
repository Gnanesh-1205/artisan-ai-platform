const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Artisan = require('../models/Artisan');
const Product = require('../models/Product');
const { authenticate, requireArtisan, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for artisan profile images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/artisans');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get all artisans (public)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      specialization,
      city,
      state,
      verified,
      sort = 'stats.rating',
      order = 'desc'
    } = req.query;

    const filter = { isActive: true };

    if (specialization) {
      filter.specialization = { $in: [specialization] };
    }

    if (city) {
      filter['location.city'] = new RegExp(city, 'i');
    }

    if (state) {
      filter['location.state'] = new RegExp(state, 'i');
    }

    if (verified === 'true') {
      filter['verification.isVerified'] = true;
    }

    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const artisans = await Artisan.find(filter)
      .populate('user', 'firstName lastName avatar')
      .populate('products', 'title images pricing stats')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Artisan.countDocuments(filter);

    res.json({
      artisans,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    });

  } catch (error) {
    console.error('Artisans fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch artisans', 
      error: error.message 
    });
  }
});

// Get single artisan profile
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const artisan = await Artisan.findById(req.params.id)
      .populate('user', 'firstName lastName avatar')
      .populate({
        path: 'products',
        match: { status: 'active' },
        options: { sort: { createdAt: -1 } }
      });

    if (!artisan) {
      return res.status(404).json({ message: 'Artisan not found' });
    }

    // Increment profile views
    artisan.stats.profileViews += 1;
    await artisan.save();

    res.json(artisan);
  } catch (error) {
    console.error('Artisan fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch artisan', 
      error: error.message 
    });
  }
});

// Update artisan profile
router.put('/profile', authenticate, requireArtisan, upload.fields([
  { name: 'workshopImages', maxCount: 5 },
  { name: 'certificateImages', maxCount: 3 },
  { name: 'awardImages', maxCount: 3 }
]), async (req, res) => {
  try {
    const artisan = await Artisan.findOne({ user: req.user._id });
    
    if (!artisan) {
      return res.status(404).json({ message: 'Artisan profile not found' });
    }

    const updateData = { ...req.body };

    // Handle file uploads
    if (req.files) {
      if (req.files.workshopImages) {
        updateData['workshop.images'] = req.files.workshopImages.map(file => 
          `/uploads/artisans/${file.filename}`
        );
      }

      if (req.files.certificateImages) {
        const certificates = req.files.certificateImages.map((file, index) => ({
          name: req.body[`certificateName${index}`] || `Certificate ${index + 1}`,
          issuedBy: req.body[`certificateIssuer${index}`] || '',
          certificateUrl: `/uploads/artisans/${file.filename}`
        }));
        updateData.certifications = [...(artisan.certifications || []), ...certificates];
      }

      if (req.files.awardImages) {
        const awards = req.files.awardImages.map((file, index) => ({
          title: req.body[`awardTitle${index}`] || `Award ${index + 1}`,
          year: req.body[`awardYear${index}`] || new Date().getFullYear(),
          description: req.body[`awardDescription${index}`] || '',
          imageUrl: `/uploads/artisans/${file.filename}`
        }));
        updateData.awards = [...(artisan.awards || []), ...awards];
      }
    }

    // Parse JSON strings
    ['craftTradition', 'workshop', 'socialMedia'].forEach(field => {
      if (typeof updateData[field] === 'string') {
        try {
          updateData[field] = JSON.parse(updateData[field]);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }
    });

    const updatedArtisan = await Artisan.findByIdAndUpdate(
      artisan._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email avatar');

    res.json({
      message: 'Profile updated successfully',
      artisan: updatedArtisan
    });

  } catch (error) {
    console.error('Artisan update error:', error);
    res.status(500).json({ 
      message: 'Failed to update profile', 
      error: error.message 
    });
  }
});

// Get artisan's own products
router.get('/my/products', authenticate, requireArtisan, async (req, res) => {
  try {
    const artisan = await Artisan.findOne({ user: req.user._id });
    
    if (!artisan) {
      return res.status(404).json({ message: 'Artisan profile not found' });
    }

    const { page = 1, limit = 20, status } = req.query;

    const filter = { artisan: artisan._id };
    if (status) {
      filter.status = status;
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });

  } catch (error) {
    console.error('Artisan products fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch products', 
      error: error.message 
    });
  }
});

// Get artisan dashboard stats
router.get('/my/dashboard', authenticate, requireArtisan, async (req, res) => {
  try {
    const artisan = await Artisan.findOne({ user: req.user._id });
    
    if (!artisan) {
      return res.status(404).json({ message: 'Artisan profile not found' });
    }

    // Get recent products
    const recentProducts = await Product.find({ artisan: artisan._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title images pricing stats status createdAt');

    // Get monthly stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyStats = await Product.aggregate([
      { $match: { artisan: artisan._id, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$stats.views' },
          totalLikes: { $sum: '$stats.likes' },
          averageRating: { $avg: '$stats.averageRating' }
        }
      }
    ]);

    const dashboardData = {
      artisan,
      recentProducts,
      monthlyStats: monthlyStats[0] || { totalViews: 0, totalLikes: 0, averageRating: 0 },
      overallStats: {
        totalProducts: artisan.stats.totalProducts,
        totalSales: artisan.stats.totalSales,
        rating: artisan.stats.rating,
        profileViews: artisan.stats.profileViews,
        followers: artisan.stats.followers
      }
    };

    res.json(dashboardData);

  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch dashboard data', 
      error: error.message 
    });
  }
});

// Search artisans
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;

    const artisans = await Artisan.find({
      $or: [
        { businessName: { $regex: query, $options: 'i' } },
        { specialization: { $in: [new RegExp(query, 'i')] } },
        { 'location.city': { $regex: query, $options: 'i' } },
        { 'location.state': { $regex: query, $options: 'i' } }
      ],
      isActive: true
    })
    .populate('user', 'firstName lastName avatar')
    .limit(Number(limit))
    .sort({ 'stats.rating': -1 });

    res.json(artisans);
  } catch (error) {
    console.error('Artisan search error:', error);
    res.status(500).json({ 
      message: 'Failed to search artisans', 
      error: error.message 
    });
  }
});

module.exports = router;