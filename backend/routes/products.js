const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const Artisan = require('../models/Artisan');
const { authenticate, requireArtisan, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for multiple image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/products');
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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

// Create new product
router.post('/', authenticate, requireArtisan, upload.array('images', 10), async (req, res) => {
  try {
    const artisan = await Artisan.findOne({ user: req.user._id });
    if (!artisan) {
      return res.status(404).json({ message: 'Artisan profile not found' });
    }

    const productData = {
      ...req.body,
      artisan: artisan._id,
      images: req.files ? req.files.map((file, index) => ({
        url: `/uploads/products/${file.filename}`,
        alt: `${req.body.title} - Image ${index + 1}`,
        isPrimary: index === 0,
        order: index
      })) : []
    };

    // Parse JSON strings from form data
    if (typeof productData.specifications === 'string') {
      productData.specifications = JSON.parse(productData.specifications);
    }
    if (typeof productData.craftDetails === 'string') {
      productData.craftDetails = JSON.parse(productData.craftDetails);
    }
    if (typeof productData.aiAnalysis === 'string') {
      productData.aiAnalysis = JSON.parse(productData.aiAnalysis);
    }

    const product = new Product(productData);
    await product.save();

    // Update artisan's product count
    artisan.products.push(product._id);
    artisan.stats.totalProducts += 1;
    await artisan.save();

    await product.populate('artisan');
    
    res.status(201).json({
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ 
      message: 'Failed to create product', 
      error: error.message 
    });
  }
});

// Get all products (marketplace view)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      sort = 'createdAt',
      order = 'desc',
      search,
      featured,
      artisan
    } = req.query;

    // Build filter object
    const filter = { status: 'active' };

    if (category) {
      filter['category.primary'] = category;
    }

    if (minPrice || maxPrice) {
      filter['pricing.basePrice'] = {};
      if (minPrice) filter['pricing.basePrice'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.basePrice'].$lte = Number(maxPrice);
    }

    if (featured === 'true') {
      filter['featured.isFeatured'] = true;
    }

    if (artisan) {
      filter.artisan = artisan;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const products = await Product.find(filter)
      .populate('artisan', 'businessName location stats verification')
      .populate('artisan.user', 'firstName lastName avatar')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    });

  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch products', 
      error: error.message 
    });
  }
});

// Get single product by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('artisan')
      .populate('artisan.user', 'firstName lastName avatar')
      .populate('reviews.user', 'firstName lastName avatar');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Increment view count
    product.stats.views += 1;
    await product.save();

    res.json(product);
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch product', 
      error: error.message 
    });
  }
});

// Update product
router.put('/:id', authenticate, requireArtisan, upload.array('images', 10), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if artisan owns this product
    const artisan = await Artisan.findOne({ user: req.user._id });
    if (!product.artisan.equals(artisan._id)) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // Handle new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: `/uploads/products/${file.filename}`,
        alt: `${req.body.title || product.title} - Image ${product.images.length + index + 1}`,
        isPrimary: product.images.length === 0 && index === 0,
        order: product.images.length + index
      }));
      
      req.body.images = [...product.images, ...newImages];
    }

    // Parse JSON strings from form data
    ['specifications', 'craftDetails', 'aiAnalysis'].forEach(field => {
      if (typeof req.body[field] === 'string') {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }
    });

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('artisan');

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ 
      message: 'Failed to update product', 
      error: error.message 
    });
  }
});

// Delete product
router.delete('/:id', authenticate, requireArtisan, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check ownership
    const artisan = await Artisan.findOne({ user: req.user._id });
    if (!product.artisan.equals(artisan._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    // Delete product images
    product.images.forEach(image => {
      const imagePath = path.join(__dirname, '..', image.url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });

    await Product.findByIdAndDelete(req.params.id);

    // Update artisan stats
    artisan.products.pull(product._id);
    artisan.stats.totalProducts = Math.max(0, artisan.stats.totalProducts - 1);
    await artisan.save();

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ 
      message: 'Failed to delete product', 
      error: error.message 
    });
  }
});

// Add product review
router.post('/:id/reviews', authenticate, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user already reviewed this product
    const existingReview = product.reviews.find(review => 
      review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const review = {
      user: req.user._id,
      rating: Number(rating),
      comment: comment?.trim(),
      createdAt: new Date()
    };

    product.reviews.push(review);
    product.calculateAverageRating();
    await product.save();

    await product.populate('reviews.user', 'firstName lastName avatar');

    res.status(201).json({
      message: 'Review added successfully',
      review: product.reviews[product.reviews.length - 1]
    });

  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ 
      message: 'Failed to add review', 
      error: error.message 
    });
  }
});

// Get featured products
router.get('/featured/list', async (req, res) => {
  try {
    const featured = await Product.find({
      'featured.isFeatured': true,
      'featured.featuredUntil': { $gt: new Date() },
      status: 'active'
    })
    .populate('artisan', 'businessName location stats')
    .sort({ 'stats.averageRating': -1, 'stats.views': -1 })
    .limit(12);

    res.json(featured);
  } catch (error) {
    console.error('Featured products error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch featured products', 
      error: error.message 
    });
  }
});

// Get product categories with counts
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category.primary', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json(categories);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch categories', 
      error: error.message 
    });
  }
});

module.exports = router;