// API utility functions for ArtisanAI platform

const API_BASE_URL = 'http://localhost:5000/api';

class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('authToken');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    // Get authentication token
    getToken() {
        return this.token || localStorage.getItem('authToken');
    }

    // Get headers with authentication
    getHeaders(includeContentType = true) {
        const headers = {};
        
        if (includeContentType) {
            headers['Content-Type'] = 'application/json';
        }
        
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(!options.isFormData),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return {
                success: true,
                data: data,
                status: response.status
            };
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            return {
                success: false,
                error: error.message,
                status: error.status || 500
            };
        }
    }

    // HTTP Methods
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Upload file with form data
    async upload(endpoint, formData) {
        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            isFormData: true
        });
    }

    // Authentication endpoints
    async login(email, password) {
        return this.post('/auth/login', { email, password });
    }

    async register(userData) {
        return this.post('/auth/register', userData);
    }

    async logout() {
        const result = await this.post('/auth/logout', {});
        this.setToken(null);
        return result;
    }

    async getProfile() {
        return this.get('/auth/profile');
    }

    async updateProfile(userData) {
        return this.put('/auth/profile', userData);
    }

    async changePassword(currentPassword, newPassword) {
        return this.put('/auth/change-password', { currentPassword, newPassword });
    }

    async verifyToken() {
        return this.get('/auth/verify');
    }

    // Product endpoints
    async getProducts(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return this.get(`/products${queryParams ? '?' + queryParams : ''}`);
    }

    async getProduct(productId) {
        return this.get(`/products/${productId}`);
    }

    async createProduct(productData) {
        return this.post('/products', productData);
    }

    async updateProduct(productId, productData) {
        return this.put(`/products/${productId}`, productData);
    }

    async deleteProduct(productId) {
        return this.delete(`/products/${productId}`);
    }

    async uploadProductImages(productId, formData) {
        return this.upload(`/products/${productId}`, formData);
    }

    async addProductReview(productId, rating, comment) {
        return this.post(`/products/${productId}/reviews`, { rating, comment });
    }

    async getFeaturedProducts() {
        return this.get('/products/featured/list');
    }

    async getProductCategories() {
        return this.get('/products/categories/list');
    }

    // Artisan endpoints
    async getArtisans(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return this.get(`/artisans${queryParams ? '?' + queryParams : ''}`);
    }

    async getArtisan(artisanId) {
        return this.get(`/artisans/${artisanId}`);
    }

    async updateArtisanProfile(profileData) {
        return this.put('/artisans/profile', profileData);
    }

    async getMyProducts(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return this.get(`/artisans/my/products${queryParams ? '?' + queryParams : ''}`);
    }

    async getDashboard() {
        return this.get('/artisans/my/dashboard');
    }

    async searchArtisans(query, limit = 10) {
        return this.get(`/artisans/search/${encodeURIComponent(query)}?limit=${limit}`);
    }

    // AI endpoints
    async analyzeProduct(formData) {
        return this.upload('/ai/analyze-product', formData);
    }

    async generateStory(storyData) {
        return this.post('/ai/generate-story', storyData);
    }

    async speechToText(audioFormData) {
        return this.upload('/ai/speech-to-text', audioFormData);
    }

    // Utility methods
    async healthCheck() {
        return this.get('/health');
    }

    // Handle network errors and retry logic
    async retryRequest(requestFn, maxRetries = 3) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                const result = await requestFn();
                if (result.success) {
                    return result;
                }
                lastError = result;
            } catch (error) {
                lastError = { success: false, error: error.message };
                
                // Wait before retrying (exponential backoff)
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                }
            }
        }
        
        return lastError;
    }
}

// Create global API instance
const api = new ApiClient();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { api, ApiClient };
}

// Add request interceptor for handling common errors
const originalRequest = api.request.bind(api);
api.request = async function(endpoint, options = {}) {
    const result = await originalRequest(endpoint, options);
    
    // Handle token expiration
    if (result.status === 401 && result.error && result.error.includes('token')) {
        // Clear expired token
        this.setToken(null);
        
        // Redirect to login if not already on login page
        if (!window.location.pathname.includes('login')) {
            showNotification('Session expired. Please login again.', 'warning');
            setTimeout(() => {
                showLoginModal();
            }, 1000);
        }
    }
    
    // Handle server errors
    if (result.status >= 500) {
        showNotification('Server error. Please try again later.', 'error');
    }
    
    return result;
};

// Network status monitoring
let isOnline = navigator.onLine;

window.addEventListener('online', () => {
    if (!isOnline) {
        showNotification('Connection restored!', 'success');
        isOnline = true;
    }
});

window.addEventListener('offline', () => {
    showNotification('Connection lost. Some features may not work.', 'warning');
    isOnline = false;
});

// Add API status indicator
function addApiStatusIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'api-status';
    indicator.className = 'fixed bottom-4 left-4 px-3 py-1 rounded-full text-xs font-medium z-50';
    indicator.innerHTML = '<i class="fas fa-circle mr-1"></i> API';
    document.body.appendChild(indicator);
    
    // Check API health periodically
    setInterval(async () => {
        try {
            const result = await api.healthCheck();
            if (result.success) {
                indicator.className = indicator.className.replace(/bg-\w+-\d+/, 'bg-green-500');
                indicator.className = indicator.className.replace(/text-\w+-\d+/, 'text-white');
            } else {
                indicator.className = indicator.className.replace(/bg-\w+-\d+/, 'bg-red-500');
                indicator.className = indicator.className.replace(/text-\w+-\d+/, 'text-white');
            }
        } catch (error) {
            indicator.className = indicator.className.replace(/bg-\w+-\d+/, 'bg-red-500');
            indicator.className = indicator.className.replace(/text-\w+-\d+/, 'text-white');
        }
    }, 30000); // Check every 30 seconds
}

// Initialize API status indicator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // addApiStatusIndicator(); // Uncomment for debugging
});