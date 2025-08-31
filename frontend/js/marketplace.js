// Marketplace and product management functions for ArtisanAI platform

// Global variables for product upload
let currentProductImages = [];
let isRecording = false;
let mediaRecorder = null;
let recordedAudioBlob = null;

// Show product upload modal (for artisans)
function showProductUploadModal() {
    if (!isArtisan()) {
        showNotification('Please register as an artisan to add products', 'warning');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content max-w-4xl max-h-screen overflow-y-auto">
            <div class="flex justify-between items-center p-6 border-b">
                <h2 class="text-2xl font-bold text-gray-900">Add New Product</h2>
                <button onclick="this.closest('.modal').remove()" 
                        class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="p-6">
                <!-- Step Indicator -->
                <div class="flex items-center justify-center mb-8">
                    <div class="flex items-center space-x-4">
                        <div class="step-item active" data-step="1">
                            <div class="step-circle">1</div>
                            <span class="step-label">Upload & Describe</span>
                        </div>
                        <div class="step-line"></div>
                        <div class="step-item" data-step="2">
                            <div class="step-circle">2</div>
                            <span class="step-label">AI Analysis</span>
                        </div>
                        <div class="step-line"></div>
                        <div class="step-item" data-step="3">
                            <div class="step-circle">3</div>
                            <span class="step-label">Product Details</span>
                        </div>
                    </div>
                </div>

                <form id="product-upload-form">
                    <!-- Step 1: Upload and Basic Description -->
                    <div id="step-1" class="step-content">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Step 1: Upload Images & Add Description</h3>
                        
                        <!-- Image Upload -->
                        <div class="form-group">
                            <label class="form-label">Product Images</label>
                            <div class="file-upload" id="image-upload-area">
                                <input type="file" id="product-images" name="images" multiple accept="image/*">
                                <div class="upload-content">
                                    <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                                    <p class="text-lg text-gray-600 mb-2">Drag and drop images or click to select</p>
                                    <p class="text-sm text-gray-500">Upload up to 10 high-quality images of your product</p>
                                </div>
                            </div>
                            <div id="image-preview" class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 hidden"></div>
                        </div>

                        <!-- Voice/Text Description -->
                        <div class="form-group">
                            <label class="form-label">Product Description</label>
                            <div class="flex space-x-4 mb-4">
                                <button type="button" id="text-input-btn" class="btn-outline active">
                                    <i class="fas fa-keyboard mr-2"></i>Type Description
                                </button>
                                <button type="button" id="voice-input-btn" class="btn-outline">
                                    <i class="fas fa-microphone mr-2"></i>Voice Input
                                </button>
                            </div>
                            
                            <!-- Text Input -->
                            <div id="text-input-area">
                                <textarea name="description" class="form-textarea" rows="4" 
                                          placeholder="Describe your product: materials used, crafting technique, cultural significance, time taken to make..."></textarea>
                            </div>

                            <!-- Voice Input -->
                            <div id="voice-input-area" class="hidden">
                                <div class="voice-recorder">
                                    <button type="button" id="record-btn" class="record-button">
                                        <i class="fas fa-microphone"></i>
                                    </button>
                                    <div class="flex-1 ml-4">
                                        <div id="recording-status" class="text-sm text-gray-600 mb-1">Click to start recording</div>
                                        <div id="recording-duration" class="text-xs text-gray-500">00:00</div>
                                    </div>
                                    <button type="button" id="play-recording" class="btn-secondary hidden">
                                        <i class="fas fa-play"></i>
                                    </button>
                                </div>
                                <textarea id="transcribed-text" name="voiceDescription" class="form-textarea mt-4 hidden" 
                                          rows="4" placeholder="Your voice input will appear here..."></textarea>
                            </div>
                        </div>

                        <!-- Basic Info -->
                        <div class="grid md:grid-cols-2 gap-6">
                            <div class="form-group">
                                <label class="form-label">Product Category</label>
                                <select name="category" class="form-select" required>
                                    <option value="">Select Category</option>
                                    <option value="Pottery & Ceramics">Pottery & Ceramics</option>
                                    <option value="Textiles & Fabrics">Textiles & Fabrics</option>
                                    <option value="Jewelry & Accessories">Jewelry & Accessories</option>
                                    <option value="Woodwork & Furniture">Woodwork & Furniture</option>
                                    <option value="Metalwork">Metalwork</option>
                                    <option value="Leather Goods">Leather Goods</option>
                                    <option value="Art & Paintings">Art & Paintings</option>
                                    <option value="Sculptures">Sculptures</option>
                                    <option value="Home Decor">Home Decor</option>
                                    <option value="Traditional Instruments">Traditional Instruments</option>
                                    <option value="Toys & Games">Toys & Games</option>
                                    <option value="Bags & Purses">Bags & Purses</option>
                                    <option value="Clothing & Apparel">Clothing & Apparel</option>
                                    <option value="Kitchen & Dining">Kitchen & Dining</option>
                                    <option value="Religious Items">Religious Items</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Estimated Price (₹)</label>
                                <input type="number" name="estimatedPrice" class="form-input" min="1" 
                                       placeholder="Your estimated price">
                            </div>
                        </div>

                        <div class="flex justify-end">
                            <button type="button" onclick="processWithAI()" class="btn-primary">
                                <i class="fas fa-robot mr-2"></i>Analyze with AI
                            </button>
                        </div>
                    </div>

                    <!-- Step 2: AI Analysis Results -->
                    <div id="step-2" class="step-content hidden">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Step 2: AI-Generated Content</h3>
                        
                        <div id="ai-analysis-loading" class="text-center py-12">
                            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mb-4"></div>
                            <p class="text-gray-600">Our AI is analyzing your product...</p>
                        </div>

                        <div id="ai-analysis-results" class="hidden space-y-6">
                            <!-- Generated Description -->
                            <div class="form-group">
                                <label class="form-label">AI-Enhanced Description</label>
                                <textarea id="ai-description" class="form-textarea" rows="4"></textarea>
                                <div class="flex justify-between items-center mt-2">
                                    <span class="text-sm text-gray-500">You can edit this description</span>
                                    <button type="button" onclick="regenerateDescription()" class="text-sm text-brand-600 hover:text-brand-700">
                                        <i class="fas fa-redo mr-1"></i>Regenerate
                                    </button>
                                </div>
                            </div>

                            <!-- Generated Story -->
                            <div class="form-group">
                                <label class="form-label">Craft Story</label>
                                <textarea id="ai-story" class="form-textarea" rows="6"></textarea>
                                <div class="flex justify-between items-center mt-2">
                                    <span class="text-sm text-gray-500">A compelling story about your craft's heritage</span>
                                    <button type="button" onclick="regenerateStory()" class="text-sm text-brand-600 hover:text-brand-700">
                                        <i class="fas fa-redo mr-1"></i>Regenerate Story
                                    </button>
                                </div>
                            </div>

                            <!-- Suggested Tags -->
                            <div class="form-group">
                                <label class="form-label">Suggested Keywords</label>
                                <div id="suggested-tags" class="flex flex-wrap gap-2 mb-2"></div>
                                <input type="text" id="custom-tags" class="form-input" 
                                       placeholder="Add custom tags (comma separated)">
                            </div>

                            <!-- Price Suggestions -->
                            <div class="bg-brand-50 p-4 rounded-lg">
                                <h4 class="font-semibold text-brand-800 mb-2">AI Price Analysis</h4>
                                <div id="price-suggestions" class="grid md:grid-cols-2 gap-4"></div>
                            </div>
                        </div>

                        <div class="flex justify-between mt-6">
                            <button type="button" onclick="goToStep(1)" class="btn-secondary">
                                <i class="fas fa-arrow-left mr-2"></i>Back
                            </button>
                            <button type="button" onclick="goToStep(3)" class="btn-primary" id="continue-to-details">
                                Continue to Details <i class="fas fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Step 3: Complete Product Details -->
                    <div id="step-3" class="step-content hidden">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Step 3: Complete Product Information</h3>
                        
                        <div class="grid md:grid-cols-2 gap-6">
                            <div class="form-group">
                                <label class="form-label">Product Title</label>
                                <input type="text" name="title" class="form-input" required 
                                       placeholder="Enter product title">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Final Price (₹)</label>
                                <input type="number" name="price" class="form-input" required min="1" 
                                       placeholder="Set your final price">
                            </div>
                        </div>

                        <div class="grid md:grid-cols-3 gap-6">
                            <div class="form-group">
                                <label class="form-label">Stock Quantity</label>
                                <input type="number" name="stock" class="form-input" required min="0" 
                                       placeholder="Available quantity">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Time to Make (hours)</label>
                                <input type="number" name="timeToMake" class="form-input" min="0" step="0.5" 
                                       placeholder="e.g., 24">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Difficulty Level</label>
                                <select name="difficulty" class="form-select">
                                    <option value="">Select Level</option>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                    <option value="Master">Master</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Materials Used (comma separated)</label>
                            <input type="text" name="materials" class="form-input" 
                                   placeholder="e.g., Clay, Natural pigments, Glaze">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Dimensions</label>
                            <div class="grid grid-cols-4 gap-2">
                                <input type="number" name="length" class="form-input" placeholder="Length" min="0" step="0.1">
                                <input type="number" name="width" class="form-input" placeholder="Width" min="0" step="0.1">
                                <input type="number" name="height" class="form-input" placeholder="Height" min="0" step="0.1">
                                <select name="dimensionUnit" class="form-select">
                                    <option value="cm">cm</option>
                                    <option value="mm">mm</option>
                                    <option value="m">m</option>
                                    <option value="in">inches</option>
                                </select>
                            </div>
                        </div>

                        <div class="grid md:grid-cols-2 gap-6">
                            <div class="form-group">
                                <label class="form-label">Weight (grams)</label>
                                <input type="number" name="weight" class="form-input" min="0" 
                                       placeholder="Product weight">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Colors Available</label>
                                <input type="text" name="colors" class="form-input" 
                                       placeholder="e.g., Brown, Natural, Red">
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Care Instructions</label>
                            <textarea name="careInstructions" class="form-textarea" rows="2" 
                                      placeholder="How to maintain and care for this product..."></textarea>
                        </div>

                        <!-- Shipping Options -->
                        <div class="bg-gray-50 p-4 rounded-lg mb-6">
                            <h4 class="font-semibold text-gray-900 mb-4">Shipping Options</h4>
                            <div class="grid md:grid-cols-2 gap-4">
                                <div class="flex items-center">
                                    <input type="checkbox" name="domesticShipping" class="mr-3" checked>
                                    <span>Domestic Shipping (India)</span>
                                </div>
                                <div class="flex items-center">
                                    <input type="checkbox" name="internationalShipping" class="mr-3">
                                    <span>International Shipping</span>
                                </div>
                                <div class="flex items-center">
                                    <input type="checkbox" name="freeShipping" class="mr-3">
                                    <span>Free Shipping</span>
                                </div>
                                <div class="flex items-center">
                                    <input type="checkbox" name="madeToOrder" class="mr-3">
                                    <span>Made to Order</span>
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-between">
                            <button type="button" onclick="goToStep(2)" class="btn-secondary">
                                <i class="fas fa-arrow-left mr-2"></i>Back
                            </button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-plus mr-2"></i>Create Product
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Initialize upload functionality
    initializeProductUpload();
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Initialize product upload functionality
function initializeProductUpload() {
    // Image upload handling
    const imageInput = document.getElementById('product-images');
    const uploadArea = document.getElementById('image-upload-area');
    
    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    uploadArea.addEventListener('drop', handleDrop, false);
    uploadArea.addEventListener('click', () => imageInput.click());
    
    imageInput.addEventListener('change', handleImageSelect);
    
    // Voice/Text input toggle
    const textBtn = document.getElementById('text-input-btn');
    const voiceBtn = document.getElementById('voice-input-btn');
    
    textBtn.addEventListener('click', () => toggleInputMethod('text'));
    voiceBtn.addEventListener('click', () => toggleInputMethod('voice'));
    
    // Voice recording
    const recordBtn = document.getElementById('record-btn');
    recordBtn.addEventListener('click', toggleRecording);
    
    // Form submission
    const form = document.getElementById('product-upload-form');
    form.addEventListener('submit', handleProductSubmit);
}

// Helper functions for drag and drop
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    document.getElementById('image-upload-area').classList.add('dragover');
}

function unhighlight(e) {
    document.getElementById('image-upload-area').classList.remove('dragover');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleImageSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    currentProductImages = Array.from(files).slice(0, 10); // Max 10 images
    displayImagePreviews();
}

function displayImagePreviews() {
    const preview = document.getElementById('image-preview');
    preview.innerHTML = '';
    
    if (currentProductImages.length > 0) {
        preview.classList.remove('hidden');
        
        currentProductImages.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const div = document.createElement('div');
                div.className = 'relative group';
                div.innerHTML = `
                    <img src="${e.target.result}" alt="Product ${index + 1}" 
                         class="w-full h-24 object-cover rounded-lg border">
                    <button type="button" onclick="removeImage(${index})" 
                            class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <i class="fas fa-times"></i>
                    </button>
                    ${index === 0 ? '<div class="absolute bottom-0 left-0 bg-brand-500 text-white text-xs px-2 py-1 rounded-br-lg">Main</div>' : ''}
                `;
                preview.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    } else {
        preview.classList.add('hidden');
    }
}

function removeImage(index) {
    currentProductImages.splice(index, 1);
    displayImagePreviews();
}

// Toggle input method (text/voice)
function toggleInputMethod(method) {
    const textBtn = document.getElementById('text-input-btn');
    const voiceBtn = document.getElementById('voice-input-btn');
    const textArea = document.getElementById('text-input-area');
    const voiceArea = document.getElementById('voice-input-area');
    
    if (method === 'text') {
        textBtn.classList.add('active');
        voiceBtn.classList.remove('active');
        textArea.classList.remove('hidden');
        voiceArea.classList.add('hidden');
    } else {
        voiceBtn.classList.add('active');
        textBtn.classList.remove('active');
        voiceArea.classList.remove('hidden');
        textArea.classList.add('hidden');
    }
}

// Voice recording functionality
function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = function(e) {
            recordedAudioBlob = e.data;
        };
        
        mediaRecorder.onstop = function() {
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        
        updateRecordingUI();
        startRecordingTimer();
        
    } catch (error) {
        console.error('Error starting recording:', error);
        showNotification('Microphone access denied or not available', 'error');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        isRecording = false;
        
        updateRecordingUI();
        stopRecordingTimer();
        
        // Convert audio to text (mock implementation)
        setTimeout(() => {
            convertSpeechToText();
        }, 1000);
    }
}

function updateRecordingUI() {
    const recordBtn = document.getElementById('record-btn');
    const status = document.getElementById('recording-status');
    
    if (isRecording) {
        recordBtn.classList.add('recording');
        recordBtn.innerHTML = '<i class="fas fa-stop"></i>';
        status.textContent = 'Recording... Click to stop';
    } else {
        recordBtn.classList.remove('recording');
        recordBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        status.textContent = recordedAudioBlob ? 'Processing audio...' : 'Click to start recording';
    }
}

let recordingTimer;
let recordingSeconds = 0;

function startRecordingTimer() {
    recordingSeconds = 0;
    recordingTimer = setInterval(() => {
        recordingSeconds++;
        const minutes = Math.floor(recordingSeconds / 60);
        const seconds = recordingSeconds % 60;
        document.getElementById('recording-duration').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopRecordingTimer() {
    clearInterval(recordingTimer);
}

// Convert speech to text (mock implementation)
async function convertSpeechToText() {
    const status = document.getElementById('recording-status');
    const transcribedText = document.getElementById('transcribed-text');
    const playButton = document.getElementById('play-recording');
    
    if (recordedAudioBlob) {
        status.textContent = 'Converting speech to text...';
        
        // Mock conversion - in production, this would call the API
        setTimeout(() => {
            const mockTranscription = "This is a beautiful handcrafted pottery vase made using traditional techniques passed down through generations. The clay is sourced locally and shaped on a potter's wheel. The natural glazing gives it a unique earthy finish.";
            
            transcribedText.value = mockTranscription;
            transcribedText.classList.remove('hidden');
            playButton.classList.remove('hidden');
            status.textContent = 'Audio converted successfully!';
            
            showNotification('Voice input converted to text successfully!', 'success');
        }, 2000);
        
        // In production, use this:
        /*
        try {
            const formData = new FormData();
            formData.append('audio', recordedAudioBlob, 'recording.webm');
            
            const result = await api.speechToText(formData);
            if (result.success) {
                transcribedText.value = result.data.transcription;
                transcribedText.classList.remove('hidden');
                playButton.classList.remove('hidden');
                status.textContent = 'Audio converted successfully!';
            } else {
                showNotification('Speech-to-text conversion failed', 'error');
            }
        } catch (error) {
            console.error('Speech-to-text error:', error);
            showNotification('Speech-to-text conversion failed', 'error');
        }
        */
    }
}

// Process with AI
async function processWithAI() {
    const form = document.getElementById('product-upload-form');
    const formData = new FormData(form);
    
    // Validation
    if (currentProductImages.length === 0) {
        showNotification('Please upload at least one product image', 'error');
        return;
    }
    
    const description = formData.get('description') || formData.get('voiceDescription');
    if (!description) {
        showNotification('Please provide a product description', 'error');
        return;
    }
    
    const category = formData.get('category');
    if (!category) {
        showNotification('Please select a product category', 'error');
        return;
    }
    
    // Show AI analysis step
    goToStep(2);
    
    // Prepare form data for AI analysis
    const aiFormData = new FormData();
    aiFormData.append('image', currentProductImages[0]);
    aiFormData.append('description', description);
    aiFormData.append('category', category);
    
    if (formData.get('voiceDescription')) {
        aiFormData.append('voiceInput', formData.get('voiceDescription'));
    }
    
    try {
        // Mock AI analysis for demo
        setTimeout(() => {
            displayMockAIResults(description, category);
        }, 3000);
        
        // In production, use this:
        /*
        const result = await api.analyzeProduct(aiFormData);
        if (result.success) {
            displayAIResults(result.data);
        } else {
            showNotification('AI analysis failed. Please try again.', 'error');
            goToStep(1);
        }
        */
        
    } catch (error) {
        console.error('AI analysis error:', error);
        showNotification('AI analysis failed. Please try again.', 'error');
        goToStep(1);
    }
}

// Display mock AI results for demo
function displayMockAIResults(description, category) {
    const loadingDiv = document.getElementById('ai-analysis-loading');
    const resultsDiv = document.getElementById('ai-analysis-results');
    const continueBtn = document.getElementById('continue-to-details');
    
    loadingDiv.classList.add('hidden');
    resultsDiv.classList.remove('hidden');
    continueBtn.disabled = false;
    
    // Enhanced description
    const enhancedDescription = `This exquisite ${category.toLowerCase()} piece showcases the timeless artistry and cultural heritage of traditional Indian craftsmanship. ${description} Each detail reflects hours of meticulous work and generations of inherited knowledge, making this a truly unique addition to any collection.`;
    
    document.getElementById('ai-description').value = enhancedDescription;
    
    // Generated story
    const story = `In the heart of India's vibrant craft communities, where ancient traditions meet artistic expression, this ${category.toLowerCase()} comes to life through the skilled hands of master artisans. The creation begins with the careful selection of premium materials, each chosen for its unique characteristics and potential.

Using techniques passed down through generations, the artisan shapes and molds with patience and precision that can only come from years of dedicated practice. The process is meditative, almost spiritual, as traditional tools transform raw materials into objects of beauty and function.

What makes this piece truly special is not just its aesthetic appeal, but the story it carries - a story of cultural preservation, sustainable practices, and the unwavering dedication to keeping ancient arts alive in our modern world. When you choose this handcrafted piece, you're not just purchasing a product; you're becoming part of a legacy that connects the past with the present.`;
    
    document.getElementById('ai-story').value = story;
    
    // Suggested tags
    const tags = ['handmade', 'artisan', 'traditional', 'authentic', 'cultural', 'heritage', 'unique', 'sustainable', 'handcrafted', category.toLowerCase().split(' ')[0]];
    displaySuggestedTags(tags);
    
    // Price suggestions
    const priceRange = getPriceRangeForCategory(category);
    displayPriceSuggestions(priceRange);
    
    showNotification('AI analysis completed successfully!', 'success');
}

// Display suggested tags
function displaySuggestedTags(tags) {
    const container = document.getElementById('suggested-tags');
    container.innerHTML = '';
    
    tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'badge badge-craft cursor-pointer hover:bg-craft-200';
        tagElement.textContent = tag;
        tagElement.onclick = () => addTagToCustomInput(tag);
        container.appendChild(tagElement);
    });
}

function addTagToCustomInput(tag) {
    const customTagsInput = document.getElementById('custom-tags');
    const currentTags = customTagsInput.value ? customTagsInput.value.split(',').map(t => t.trim()) : [];
    
    if (!currentTags.includes(tag)) {
        currentTags.push(tag);
        customTagsInput.value = currentTags.join(', ');
    }
}

// Display price suggestions
function displayPriceSuggestions(priceRange) {
    const container = document.getElementById('price-suggestions');
    container.innerHTML = `
        <div class="text-center">
            <div class="text-2xl font-bold text-brand-600">₹${priceRange.min.toLocaleString()} - ₹${priceRange.max.toLocaleString()}</div>
            <div class="text-sm text-gray-600">Suggested price range</div>
        </div>
        <div class="text-sm text-gray-600">
            <p class="mb-1"><strong>Factors considered:</strong></p>
            <ul class="list-disc list-inside space-y-1">
                <li>Material quality and sourcing</li>
                <li>Craftsmanship complexity</li>
                <li>Time investment</li>
                <li>Market demand and competition</li>
            </ul>
        </div>
    `;
}

function getPriceRangeForCategory(category) {
    const priceRanges = {
        'Pottery & Ceramics': { min: 500, max: 3000 },
        'Textiles & Fabrics': { min: 800, max: 5000 },
        'Jewelry & Accessories': { min: 1200, max: 8000 },
        'Woodwork & Furniture': { min: 2000, max: 15000 },
        'Metalwork': { min: 1000, max: 6000 },
        'Leather Goods': { min: 800, max: 4000 },
        'Art & Paintings': { min: 1500, max: 10000 },
        'Sculptures': { min: 2000, max: 12000 }
    };
    
    return priceRanges[category] || { min: 500, max: 5000 };
}

// Navigation between steps
function goToStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(step => {
        step.classList.add('hidden');
    });
    
    // Show target step
    document.getElementById(`step-${stepNumber}`).classList.remove('hidden');
    
    // Update step indicators
    document.querySelectorAll('.step-item').forEach((item, index) => {
        const stepNum = index + 1;
        if (stepNum <= stepNumber) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Pre-fill title in step 3
    if (stepNumber === 3) {
        const description = document.querySelector('textarea[name="description"]').value || 
                           document.getElementById('transcribed-text').value || '';
        const category = document.querySelector('select[name="category"]').value;
        
        if (description && category) {
            const title = generateProductTitle(description, category);
            document.querySelector('input[name="title"]').value = title;
        }
        
        // Set price from AI suggestion or estimation
        const estimatedPrice = document.querySelector('input[name="estimatedPrice"]').value;
        if (estimatedPrice) {
            document.querySelector('input[name="price"]').value = estimatedPrice;
        }
    }
}

function generateProductTitle(description, category) {
    // Simple title generation based on description and category
    const words = description.split(' ').slice(0, 10);
    const categoryWord = category.split(' ')[0];
    
    // Extract key descriptive words
    const descriptiveWords = words.filter(word => 
        word.length > 3 && 
        !['this', 'that', 'with', 'from', 'made', 'using', 'very', 'great'].includes(word.toLowerCase())
    );
    
    return `Handcrafted ${categoryWord} ${descriptiveWords.slice(0, 3).join(' ')}`.replace(/[^\w\s]/gi, '');
}

// Regenerate AI content
async function regenerateDescription() {
    const descriptionArea = document.getElementById('ai-description');
    const originalText = descriptionArea.value;
    
    descriptionArea.value = 'Regenerating description...';
    
    // Mock regeneration
    setTimeout(() => {
        const variations = [
            'This masterfully crafted piece embodies the rich traditions of Indian artisanship',
            'A stunning example of traditional craftsmanship that tells a story of cultural heritage',
            'This extraordinary handmade creation showcases the timeless beauty of authentic craftsmanship'
        ];
        
        const randomVariation = variations[Math.floor(Math.random() * variations.length)];
        const newDescription = originalText.replace(/^[^.]+\./, randomVariation + '.');
        descriptionArea.value = newDescription;
        
        showNotification('Description regenerated!', 'success');
    }, 1500);
}

async function regenerateStory() {
    const storyArea = document.getElementById('ai-story');
    
    storyArea.value = 'Regenerating story...';
    
    // Mock regeneration
    setTimeout(() => {
        const stories = [
            'In the workshops of skilled artisans, where tradition meets creativity, this piece begins its journey...',
            'From the hands of master craftspeople who learned their art from generations past...',
            'In the quiet moments before dawn, when the workshop is still and peaceful...'
        ];
        
        const randomStory = stories[Math.floor(Math.random() * stories.length)];
        storyArea.value = randomStory + ' ' + storyArea.value.substring(50);
        
        showNotification('Story regenerated!', 'success');
    }, 2000);
}

// Handle product form submission
async function handleProductSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating Product...';
    
    try {
        // Collect all form data
        const formData = new FormData(form);
        
        // Add AI-generated content
        formData.set('description', document.getElementById('ai-description').value);
        formData.set('story', document.getElementById('ai-story').value);
        
        // Add custom tags
        const customTags = document.getElementById('custom-tags').value;
        if (customTags) {
            formData.set('tags', customTags);
        }
        
        // Add images
        currentProductImages.forEach((image, index) => {
            formData.append('images', image);
        });
        
        // Build product data object
        const productData = buildProductData(formData);
        
        // Mock product creation
        setTimeout(() => {
            showNotification('Product created successfully! It will be reviewed and published soon.', 'success');
            form.closest('.modal').remove();
            
            // Refresh products if we're on a product page
            if (typeof loadFeaturedProducts === 'function') {
                loadFeaturedProducts();
            }
        }, 2000);
        
        // In production, use this:
        /*
        const result = await api.createProduct(productData);
        if (result.success) {
            showNotification('Product created successfully!', 'success');
            form.closest('.modal').remove();
            
            // Refresh product list or redirect
            if (typeof loadFeaturedProducts === 'function') {
                loadFeaturedProducts();
            }
        } else {
            showNotification(result.error || 'Failed to create product', 'error');
        }
        */
        
    } catch (error) {
        console.error('Product creation error:', error);
        showNotification('Failed to create product. Please try again.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-plus mr-2"></i>Create Product';
    }
}

// Build product data object from form
function buildProductData(formData) {
    return {
        title: formData.get('title'),
        description: formData.get('description'),
        story: formData.get('story'),
        category: {
            primary: formData.get('category')
        },
        pricing: {
            basePrice: parseFloat(formData.get('price'))
        },
        inventory: {
            stock: parseInt(formData.get('stock')) || 1
        },
        specifications: {
            dimensions: {
                length: parseFloat(formData.get('length')) || null,
                width: parseFloat(formData.get('width')) || null,
                height: parseFloat(formData.get('height')) || null,
                unit: formData.get('dimensionUnit') || 'cm'
            },
            weight: {
                value: parseFloat(formData.get('weight')) || null,
                unit: 'g'
            },
            materials: formData.get('materials') ? formData.get('materials').split(',').map(m => m.trim()) : [],
            colors: formData.get('colors') ? formData.get('colors').split(',').map(c => c.trim()) : [],
            care_instructions: formData.get('careInstructions')
        },
        craftDetails: {
            timeToMake: parseFloat(formData.get('timeToMake')) || null,
            difficulty: formData.get('difficulty')
        },
        shipping: {
            domesticShipping: formData.get('domesticShipping') === 'on',
            internationalShipping: formData.get('internationalShipping') === 'on',
            freeShipping: formData.get('freeShipping') === 'on'
        },
        flags: {
            madeToOrder: formData.get('madeToOrder') === 'on'
        }
    };
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showProductUploadModal
    };
}