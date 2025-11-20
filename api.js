// API Service Module - Handles all backend API calls
const API_BASE_URL = 'https://backend-huyf.onrender.com/api';

// Helper function to get auth token
function getAuthToken() {
  return localStorage.getItem('authToken');
}

// Helper function to get session ID
function getSessionId() {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Auth API
export const authAPI = {
  async register(name, email, password, role = 'User', skipAutoLogin = false) {
    const data = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    // Only auto-login if not skipping (i.e., when admin creates user, skip auto-login)
    if (data.token && !skipAutoLogin) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },
  
  async login(email, password) {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },
  
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
  
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  isAuthenticated() {
    return !!getAuthToken();
  },
  
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'Admin';
  }
};

// Products API
export const productsAPI = {
  async getAll(category = null, search = null) {
    let endpoint = '/products';
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    if (params.toString()) endpoint += '?' + params.toString();
    
    return await apiCall(endpoint);
  },
  
  async getById(id) {
    return await apiCall(`/products/${id}`);
  },
  
  async create(productData, imageFile = null) {
    const formData = new FormData();
    Object.keys(productData).forEach(key => {
      formData.append(key, productData[key]);
    });
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to create product');
    }
    
    return await response.json();
  },
  
  async update(id, productData, imageFile = null) {
    const formData = new FormData();
    Object.keys(productData).forEach(key => {
      formData.append(key, productData[key]);
    });
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to update product');
    }
    
    return await response.json();
  },
  
  async delete(id) {
    return await apiCall(`/products/${id}`, {
      method: 'DELETE',
    });
  }
};

// Cart API
export const cartAPI = {
  async getCart() {
    const sessionId = getSessionId();
    return await apiCall(`/cart/${sessionId}`);
  },
  
  async addItem(productId, quantity = 1) {
    const sessionId = getSessionId();
    return await apiCall(`/cart/${sessionId}/items`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  },
  
  async updateItem(itemId, quantity) {
    const sessionId = getSessionId();
    return await apiCall(`/cart/${sessionId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },
  
  async removeItem(itemId) {
    const sessionId = getSessionId();
    return await apiCall(`/cart/${sessionId}/items/${itemId}`, {
      method: 'DELETE',
    });
  },
  
  async clearCart() {
    const sessionId = getSessionId();
    return await apiCall(`/cart/${sessionId}`, {
      method: 'DELETE',
    });
  }
};

// Orders API
export const ordersAPI = {
  async create(customerName, customerEmail) {
    const sessionId = getSessionId();
    return await apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify({ customerName, customerEmail, sessionId }),
    });
  },
  
  async getAll() {
    return await apiCall('/orders');
  },
  
  async getById(id) {
    return await apiCall(`/orders/${id}`);
  },
  
  async getByCustomerEmail(email) {
    return await apiCall(`/orders/customer/${encodeURIComponent(email)}`);
  },
  
  async updateStatus(id, status) {
    return await apiCall(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }
};

