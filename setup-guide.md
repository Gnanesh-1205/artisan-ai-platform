# ArtisanAI Setup Guide

This guide will help you set up the ArtisanAI platform for the hackathon submission.

## 🚀 Quick Start (5 minutes)

### 1. Start the Application
```bash
# Make sure you're in the project root directory
./start.sh
```

This will:
- Install backend dependencies
- Start the backend server on port 5000
- Start the frontend server on port 3000
- Open the application in your browser

### 2. Test the Platform
1. Open http://localhost:3000
2. Click "Join as Artisan" to register
3. Complete your artisan profile
4. Try uploading a product with the AI features

## 🔧 Google Cloud AI Setup

To enable full AI functionality, you'll need to configure Google Cloud:

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Gemini API (for content generation)
   - Speech-to-Text API (for voice input)
   - Vertex AI API (for advanced features)

### Step 2: Get API Keys
1. Go to APIs & Services > Credentials
2. Create API Key
3. Restrict the key to your enabled APIs

### Step 3: Configure Environment
1. Open `backend/.env` file
2. Replace `your_google_ai_api_key_here` with your actual API key
3. Replace `your_project_id_here` with your Google Cloud Project ID

```bash
# Example configuration
GOOGLE_AI_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_CLOUD_PROJECT_ID=my-artisan-project
```

### Step 4: Restart Backend
```bash
cd backend
npm restart
```

## 🗃️ Database Setup

### Option 1: MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free cluster
3. Get connection string
4. Update `MONGODB_URI` in `backend/.env`

### Option 2: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB: `mongod`
3. Keep default URI: `mongodb://localhost:27017/artisan-platform`

## 📱 Testing Features

### Core Features to Test
1. **User Registration**: Register as customer and artisan
2. **Product Upload**: Upload images and descriptions
3. **AI Content Generation**: Test description and story generation
4. **Voice Input**: Try voice-to-text functionality
5. **Marketplace**: Browse and search products
6. **Artisan Profiles**: View artisan information

### Demo Workflow
```
1. Register as Artisan → 2. Complete Profile → 3. Add Product → 
4. Use AI Analysis → 5. Publish → 6. View in Marketplace
```

## 🎥 Creating Demo Video

For your hackathon submission, create a 3-minute video showing:

1. **Problem Introduction** (30 seconds)
   - Show the challenge artisans face

2. **Platform Overview** (60 seconds)
   - Homepage and marketplace
   - Artisan profiles
   - Product browsing

3. **AI Features Demo** (90 seconds)
   - Product upload process
   - AI content generation
   - Voice input demonstration
   - Generated stories and descriptions

## 🚨 Troubleshooting

### Backend Won't Start
- Check if port 5000 is available
- Verify Node.js installation: `node --version`
- Check MongoDB connection

### Frontend Won't Load
- Check if port 3000 is available
- Try different port: `python -m http.server 8000`

### AI Features Not Working
- Verify Google Cloud API keys
- Check API quotas and billing
- Look at browser console for errors

### Database Connection Issues
- For MongoDB Atlas: Check IP whitelist
- For local MongoDB: Ensure `mongod` is running
- Verify connection string format

## 📊 Sample Data

The platform includes mock data for demonstration:
- Sample products with AI-generated content
- Mock artisan profiles
- Demonstration marketplace

## 🎯 Hackathon Submission Checklist

- [ ] Platform runs successfully
- [ ] AI features demonstrate Google Cloud integration
- [ ] 3-minute demo video recorded
- [ ] README.md updated with project details
- [ ] GitHub repository is public
- [ ] Live demo URL (if deployed)

## 🌟 Key Differentiators for Judges

1. **AI-First Approach**: Unique use of Gemini for craft storytelling
2. **Cultural Focus**: Deep understanding of artisan challenges
3. **Voice Accessibility**: Makes platform accessible to all literacy levels
4. **Story-Driven Commerce**: Emotional connection over just selling
5. **Scalable Solution**: Can expand globally

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review browser console logs
3. Check backend server logs
4. Ensure all dependencies are installed

## 🎉 Success Metrics

Your platform is ready for submission when:
- ✅ Both servers start without errors
- ✅ User registration works
- ✅ Product upload completes successfully  
- ✅ AI content generation functions (even with mock data)
- ✅ Marketplace displays products
- ✅ Platform looks professional and polished

Good luck with your hackathon submission! 🏆