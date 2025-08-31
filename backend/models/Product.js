const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  artisan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artisan',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 150
  },
  description: {
    type: String,
    required: true,
    maxLength: 2000
  },
  shortDescription: {
    type: String,
    maxLength: 300
  },
  story: {
    type: String,
    maxLength: 3000 // AI-generated story about the craft
  },
  aiAnalysis: {
    generatedDescription: String,
    suggestedTags: [String],
    categoryConfidence: Number,
    craftTechniques: [String],
    culturalContext: String,
    marketingKeywords: [String],
    targetAudience: [String]
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false },
    order: { type: Number, default: 0 }
  }],
  originalInput: {
    userDescription: String,
    voiceInput: String,
    uploadedImage: String
  },
  category: {
    primary: {
      type: String,
      required: true,
      enum: [
        'Pottery & Ceramics', 'Textiles & Fabrics', 'Jewelry & Accessories',
        'Woodwork & Furniture', 'Metalwork', 'Leather Goods', 'Art & Paintings',
        'Sculptures', 'Home Decor', 'Traditional Instruments', 'Toys & Games',
        'Bags & Purses', 'Clothing & Apparel', 'Kitchen & Dining', 'Religious Items'
      ]
    },
    secondary: [String],
    tags: [String]
  },
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    discountedPrice: Number,
    currency: {
      type: String,
      default: 'INR'
    },
    priceHistory: [{
      price: Number,
      date: Date,
      reason: String
    }]
  },
  inventory: {
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 1
    },
    reserved: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    isUnlimited: { type: Boolean, default: false } // for digital products or made-to-order
  },
  specifications: {
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, default: 'cm' }
    },
    weight: {
      value: Number,
      unit: { type: String, default: 'g' }
    },
    materials: [String],
    colors: [String],
    pattern: String,
    finish: String,
    care_instructions: String,
    customizable: { type: Boolean, default: false },
    madeToOrder: { type: Boolean, default: false },
    productionTime: Number // days
  },
  craftDetails: {
    technique: String,
    timeToMake: Number, // hours
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Master'] },
    tools: [String],
    heritage: String,
    region: String
  },
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    shippingClass: String,
    freeShipping: { type: Boolean, default: false },
    domesticShipping: { type: Boolean, default: true },
    internationalShipping: { type: Boolean, default: false }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: String,
    images: [String],
    verified: { type: Boolean, default: false },
    helpful: { type: Number, default: 0 },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  stats: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    slug: { type: String, unique: true }
  },
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'active', 'inactive', 'out_of_stock', 'discontinued'],
    default: 'draft'
  },
  featured: {
    isFeatured: { type: Boolean, default: false },
    featuredUntil: Date,
    featuredCategory: String
  },
  flags: {
    isNew: { type: Boolean, default: true },
    isBestseller: { type: Boolean, default: false },
    isHandmade: { type: Boolean, default: true },
    isEcoFriendly: { type: Boolean, default: false },
    isCertified: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Indexes for better search performance
productSchema.index({ 'category.primary': 1, status: 1 });
productSchema.index({ artisan: 1, status: 1 });
productSchema.index({ 'pricing.basePrice': 1 });
productSchema.index({ 'stats.averageRating': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'seo.slug': 1 });

// Text index for search
productSchema.index({
  title: 'text',
  description: 'text',
  'category.tags': 'text',
  'specifications.materials': 'text'
});

// Generate slug before saving
productSchema.pre('save', function(next) {
  if (this.isModified('title') || this.isNew) {
    this.seo.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + this._id.toString().slice(-6);
  }
  next();
});

// Calculate average rating
productSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.stats.averageRating = 0;
    this.stats.totalReviews = 0;
    return;
  }
  
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.stats.averageRating = Number((sum / this.reviews.length).toFixed(1));
  this.stats.totalReviews = this.reviews.length;
};

// Check if in stock
productSchema.virtual('isInStock').get(function() {
  return this.inventory.isUnlimited || (this.inventory.stock - this.inventory.reserved) > 0;
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);