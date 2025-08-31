const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { authenticate, requireArtisan } = require('../middleware/auth');

const router = express.Router();

// Configure multer for image uploads
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
    cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, WebP) are allowed!'));
    }
  }
});

// Google Cloud AI configuration
let geminiAI;
try {
  const { GoogleGenerativeAI } = require('@google-ai/generativelanguage');
  geminiAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
} catch (error) {
  console.warn('Google AI not configured:', error.message);
}

// Analyze product image and generate AI content
router.post('/analyze-product', authenticate, requireArtisan, upload.single('image'), async (req, res) => {
  try {
    const { description, category, voiceInput } = req.body;
    const imageFile = req.file;

    if (!imageFile && !description) {
      return res.status(400).json({ message: 'Either image or description is required' });
    }

    // Process image if provided
    let processedImagePath = null;
    if (imageFile) {
      processedImagePath = await processImage(imageFile.path);
    }

    // Prepare input for AI analysis
    const analysisInput = {
      description: description || '',
      voiceInput: voiceInput || '',
      category: category || '',
      imagePath: processedImagePath
    };

    // Generate AI analysis and content
    const aiAnalysis = await generateAIContent(analysisInput);

    res.json({
      message: 'Product analyzed successfully',
      analysis: aiAnalysis,
      imagePath: processedImagePath ? `/uploads/products/${path.basename(processedImagePath)}` : null
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ 
      message: 'Failed to analyze product', 
      error: error.message 
    });
  }
});

// Generate product story using AI
router.post('/generate-story', authenticate, requireArtisan, async (req, res) => {
  try {
    const { productTitle, category, materials, technique, region, artisanBackground } = req.body;

    if (!productTitle) {
      return res.status(400).json({ message: 'Product title is required' });
    }

    const story = await generateProductStory({
      productTitle,
      category,
      materials,
      technique,
      region,
      artisanBackground
    });

    res.json({
      message: 'Story generated successfully',
      story
    });

  } catch (error) {
    console.error('Story generation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate story', 
      error: error.message 
    });
  }
});

// Speech-to-text conversion
router.post('/speech-to-text', authenticate, requireArtisan, upload.single('audio'), async (req, res) => {
  try {
    const audioFile = req.file;

    if (!audioFile) {
      return res.status(400).json({ message: 'Audio file is required' });
    }

    // For now, return a placeholder response
    // In production, you would integrate with Google Cloud Speech-to-Text API
    const mockTranscription = "This is a beautiful handcrafted pottery piece made using traditional techniques passed down through generations.";

    res.json({
      message: 'Speech converted to text successfully',
      transcription: mockTranscription
    });

  } catch (error) {
    console.error('Speech-to-text error:', error);
    res.status(500).json({ 
      message: 'Failed to convert speech to text', 
      error: error.message 
    });
  }
});

// Helper function to process images
async function processImage(imagePath) {
  try {
    const processedPath = imagePath.replace(/\.[^/.]+$/, '_processed.webp');
    
    await sharp(imagePath)
      .resize(800, 800, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .webp({ quality: 85 })
      .toFile(processedPath);

    // Keep original and processed version
    return processedPath;
  } catch (error) {
    console.error('Image processing error:', error);
    return imagePath; // Return original if processing fails
  }
}

// Generate AI content using Gemini (mock implementation for now)
async function generateAIContent(input) {
  try {
    // For demo purposes, using mock data
    // In production, integrate with actual Google Gemini API
    const mockAnalysis = {
      generatedDescription: `This exquisite handcrafted piece showcases the timeless artistry and cultural heritage of traditional Indian craftsmanship. ${input.description} Each detail reflects hours of meticulous work and generations of inherited knowledge.`,
      
      suggestedTags: extractTags(input.description + ' ' + input.category),
      
      categoryConfidence: 0.92,
      
      craftTechniques: determineTechniques(input.category),
      
      culturalContext: `This craft represents the rich cultural traditions of India, where artisans have been preserving ancient techniques for centuries. The piece embodies the spirit of ${input.category || 'traditional craftsmanship'} that has been passed down through generations.`,
      
      marketingKeywords: [
        'handmade', 'artisan', 'traditional', 'heritage', 'authentic', 
        'cultural', 'unique', 'sustainable', 'eco-friendly', 'one-of-a-kind'
      ],
      
      targetAudience: [
        'Art enthusiasts', 'Cultural collectors', 'Home decorators', 
        'Gift seekers', 'Sustainable living advocates'
      ],
      
      pricing_suggestions: {
        suggested_range: { min: 500, max: 2000 },
        factors: ['craftsmanship quality', 'time investment', 'material costs', 'uniqueness']
      }
    };

    return mockAnalysis;
  } catch (error) {
    console.error('AI content generation error:', error);
    throw error;
  }
}

// Generate product story
async function generateProductStory(productData) {
  const { productTitle, category, materials, technique, region, artisanBackground } = productData;
  
  // Mock story generation - replace with actual Gemini API call
  const story = `
In the vibrant workshops of ${region || 'India'}, where tradition meets artistry, this ${productTitle} comes to life through the skilled hands of master craftspeople. 

The creation process begins at dawn, when the artisan carefully selects the finest ${materials || 'traditional materials'}, each piece chosen for its unique character and potential. Using the ancient technique of ${technique || 'traditional craftsmanship'}, every curve and detail is shaped with patience and precision that can only come from years of dedicated practice.

${artisanBackground ? `The artisan's journey began ${artisanBackground}, learning from masters who themselves learned from their predecessors.` : 'This craft has been passed down through generations, with each artisan adding their own touch while preserving the essence of the tradition.'}

What makes this ${productTitle} truly special is not just its aesthetic beauty, but the story it carries - a story of cultural preservation, sustainable practices, and the unwavering dedication to keeping ancient arts alive in our modern world. Each piece is a bridge between the past and present, carrying the soul of traditional ${category || 'craftsmanship'} into contemporary homes.

When you choose this piece, you're not just purchasing a product; you're becoming part of a legacy, supporting local artisans, and helping preserve invaluable cultural heritage for future generations.
`.trim();

  return story;
}

// Helper functions
function extractTags(text) {
  const commonTags = [
    'handmade', 'artisan', 'traditional', 'authentic', 'cultural', 
    'heritage', 'vintage', 'rustic', 'ethnic', 'folk art', 'handcrafted',
    'sustainable', 'eco-friendly', 'unique', 'decorative', 'gift'
  ];
  
  const textLower = text.toLowerCase();
  return commonTags.filter(tag => 
    textLower.includes(tag) || 
    textLower.includes(tag.replace('-', ' '))
  ).slice(0, 8);
}

function determineTechniques(category) {
  const techniques = {
    'Pottery & Ceramics': ['wheel throwing', 'hand building', 'glazing', 'firing'],
    'Textiles & Fabrics': ['weaving', 'dyeing', 'block printing', 'embroidery'],
    'Jewelry & Accessories': ['metalwork', 'stone setting', 'engraving', 'polishing'],
    'Woodwork & Furniture': ['carving', 'joinery', 'finishing', 'inlay work'],
    'Metalwork': ['forging', 'casting', 'etching', 'patination'],
    'default': ['traditional handcrafting', 'artisan techniques', 'heritage methods']
  };
  
  return techniques[category] || techniques.default;
}

module.exports = router;