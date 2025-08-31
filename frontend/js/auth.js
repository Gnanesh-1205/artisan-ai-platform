// Authentication functions for ArtisanAI platform

let currentUser = null;

// Check authentication status on page load
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (token) {
        verifyToken(token);
    } else {
        updateUIForLoggedOut();
    }
}

// Verify token with backend
async function verifyToken(token) {
    api.setToken(token);
    
    try {
        const result = await api.verifyToken();
        if (result.success) {
            currentUser = result.data.user;
            updateUIForLoggedIn(currentUser);
            loadUserProfile();
        } else {
            // Invalid token
            localStorage.removeItem('authToken');
            api.setToken(null);
            updateUIForLoggedOut();
        }
    } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('authToken');
        api.setToken(null);
        updateUIForLoggedOut();
    }
}

// Load full user profile
async function loadUserProfile() {
    try {
        const result = await api.getProfile();
        if (result.success) {
            currentUser = result.data.user;
            // Store artisan profile if user is artisan
            if (result.data.artisan) {
                localStorage.setItem('artisanProfile', JSON.stringify(result.data.artisan));
            }
        }
    } catch (error) {
        console.error('Failed to load user profile:', error);
    }
}

// Update UI for logged-in state
function updateUIForLoggedIn(user) {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');
    
    if (authButtons) authButtons.classList.add('hidden');
    if (userMenu) userMenu.classList.remove('hidden');
    if (userName) userName.textContent = `${user.firstName} ${user.lastName}`;
    
    // Update user avatar if available
    const userAvatar = userMenu?.querySelector('img');
    if (userAvatar && user.avatar) {
        userAvatar.src = user.avatar;
    }
    
    // Show artisan-specific UI elements
    if (user.role === 'artisan') {
        showArtisanUI();
    }
}

// Update UI for logged-out state
function updateUIForLoggedOut() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    
    if (authButtons) authButtons.classList.remove('hidden');
    if (userMenu) userMenu.classList.add('hidden');
    
    hideArtisanUI();
}

// Show artisan-specific UI elements
function showArtisanUI() {
    // Add "Add Product" button or similar artisan features
    const existingFab = document.querySelector('.fab');
    if (!existingFab) {
        const fab = document.createElement('button');
        fab.className = 'fab';
        fab.innerHTML = '<i class="fas fa-plus"></i>';
        fab.title = 'Add New Product';
        fab.onclick = () => showAddProductModal();
        document.body.appendChild(fab);
    }
}

// Hide artisan-specific UI elements
function hideArtisanUI() {
    const fab = document.querySelector('.fab');
    if (fab) {
        fab.remove();
    }
}

// Show login modal
function showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="flex justify-between items-center p-6 border-b">
                <h2 class="text-2xl font-bold text-gray-900">Sign In</h2>
                <button onclick="this.closest('.modal').remove()" 
                        class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <form id="login-form" class="p-6">
                <div class="form-group">
                    <label class="form-label">Email Address</label>
                    <input type="email" name="email" class="form-input" required 
                           placeholder="Enter your email">
                </div>
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" name="password" class="form-input" required 
                           placeholder="Enter your password">
                </div>
                <div class="flex items-center justify-between mb-6">
                    <label class="flex items-center">
                        <input type="checkbox" name="remember" class="mr-2">
                        <span class="text-sm text-gray-600">Remember me</span>
                    </label>
                    <a href="#" class="text-sm text-brand-600 hover:text-brand-700">
                        Forgot password?
                    </a>
                </div>
                <button type="submit" class="btn-primary w-full mb-4">
                    Sign In
                </button>
                <div class="text-center">
                    <span class="text-sm text-gray-600">Don't have an account? </span>
                    <button type="button" onclick="showRegisterModal(); this.closest('.modal').remove();" 
                            class="text-sm text-brand-600 hover:text-brand-700 font-medium">
                        Sign up here
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    const form = document.getElementById('login-form');
    form.addEventListener('submit', handleLogin);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Focus on email input
    const emailInput = form.querySelector('input[name="email"]');
    setTimeout(() => emailInput.focus(), 100);
}

// Show registration modal
function showRegisterModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content max-w-lg">
            <div class="flex justify-between items-center p-6 border-b">
                <h2 class="text-2xl font-bold text-gray-900">Join ArtisanAI</h2>
                <button onclick="this.closest('.modal').remove()" 
                        class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <form id="register-form" class="p-6">
                <div class="grid md:grid-cols-2 gap-4">
                    <div class="form-group">
                        <label class="form-label">First Name</label>
                        <input type="text" name="firstName" class="form-input" required 
                               placeholder="Enter first name">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Last Name</label>
                        <input type="text" name="lastName" class="form-input" required 
                               placeholder="Enter last name">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Email Address</label>
                    <input type="email" name="email" class="form-input" required 
                           placeholder="Enter your email">
                </div>
                <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <input type="tel" name="phone" class="form-input" 
                           placeholder="Enter your phone number">
                </div>
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" name="password" class="form-input" required 
                           placeholder="Create a password (min 6 characters)" minlength="6">
                </div>
                <div class="form-group">
                    <label class="form-label">Confirm Password</label>
                    <input type="password" name="confirmPassword" class="form-input" required 
                           placeholder="Confirm your password">
                </div>
                <div class="form-group">
                    <label class="form-label">I want to join as:</label>
                    <select name="role" class="form-select" required>
                        <option value="">Select your role</option>
                        <option value="customer">Customer (Buy crafts)</option>
                        <option value="artisan">Artisan (Sell crafts)</option>
                    </select>
                </div>
                <div class="flex items-start mb-6">
                    <input type="checkbox" name="terms" class="mr-3 mt-1" required>
                    <span class="text-sm text-gray-600">
                        I agree to the <a href="#" class="text-brand-600 hover:text-brand-700">Terms of Service</a> 
                        and <a href="#" class="text-brand-600 hover:text-brand-700">Privacy Policy</a>
                    </span>
                </div>
                <button type="submit" class="btn-primary w-full mb-4">
                    Create Account
                </button>
                <div class="text-center">
                    <span class="text-sm text-gray-600">Already have an account? </span>
                    <button type="button" onclick="showLoginModal(); this.closest('.modal').remove();" 
                            class="text-sm text-brand-600 hover:text-brand-700 font-medium">
                        Sign in here
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    const form = document.getElementById('register-form');
    form.addEventListener('submit', handleRegistration);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Focus on first name input
    const firstNameInput = form.querySelector('input[name="firstName"]');
    setTimeout(() => firstNameInput.focus(), 100);
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing In...';
    
    try {
        const result = await api.login(loginData.email, loginData.password);
        
        if (result.success) {
            // Store token and user data
            api.setToken(result.data.token);
            currentUser = result.data.user;
            
            // Store artisan profile if available
            if (result.data.artisan) {
                localStorage.setItem('artisanProfile', JSON.stringify(result.data.artisan));
            }
            
            // Update UI
            updateUIForLoggedIn(currentUser);
            
            // Close modal
            form.closest('.modal').remove();
            
            // Show success message
            showNotification('Welcome back!', 'success');
            
            // Redirect artisans to dashboard
            if (currentUser.role === 'artisan') {
                setTimeout(() => showArtisanDashboard(), 1000);
            }
        } else {
            showNotification(result.error || 'Login failed', 'error');
        }
    } catch (error) {
        showNotification('Login failed. Please try again.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Sign In';
    }
}

// Handle registration form submission
async function handleRegistration(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    
    // Validate password confirmation
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    const registrationData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: password,
        role: formData.get('role')
    };
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating Account...';
    
    try {
        const result = await api.register(registrationData);
        
        if (result.success) {
            // Store token and user data
            api.setToken(result.data.token);
            currentUser = result.data.user;
            
            // Update UI
            updateUIForLoggedIn(currentUser);
            
            // Close modal
            form.closest('.modal').remove();
            
            // Show success message
            showNotification(`Welcome to ArtisanAI, ${currentUser.firstName}!`, 'success');
            
            // Show onboarding for artisans
            if (currentUser.role === 'artisan') {
                setTimeout(() => showArtisanOnboarding(), 1000);
            }
        } else {
            showNotification(result.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showNotification('Registration failed. Please try again.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Create Account';
    }
}

// Logout function
async function logout() {
    try {
        await api.logout();
        
        // Clear local storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('artisanProfile');
        
        // Reset API token
        api.setToken(null);
        
        // Reset current user
        currentUser = null;
        
        // Update UI
        updateUIForLoggedOut();
        
        // Show success message
        showNotification('Logged out successfully', 'success');
        
        // Redirect to home if on protected pages
        if (window.location.pathname.includes('dashboard')) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed', 'error');
    }
}

// Show artisan onboarding
function showArtisanOnboarding() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content max-w-2xl">
            <div class="p-8 text-center">
                <div class="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-palette text-brand-600 text-2xl"></i>
                </div>
                <h2 class="text-3xl font-bold text-gray-900 mb-4">Welcome to ArtisanAI!</h2>
                <p class="text-lg text-gray-600 mb-8">
                    You're now part of a community that celebrates traditional craftsmanship. 
                    Let's set up your artisan profile to help customers discover your amazing work.
                </p>
                <div class="grid md:grid-cols-3 gap-6 mb-8">
                    <div class="text-center">
                        <div class="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <i class="fas fa-user-edit text-brand-600"></i>
                        </div>
                        <h3 class="font-semibold text-gray-900 mb-1">Complete Profile</h3>
                        <p class="text-sm text-gray-600">Add your craft specialization and story</p>
                    </div>
                    <div class="text-center">
                        <div class="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <i class="fas fa-camera text-brand-600"></i>
                        </div>
                        <h3 class="font-semibold text-gray-900 mb-1">Upload Products</h3>
                        <p class="text-sm text-gray-600">Use AI to create compelling descriptions</p>
                    </div>
                    <div class="text-center">
                        <div class="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <i class="fas fa-rocket text-brand-600"></i>
                        </div>
                        <h3 class="font-semibold text-gray-900 mb-1">Start Selling</h3>
                        <p class="text-sm text-gray-600">Reach customers worldwide</p>
                    </div>
                </div>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onclick="showProfileSetup(); this.closest('.modal').remove();" 
                            class="btn-primary">
                        Complete Profile Setup
                    </button>
                    <button onclick="this.closest('.modal').remove();" 
                            class="btn-secondary">
                        Skip for Now
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Show profile setup modal
function showProfileSetup() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content max-w-2xl">
            <div class="flex justify-between items-center p-6 border-b">
                <h2 class="text-2xl font-bold text-gray-900">Complete Your Artisan Profile</h2>
                <button onclick="this.closest('.modal').remove()" 
                        class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <form id="profile-setup-form" class="p-6">
                <div class="grid md:grid-cols-2 gap-6">
                    <div class="form-group">
                        <label class="form-label">Business/Workshop Name</label>
                        <input type="text" name="businessName" class="form-input" required 
                               placeholder="e.g., Kumar's Pottery Workshop">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Years of Experience</label>
                        <input type="number" name="experience" class="form-input" required min="0" 
                               placeholder="e.g., 5">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Craft Specialization</label>
                    <select name="specialization" class="form-select" required>
                        <option value="">Select your primary craft</option>
                        <option value="Pottery">Pottery & Ceramics</option>
                        <option value="Textiles">Textiles & Fabrics</option>
                        <option value="Jewelry">Jewelry & Accessories</option>
                        <option value="Woodwork">Woodwork & Furniture</option>
                        <option value="Metalwork">Metalwork</option>
                        <option value="Leather">Leather Goods</option>
                        <option value="Painting">Art & Paintings</option>
                        <option value="Sculpture">Sculptures</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Tell Your Story</label>
                    <textarea name="bio" class="form-textarea" rows="4" 
                              placeholder="Share your journey as an artisan, your inspiration, and what makes your craft special..."></textarea>
                </div>
                <div class="grid md:grid-cols-2 gap-6">
                    <div class="form-group">
                        <label class="form-label">City</label>
                        <input type="text" name="city" class="form-input" required 
                               placeholder="e.g., Mumbai">
                    </div>
                    <div class="form-group">
                        <label class="form-label">State</label>
                        <input type="text" name="state" class="form-input" required 
                               placeholder="e.g., Maharashtra">
                    </div>
                </div>
                <button type="submit" class="btn-primary w-full">
                    Complete Profile
                </button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    const form = document.getElementById('profile-setup-form');
    form.addEventListener('submit', handleProfileSetup);
}

// Handle profile setup
async function handleProfileSetup(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    
    const profileData = {
        businessName: formData.get('businessName'),
        experience: parseInt(formData.get('experience')),
        specialization: [formData.get('specialization')],
        bio: formData.get('bio'),
        location: {
            city: formData.get('city'),
            state: formData.get('state'),
            country: 'India'
        }
    };
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving Profile...';
    
    try {
        const result = await api.updateArtisanProfile(profileData);
        
        if (result.success) {
            // Update stored artisan profile
            localStorage.setItem('artisanProfile', JSON.stringify(result.data.artisan));
            
            // Close modal
            form.closest('.modal').remove();
            
            // Show success message
            showNotification('Profile setup completed successfully!', 'success');
            
            // Show dashboard
            setTimeout(() => showArtisanDashboard(), 1000);
        } else {
            showNotification(result.error || 'Profile setup failed', 'error');
        }
    } catch (error) {
        showNotification('Profile setup failed. Please try again.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Complete Profile';
    }
}

// Show artisan dashboard
function showArtisanDashboard() {
    // For now, show a simple notification
    // In a full implementation, this would navigate to a dedicated dashboard page
    showNotification('Dashboard coming soon! Start by adding your first product.', 'info');
    setTimeout(() => showAddProductModal(), 2000);
}

// Show add product modal (will be implemented in marketplace.js)
function showAddProductModal() {
    if (typeof showProductUploadModal === 'function') {
        showProductUploadModal();
    } else {
        showNotification('Product upload feature will be available soon!', 'info');
    }
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Check if user is logged in
function isLoggedIn() {
    return currentUser !== null && localStorage.getItem('authToken') !== null;
}

// Check if user is artisan
function isArtisan() {
    return currentUser && currentUser.role === 'artisan';
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getCurrentUser,
        isLoggedIn,
        isArtisan,
        showLoginModal,
        showRegisterModal,
        logout
    };
}