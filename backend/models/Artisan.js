const mongoose = require('mongoose');

const artisanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  bio: {
    type: String,
    maxLength: 1000
  },
  specialization: [{
    type: String,
    required: true,
    enum: [
      'Pottery', 'Textiles', 'Jewelry', 'Woodwork', 'Metalwork', 
      'Leather', 'Painting', 'Sculpture', 'Weaving', 'Embroidery',
      'Glass Work', 'Stone Carving', 'Basketry', 'Calligraphy',
      'Traditional Instruments', 'Other'
    ]
  }],
  craftTradition: {
    origin: String,
    history: String,
    techniques: [String],
    culturalSignificance: String
  },
  experience: {
    type: Number, // years of experience
    required: true,
    min: 0
  },
  location: {
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  workshop: {
    name: String,
    address: String,
    images: [String],
    description: String,
    visitingHours: String,
    canVisit: { type: Boolean, default: false }
  },
  socialMedia: {
    instagram: String,
    facebook: String,
    youtube: String,
    website: String
  },
  certifications: [{
    name: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date,
    certificateUrl: String
  }],
  awards: [{
    title: String,
    year: Number,
    description: String,
    imageUrl: String
  }],
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  stats: {
    totalProducts: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    profileViews: { type: Number, default: 0 }
  },
  verification: {
    isVerified: { type: Boolean, default: false },
    verificationDate: Date,
    documents: [{
      type: String, // 'identity', 'business_license', 'craft_certificate'
      url: String,
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
    }]
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String,
    upiId: String
  },
  subscription: {
    plan: { type: String, enum: ['free', 'premium', 'enterprise'], default: 'free' },
    startDate: Date,
    endDate: Date,
    features: [String]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featuredUntil: Date,
  joinedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
artisanSchema.index({ 'location.city': 1, 'location.state': 1 });
artisanSchema.index({ specialization: 1 });
artisanSchema.index({ 'stats.rating': -1 });
artisanSchema.index({ 'verification.isVerified': 1 });

// Calculate total revenue
artisanSchema.virtual('totalRevenue').get(function() {
  return this.stats.totalSales * 0.85; // Assuming 15% platform fee
});

artisanSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Artisan', artisanSchema);