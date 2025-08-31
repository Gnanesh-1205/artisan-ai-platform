// Main JavaScript file for ArtisanAI platform

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
});

// Initialize application
function initializeApp() {
    // Check authentication status
    checkAuthStatus();
    
    // Load featured products
    loadFeaturedProducts();
    
    // Load featured artisans
    loadFeaturedArtisans();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Initialize smooth scrolling
    initializeSmoothScrolling();
}

// Initialize event listeners
function initializeEventListeners() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('[onclick="toggleMobileMenu()"]');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }

    // Category buttons
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            categoryBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            // Filter products
            const category = this.dataset.category;
            filterProductsByCategory(category);
        });
    });

    // Search functionality
    const searchInput = document.querySelector('input[placeholder="Search crafts..."]');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchProducts(this.value);
            }, 300);
        });
    }

    // Load more button
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreProducts);
    }
}

// Toggle mobile menu
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
}

// Toggle user dropdown
function toggleUserDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('hidden');
}

// Smooth scrolling
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Scroll to marketplace
function scrollToMarketplace() {
    const marketplace = document.getElementById('marketplace');
    if (marketplace) {
        marketplace.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Load featured products
async function loadFeaturedProducts() {
    try {
        showLoading('products-grid');
        const response = await api.get('/products?featured=true&limit=12');
        
        if (response.success) {
            renderProducts(response.data.products);
        } else {
            showError('Failed to load products');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showMockProducts(); // Show mock data for demo
    } finally {
        hideLoading('products-grid');
    }
}

// Load featured artisans
async function loadFeaturedArtisans() {
    try {
        const response = await api.get('/artisans?verified=true&limit=6');
        
        if (response.success) {
            renderArtisans(response.data.artisans);
        } else {
            showError('Failed to load artisans');
        }
    } catch (error) {
        console.error('Error loading artisans:', error);
        showMockArtisans(); // Show mock data for demo
    }
}

// Render products in the grid
function renderProducts(products) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        grid.appendChild(productCard);
    });
}

// Create product card element
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const imageUrl = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400';
    const price = product.pricing?.basePrice || Math.floor(Math.random() * 5000) + 500;
    const rating = product.stats?.averageRating || (Math.random() * 2 + 3).toFixed(1);
    
    card.innerHTML = `
        <div class="image-container">
            <img src="${imageUrl}" alt="${product.title}" class="w-full h-48 object-cover">
            <div class="overlay">
                <button onclick="toggleWishlist('${product._id || product.id}')" 
                        class="bg-white/80 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all">
                    <i class="far fa-heart"></i>
                </button>
            </div>
        </div>
        <div class="p-4">
            <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">${product.title}</h3>
            <p class="text-sm text-gray-600 mb-2 line-clamp-2">${product.shortDescription || product.description || 'Beautiful handcrafted item'}</p>
            <div class="flex items-center justify-between mb-3">
                <span class="text-lg font-bold text-brand-600">₹${price.toLocaleString()}</span>
                <div class="flex items-center text-sm text-gray-500">
                    <i class="fas fa-star text-yellow-400 mr-1"></i>
                    <span>${rating}</span>
                </div>
            </div>
            <div class="flex items-center justify-between">
                <div class="text-xs text-gray-500">
                    <i class="fas fa-map-marker-alt mr-1"></i>
                    ${product.artisan?.location?.city || 'India'}
                </div>
                <button onclick="viewProduct('${product._id || product.id}')" 
                        class="text-brand-600 hover:text-brand-700 text-sm font-medium">
                    View Details
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Render artisans
function renderArtisans(artisans) {
    const grid = document.getElementById('artisans-grid');
    grid.innerHTML = '';
    
    artisans.forEach(artisan => {
        const artisanCard = createArtisanCard(artisan);
        grid.appendChild(artisanCard);
    });
}

// Create artisan card element
function createArtisanCard(artisan) {
    const card = document.createElement('div');
    card.className = 'artisan-card';
    
    const avatar = artisan.user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400';
    const name = artisan.user ? `${artisan.user.firstName} ${artisan.user.lastName}` : artisan.name;
    const specialization = Array.isArray(artisan.specialization) ? artisan.specialization.join(', ') : artisan.specialization;
    const rating = artisan.stats?.rating || (Math.random() * 2 + 3).toFixed(1);
    const products = artisan.stats?.totalProducts || Math.floor(Math.random() * 50) + 5;
    
    card.innerHTML = `
        <img src="${avatar}" alt="${name}" class="avatar">
        <h3 class="font-semibold text-lg text-gray-900 mb-1">${name}</h3>
        <p class="text-craft-600 text-sm mb-2">${artisan.businessName || `${name}'s Workshop`}</p>
        <p class="text-gray-600 text-sm mb-3">${specialization}</p>
        <div class="flex items-center justify-center space-x-4 text-xs text-gray-500 mb-4">
            <div class="flex items-center">
                <i class="fas fa-star text-yellow-400 mr-1"></i>
                <span>${rating}</span>
            </div>
            <div class="flex items-center">
                <i class="fas fa-box mr-1"></i>
                <span>${products} products</span>
            </div>
        </div>
        <div class="flex items-center justify-center space-x-2 text-xs text-gray-500 mb-4">
            <i class="fas fa-map-marker-alt"></i>
            <span>${artisan.location?.city || 'India'}, ${artisan.location?.state || ''}</span>
        </div>
        <button onclick="viewArtisan('${artisan._id || artisan.id}')" 
                class="btn-outline text-sm w-full">
            View Profile
        </button>
    `;
    
    return card;
}

// Filter products by category
function filterProductsByCategory(category) {
    const products = document.querySelectorAll('#products-grid .product-card');
    
    if (category === 'all') {
        products.forEach(product => product.style.display = 'block');
        return;
    }
    
    // For demo purposes, randomly show/hide products
    products.forEach(product => {
        product.style.display = Math.random() > 0.3 ? 'block' : 'none';
    });
}

// Search products
function searchProducts(query) {
    if (!query.trim()) {
        loadFeaturedProducts();
        return;
    }
    
    const products = document.querySelectorAll('#products-grid .product-card');
    products.forEach(product => {
        const title = product.querySelector('h3').textContent.toLowerCase();
        const description = product.querySelector('p').textContent.toLowerCase();
        const searchTerm = query.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}

// Load more products
function loadMoreProducts() {
    const button = document.getElementById('load-more-btn');
    button.textContent = 'Loading...';
    button.disabled = true;
    
    // Simulate loading more products
    setTimeout(() => {
        // Add more mock products
        const grid = document.getElementById('products-grid');
        const mockProducts = generateMockProducts(8);
        
        mockProducts.forEach(product => {
            const card = createProductCard(product);
            grid.appendChild(card);
        });
        
        button.textContent = 'Load More Products';
        button.disabled = false;
    }, 1000);
}

// View product details
function viewProduct(productId) {
    // For demo, show alert - in production, navigate to product page
    showNotification('Opening product details...', 'info');
    setTimeout(() => {
        showProductModal(productId);
    }, 500);
}

// View artisan profile
function viewArtisan(artisanId) {
    // For demo, show alert - in production, navigate to artisan page
    showNotification('Opening artisan profile...', 'info');
    setTimeout(() => {
        showArtisanModal(artisanId);
    }, 500);
}

// Toggle wishlist
function toggleWishlist(productId) {
    const button = event.target.closest('button');
    const icon = button.querySelector('i');
    
    if (icon.classList.contains('far')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        icon.style.color = '#ef4444';
        showNotification('Added to wishlist!', 'success');
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        icon.style.color = '';
        showNotification('Removed from wishlist!', 'info');
    }
}

// Show/hide loading
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    const spinner = document.getElementById('loading-spinner');
    
    if (element) element.style.display = 'none';
    if (spinner) spinner.classList.remove('hidden');
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    const spinner = document.getElementById('loading-spinner');
    
    if (element) element.style.display = 'grid';
    if (spinner) spinner.classList.add('hidden');
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <div class="flex-shrink-0">
                ${getNotificationIcon(type)}
            </div>
            <div class="ml-3">
                <p class="text-sm text-gray-700">${message}</p>
            </div>
            <div class="ml-auto">
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        success: '<i class="fas fa-check-circle text-green-500"></i>',
        error: '<i class="fas fa-exclamation-circle text-red-500"></i>',
        warning: '<i class="fas fa-exclamation-triangle text-yellow-500"></i>',
        info: '<i class="fas fa-info-circle text-blue-500"></i>'
    };
    return icons[type] || icons.info;
}

// Mock data generators for demo
function showMockProducts() {
    const mockProducts = generateMockProducts(12);
    renderProducts(mockProducts);
}

function showMockArtisans() {
    const mockArtisans = generateMockArtisans(6);
    renderArtisans(mockArtisans);
}

function generateMockProducts(count) {
    const products = [];
    const titles = [
        'Handwoven Silk Saree', 'Terracotta Vase', 'Brass Lamp', 'Wooden Sculpture',
        'Silver Jewelry Set', 'Cotton Dhurrie', 'Ceramic Bowl', 'Leather Bag',
        'Bamboo Basket', 'Stone Carving', 'Metal Wall Art', 'Fabric Cushions'
    ];
    const descriptions = [
        'Beautiful handcrafted piece with traditional techniques',
        'Exquisite artistry from local craftsperson',
        'Unique design reflecting cultural heritage',
        'Premium quality handmade item'
    ];
    const categories = ['Pottery', 'Textiles', 'Jewelry', 'Woodwork', 'Metalwork'];
    
    for (let i = 0; i < count; i++) {
        products.push({
            id: `mock-${i}`,
            title: titles[Math.floor(Math.random() * titles.length)],
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            images: [{ url: `https://images.unsplash.com/photo-${1578662996442 + i}?w=400` }],
            pricing: { basePrice: Math.floor(Math.random() * 5000) + 500 },
            stats: { averageRating: (Math.random() * 2 + 3).toFixed(1) },
            artisan: { location: { city: 'Mumbai' } }
        });
    }
    
    return products;
}

function generateMockArtisans(count) {
    const artisans = [];
    const names = [
        'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sunita Devi',
        'Manoj Singh', 'Kavitha Reddy', 'Suresh Gupta', 'Meera Joshi'
    ];
    const specializations = ['Pottery', 'Textiles', 'Jewelry', 'Woodwork', 'Metalwork'];
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Jaipur'];
    
    for (let i = 0; i < count; i++) {
        const name = names[Math.floor(Math.random() * names.length)];
        artisans.push({
            id: `artisan-${i}`,
            name: name,
            businessName: `${name}'s Workshop`,
            specialization: specializations[Math.floor(Math.random() * specializations.length)],
            location: { 
                city: cities[Math.floor(Math.random() * cities.length)],
                state: 'India'
            },
            stats: { 
                rating: (Math.random() * 2 + 3).toFixed(1),
                totalProducts: Math.floor(Math.random() * 50) + 5
            },
            user: {
                firstName: name.split(' ')[0],
                lastName: name.split(' ')[1],
                avatar: `https://images.unsplash.com/photo-${1472099645785 + i}?w=400`
            }
        });
    }
    
    return artisans;
}

// Error handling
function showError(message) {
    showNotification(message, 'error');
}

// Product modal
function showProductModal(productId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content max-w-4xl">
            <div class="flex justify-between items-center p-6 border-b">
                <h2 class="text-2xl font-bold text-gray-900">Product Details</h2>
                <button onclick="this.closest('.modal').remove()" 
                        class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <div class="p-6">
                <div class="grid md:grid-cols-2 gap-8">
                    <div>
                        <img src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500" 
                             alt="Product" class="w-full rounded-lg">
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-4">Handwoven Silk Saree</h3>
                        <p class="text-gray-600 mb-6">This exquisite handwoven silk saree represents generations of traditional craftsmanship. Each thread is carefully selected and woven using ancient techniques passed down through artisan families.</p>
                        <div class="mb-6">
                            <span class="text-3xl font-bold text-brand-600">₹2,499</span>
                            <span class="text-lg text-gray-500 line-through ml-2">₹3,499</span>
                        </div>
                        <div class="flex items-center mb-6">
                            <div class="stars mr-2">
                                <i class="fas fa-star star filled"></i>
                                <i class="fas fa-star star filled"></i>
                                <i class="fas fa-star star filled"></i>
                                <i class="fas fa-star star filled"></i>
                                <i class="far fa-star star"></i>
                            </div>
                            <span class="text-sm text-gray-500">(24 reviews)</span>
                        </div>
                        <div class="space-y-4 mb-6">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Artisan:</span>
                                <span class="font-medium">Priya Sharma</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Location:</span>
                                <span class="font-medium">Varanasi, UP</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Material:</span>
                                <span class="font-medium">Pure Silk</span>
                            </div>
                        </div>
                        <div class="flex space-x-4">
                            <button class="btn-primary flex-1">Add to Cart</button>
                            <button class="btn-outline">
                                <i class="far fa-heart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Artisan modal
function showArtisanModal(artisanId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content max-w-2xl">
            <div class="flex justify-between items-center p-6 border-b">
                <h2 class="text-2xl font-bold text-gray-900">Artisan Profile</h2>
                <button onclick="this.closest('.modal').remove()" 
                        class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <div class="p-6">
                <div class="text-center mb-6">
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150" 
                         alt="Artisan" class="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-craft-200">
                    <h3 class="text-xl font-bold text-gray-900">Rajesh Kumar</h3>
                    <p class="text-craft-600">Master Potter</p>
                    <p class="text-gray-500">Jaipur, Rajasthan</p>
                </div>
                <div class="grid grid-cols-3 gap-4 mb-6 text-center">
                    <div>
                        <div class="text-2xl font-bold text-brand-600">4.8</div>
                        <div class="text-sm text-gray-500">Rating</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-brand-600">127</div>
                        <div class="text-sm text-gray-500">Products</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-brand-600">15+</div>
                        <div class="text-sm text-gray-500">Years</div>
                    </div>
                </div>
                <p class="text-gray-600 mb-6">Rajesh is a master potter from Jaipur who has been practicing the ancient art of pottery for over 15 years. His work combines traditional Rajasthani techniques with contemporary designs.</p>
                <div class="flex space-x-4">
                    <button class="btn-primary flex-1">View Products</button>
                    <button class="btn-outline">Follow</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}