// Import API module
import { authAPI, productsAPI, cartAPI, ordersAPI } from './api.js';

/* ------------------------- DOM References & State ------------------------- */
const productListEl = document.getElementById("product-list");
const featuredListEl = document.getElementById("featured-list");
const cartListEl = document.getElementById("cart");
const totalEl = document.getElementById("total");
const cartCountEl = document.getElementById("cart-count");
const checkoutFormEl = document.getElementById("checkout-form");
const confirmCheckoutBtn = document.getElementById("confirm-checkout");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const greetingEl = document.getElementById("greeting");
const ordersListEl = document.getElementById("orders-list");
const adminProductsListEl = document.getElementById("admin-products-list");
const adminOrdersListEl = document.getElementById("admin-orders-list");
const adminNavLink = document.getElementById("admin-nav-link");
const ordersNavLink = document.getElementById("orders-nav-link");

let products = [];
let cart = null;
let loading = false;
let currentSort = "featured";

/* ------------------------- Utility Functions ------------------------- */
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <span>${message}</span>
      <button type="button" class="btn-close btn-close-white ms-3" onclick="this.parentElement.parentElement.remove()"></button>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Auto remove after duration
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function showError(message) {
  showToast(message, 'error', 4000);
}

function showSuccess(message) {
  showToast(message, 'success', 4000);
}

function createConfetti() {
  const container = document.getElementById('confetti-container');
  if (!container) return;
  
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe'];
  const confettiCount = 50;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.top = '-10px';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.width = Math.random() * 10 + 5 + 'px';
    confetti.style.height = confetti.style.width;
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
    
    container.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 3000);
  }
}

function showWelcomeBanner(user, isNewUser = false) {
  const mainContainer = document.querySelector('main.container');
  if (!mainContainer) return;
  
  // Remove existing banner if any
  const existingBanner = document.getElementById('welcome-banner');
  if (existingBanner) existingBanner.remove();
  
  const banner = document.createElement('div');
  banner.id = 'welcome-banner';
  banner.className = 'welcome-banner success-animation';
  
  if (isNewUser) {
    banner.innerHTML = `
      <h3>🎉 Welcome to Hans Shop, ${user.name}! 🎉</h3>
      <p>Your account has been created successfully. Start shopping now!</p>
    `;
  } else {
    banner.innerHTML = `
      <h3>👋 Welcome back, ${user.name}! 👋</h3>
      <p>Great to see you again. Happy shopping!</p>
    `;
  }
  
  mainContainer.insertBefore(banner, mainContainer.firstChild);
  
  // Remove banner after 5 seconds
  setTimeout(() => {
    banner.style.animation = 'fadeOut 0.5s ease-out';
    setTimeout(() => banner.remove(), 500);
  }, 5000);
}

function formatPrice(price) {
  return `₱${parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getImageUrl(product) {
  if (product.image && product.image.startsWith('http')) {
    return product.image;
  }
  if (product.image) {
    return `http://localhost:5000${product.image}`;
  }
  return 'https://via.placeholder.com/300x300?text=No+Image';
}

function getSortedProducts(list = []) {
  const sorted = [...list];
  switch (currentSort) {
    case "price-asc":
      return sorted.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    case "price-desc":
      return sorted.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
    case "stock-desc":
      return sorted.sort((a, b) => (b.stock || 0) - (a.stock || 0));
    default:
      return sorted;
  }
}

/* ------------------------- Authentication ------------------------- */
let loginModal, registerModal, productFormModal;

document.addEventListener("DOMContentLoaded", async () => {
  const loginModalEl = document.getElementById("loginModal");
  const registerModalEl = document.getElementById("registerModal");
  const productFormModalEl = document.getElementById("productFormModal");
  
  if (loginModalEl) loginModal = new bootstrap.Modal(loginModalEl);
  if (registerModalEl) registerModal = new bootstrap.Modal(registerModalEl);
  if (productFormModalEl) productFormModal = new bootstrap.Modal(productFormModalEl);
  
  updateAuthUI();
  await loadInitialData();
});

function updateAuthUI() {
  const user = authAPI.getCurrentUser();
  const isAdmin = authAPI.isAdmin();
  const aboutNavItem = document.getElementById("about-nav-item");
  const contactNavItem = document.getElementById("contact-nav-item");
  const cartBtn = document.getElementById("cart-btn");
  
  if (user) {
    const roleBadge = isAdmin ? ' <span class="badge bg-danger pulse-animation">Admin</span>' : '';
    greetingEl.innerHTML = `Hi, ${user.name}!${roleBadge}`;
    greetingEl.classList.add("success-animation");
    loginBtn.classList.add("d-none");
    logoutBtn.classList.remove("d-none");
    
    // Show admin/orders nav links
    if (isAdmin) {
      adminNavLink.classList.remove("d-none");
      // Hide About Us, Contact Us, Cart, and Orders for admins
      if (aboutNavItem) aboutNavItem.classList.add("d-none");
      if (contactNavItem) contactNavItem.classList.add("d-none");
      if (cartBtn) cartBtn.classList.add("d-none");
      ordersNavLink.classList.add("d-none");
    } else {
      // Show About Us, Contact Us, Cart, and Orders for regular users
      if (aboutNavItem) aboutNavItem.classList.remove("d-none");
      if (contactNavItem) contactNavItem.classList.remove("d-none");
      if (cartBtn) cartBtn.classList.remove("d-none");
      ordersNavLink.classList.remove("d-none");
    }
  } else {
    greetingEl.textContent = "";
    greetingEl.classList.remove("success-animation");
    loginBtn.classList.remove("d-none");
    logoutBtn.classList.add("d-none");
    adminNavLink.classList.add("d-none");
    ordersNavLink.classList.add("d-none");
    // Show About Us and Contact Us when logged out
    if (aboutNavItem) aboutNavItem.classList.remove("d-none");
    if (contactNavItem) contactNavItem.classList.remove("d-none");
    if (cartBtn) cartBtn.classList.remove("d-none");
  }
  
  // Update registration modal role options
  updateRegistrationModal();
}

loginBtn.addEventListener("click", () => {
  document.getElementById("login-email").value = "";
  document.getElementById("login-password").value = "";
  document.getElementById("login-error")?.classList.add("d-none");
  loginModal?.show();
});

// Update registration modal role help text based on current user
function updateRegistrationModal() {
  const roleHelpText = document.getElementById("role-help-text");
  const isAdmin = authAPI.isAdmin();
  
  if (roleHelpText) {
    if (isAdmin) {
      roleHelpText.textContent = "You can create accounts with any role. Admin accounts have full system access.";
      roleHelpText.className = "text-muted";
    } else {
      roleHelpText.textContent = "Select your account type. Admin accounts require special privileges and can only be created by existing administrators.";
      roleHelpText.className = "text-muted";
    }
  }
}

document.getElementById("show-register")?.addEventListener("click", () => {
  loginModal?.hide();
  // Reset modal title for regular registration
  const modalTitle = document.querySelector("#registerModal .modal-title");
  if (modalTitle) modalTitle.textContent = "Register";
  updateRegistrationModal(); // Update role options before showing
  registerModal?.show();
});

document.getElementById("show-login")?.addEventListener("click", () => {
  registerModal?.hide();
  loginModal?.show();
});

document.getElementById("login-submit")?.addEventListener("click", async () => {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  const errorEl = document.getElementById("login-error");
  
  if (!email || !password) {
    if (errorEl) {
      errorEl.textContent = "Please fill in all fields";
      errorEl.classList.remove("d-none");
    }
    return;
  }
  
  try {
    const result = await authAPI.login(email, password);
    const user = authAPI.getCurrentUser();
    
    // Store email in localStorage for orders
    if (result.user && email) {
      localStorage.setItem('userEmail', email);
    }
    
    // Add animations and effects
    createConfetti();
    showSuccess(`🎉 Login successful! Welcome back, ${user?.name || 'User'}!`);
    
    // Add pulse animation to logout button
    logoutBtn.classList.add("pulse-animation");
    setTimeout(() => logoutBtn.classList.remove("pulse-animation"), 500);
    
    updateAuthUI();
    loginModal?.hide();
    
    // Show welcome banner
    if (user) {
      showWelcomeBanner(user, false);
    }
    
    await loadInitialData();
  } catch (error) {
    if (errorEl) {
      errorEl.textContent = error.message || "Login failed. Please try again.";
      errorEl.classList.remove("d-none");
    } else {
      showError(error.message || "Login failed. Please try again.");
    }
  }
});

document.getElementById("register-submit")?.addEventListener("click", async () => {
  const name = document.getElementById("register-name").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value.trim();
  const roleSelect = document.getElementById("register-role");
  const selectedRole = roleSelect ? roleSelect.value : "User";
  const errorEl = document.getElementById("register-error");
  
  if (!name || !email || !password) {
    if (errorEl) {
      errorEl.textContent = "Please fill in all fields";
      errorEl.classList.remove("d-none");
    }
    return;
  }
  
  if (password.length < 6) {
    if (errorEl) {
      errorEl.textContent = "Password must be at least 6 characters";
      errorEl.classList.remove("d-none");
    }
    return;
  }
  
  // Use the selected role directly - backend will validate
  const role = selectedRole;
  
  try {
    const isAdminCreating = authAPI.isAdmin();
    // Skip auto-login if admin is creating a user
    const result = await authAPI.register(name, email, password, role, isAdminCreating);
    
    // If admin is creating a user, don't log them in as that user
    if (isAdminCreating) {
      // Admin stays logged in as themselves
      registerModal?.hide();
      createConfetti();
      showSuccess(`✅ User "${name}" (${role}) created successfully!`);
      // Reset form
      document.getElementById("register-name").value = "";
      document.getElementById("register-email").value = "";
      document.getElementById("register-password").value = "";
      document.getElementById("register-role").value = "User";
    } else {
      // Regular user registration - log them in
      const user = authAPI.getCurrentUser();
      
      // Store email in localStorage for orders
      if (email) {
        localStorage.setItem('userEmail', email);
      }
      
      // Add animations and effects
      createConfetti();
      showSuccess(`🎉 Registration successful! Welcome to Hans Shop, ${name}!`);
      
      // Add pulse animation to logout button
      logoutBtn.classList.add("pulse-animation");
      setTimeout(() => logoutBtn.classList.remove("pulse-animation"), 500);
      
      updateAuthUI();
      registerModal?.hide();
      
      // Show welcome banner
      if (user) {
        showWelcomeBanner(user, true);
      }
      
      await loadInitialData();
    }
  } catch (error) {
    if (errorEl) {
      errorEl.textContent = error.message || "Registration failed. Please try again.";
      errorEl.classList.remove("d-none");
    } else {
      showError(error.message || "Registration failed. Please try again.");
    }
  }
});

logoutBtn.addEventListener("click", () => {
  // Add fade out animation
  logoutBtn.classList.add("pulse-animation");
  
  setTimeout(() => {
    authAPI.logout();
    updateAuthUI();
    cart = null;
    renderCart();
    showView((location.hash.replace("#", "") || "home"));
    showSuccess("👋 You have been logged out successfully. See you soon!");
  }, 300);
});

/* ------------------------- Products ------------------------- */
async function loadProducts(category = null, search = null) {
  try {
    loading = true;
    products = await productsAPI.getAll(category, search);
    renderProducts(productListEl, getSortedProducts(products));
    renderProducts(featuredListEl, products.slice(0, 8));
  } catch (error) {
    console.error("Error loading products:", error);
    showError("Failed to load products. Please try again later.");
  } finally {
    loading = false;
  }
}

// Search and filter handlers
document.getElementById("product-search")?.addEventListener("input", (e) => {
  const search = e.target.value.trim();
  const category = document.getElementById("product-category-filter")?.value.trim() || null;
  loadProducts(category, search || null);
});

document.getElementById("product-category-filter")?.addEventListener("input", (e) => {
  const category = e.target.value.trim();
  const search = document.getElementById("product-search")?.value.trim() || null;
  loadProducts(category || null, search);
});

document.getElementById("product-sort")?.addEventListener("change", (e) => {
  currentSort = e.target.value;
  renderProducts(productListEl, getSortedProducts(products));
});

document.getElementById("product-reset")?.addEventListener("click", () => {
  const searchEl = document.getElementById("product-search");
  const categoryEl = document.getElementById("product-category-filter");
  const sortEl = document.getElementById("product-sort");

  if (searchEl) searchEl.value = "";
  if (categoryEl) categoryEl.value = "";
  currentSort = "featured";
  if (sortEl) sortEl.value = currentSort;

  loadProducts();
});

function renderProducts(targetEl, list) {
  if (!targetEl) return;
  
	targetEl.innerHTML = "";
  
  if (list.length === 0) {
    targetEl.innerHTML = '<div class="col-12"><p class="text-muted">No products available.</p></div>';
    return;
  }
  
	list.forEach((p) => {
		const col = document.createElement("div");
		col.className = "col-12 col-sm-6 col-md-4 col-lg-3";
    const categoryLabel = p.category || "Featured";
    const isOutOfStock = (p.stock ?? 0) <= 0;
    const description = p.description || "Built to simplify your everyday setup.";
		col.innerHTML = `
			<div class="card h-100 product-card shadow-sm">
        <div class="product-media">
          <img src="${getImageUrl(p)}" class="card-img-top" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'" />
          <span class="product-chip">${categoryLabel}</span>
        </div>
				<div class="card-body d-flex flex-column">
          <p class="eyebrow mb-1">${categoryLabel}</p>
					<h6 class="card-title fw-semibold mb-2">${p.name}</h6>
          <p class="card-text small text-muted flex-grow-1">${description}</p>
					<div class="product-card__footer mt-3">
            <div>
              <p class="product-price mb-0">${formatPrice(p.price)}</p>
              <small class="${isOutOfStock ? 'text-danger' : 'text-muted'}">${isOutOfStock ? 'Out of stock' : `In stock: ${p.stock}`}</small>
            </div>
            <button class="btn btn-primary btn-sm" data-id="${p._id}" ${isOutOfStock ? 'disabled' : ''}>
              ${isOutOfStock ? 'Notify me' : 'Add to cart'}
            </button>
					</div>
				</div>
			</div>
		`;
		targetEl.appendChild(col);
	});
  
  // Attach handlers
	targetEl.querySelectorAll("button[data-id]").forEach((btn) => {
    if (!btn.disabled) {
      btn.addEventListener("click", () => addToCart(btn.dataset.id));
    }
  });
}

/* ------------------------- Cart ------------------------- */
async function loadCart() {
  try {
    cart = await cartAPI.getCart();
    renderCart();
  } catch (error) {
    console.error("Error loading cart:", error);
    cart = { items: [], total: 0 };
    renderCart();
  }
}

function renderCart() {
  if (!cartListEl) return;
  
	cartListEl.innerHTML = "";
  
  if (!cart || !cart.items || cart.items.length === 0) {
    cartListEl.innerHTML = '<li class="list-group-item text-muted">Your cart is empty.</li>';
    totalEl.textContent = "0.00";
    cartCountEl.textContent = "0";
    return;
  }
  
  cart.items.forEach((item) => {
    const product = item.productId;
		const li = document.createElement("li");
		li.className = "list-group-item d-flex justify-content-between align-items-center";
		li.innerHTML = `
      <div class="me-3 flex-grow-1">
        <strong>${product?.name || 'Unknown Product'}</strong><br>
        <span class="text-muted">${formatPrice(item.price)} × ${item.quantity}</span>
			</div>
      <div class="btn-group btn-group-sm" role="group">
        <button class="btn btn-outline-secondary" data-action="dec" data-item-id="${item._id}">-</button>
        <button class="btn btn-outline-secondary" disabled>${item.quantity}</button>
        <button class="btn btn-outline-secondary" data-action="inc" data-item-id="${item._id}">+</button>
        <button class="btn btn-outline-danger" data-action="rem" data-item-id="${item._id}">Remove</button>
			</div>
		`;
		cartListEl.appendChild(li);
	});
  
  totalEl.textContent = (cart.total || 0).toFixed(2);
  cartCountEl.textContent = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  // Attach handlers
	cartListEl.querySelectorAll("button[data-action]").forEach((btn) => {
    const itemId = btn.dataset.itemId;
    if (btn.dataset.action === "dec") {
      btn.addEventListener("click", () => updateCartItem(itemId, -1));
    } else if (btn.dataset.action === "inc") {
      btn.addEventListener("click", () => updateCartItem(itemId, 1));
    } else if (btn.dataset.action === "rem") {
      btn.addEventListener("click", () => removeCartItem(itemId));
    }
  });
}

async function addToCart(productId) {
  // Prevent admins from adding to cart
  if (authAPI.isAdmin()) {
    showError("Admins cannot place orders. Please use a regular user account to shop.");
    return;
  }
  
  try {
    cart = await cartAPI.addItem(productId, 1);
	renderCart();
    showSuccess("Product added to cart!");
  } catch (error) {
    console.error("Error adding to cart:", error);
    showError(error.message || "Failed to add product to cart.");
  }
}

async function updateCartItem(itemId, delta) {
  try {
    const item = cart.items.find(i => i._id === itemId);
	if (!item) return;
    
    const newQuantity = item.quantity + delta;
    if (newQuantity <= 0) {
      await removeCartItem(itemId);
      return;
    }
    
    cart = await cartAPI.updateItem(itemId, newQuantity);
		renderCart();
  } catch (error) {
    console.error("Error updating cart:", error);
    showError(error.message || "Failed to update cart item.");
  }
}

async function removeCartItem(itemId) {
  try {
    cart = await cartAPI.removeItem(itemId);
	renderCart();
  } catch (error) {
    console.error("Error removing from cart:", error);
    showError(error.message || "Failed to remove item from cart.");
  }
}

/* ------------------------- Checkout ------------------------- */
confirmCheckoutBtn?.addEventListener("click", async () => {
  const name = document.getElementById("customer-name").value.trim();
  const email = document.getElementById("customer-email").value.trim();
  
  if (!name || !email) {
    showError("Please fill in all checkout fields.");
    return;
  }
  
  if (!cart || !cart.items || cart.items.length === 0) {
    showError("Cart is empty.");
    return;
  }
  
  try {
    const order = await ordersAPI.create(name, email);
    showSuccess(`Order placed successfully! Order Number: ${order.order?.orderNumber || 'N/A'}`);
    
    // Clear cart
    await cartAPI.clearCart();
    cart = { items: [], total: 0 };
    renderCart();
    
    // Clear form
    document.getElementById("customer-name").value = "";
    document.getElementById("customer-email").value = "";
    document.getElementById("customer-address").value = "";
    
    // Navigate to orders
    if (authAPI.isAuthenticated()) {
      showView("orders");
    }
  } catch (error) {
    console.error("Error creating order:", error);
    showError(error.message || "Failed to place order. Please try again.");
  }
});

/* ------------------------- Orders ------------------------- */
async function loadOrders() {
  if (!ordersListEl) return;
  
  try {
    const user = authAPI.getCurrentUser();
    if (!user) {
      ordersListEl.innerHTML = '<p class="text-muted">Please log in to view your orders.</p>';
      return;
    }
    
    // Admins should not see orders - they manage products only
    if (authAPI.isAdmin()) {
      ordersListEl.innerHTML = '<div class="col-12"><p class="text-muted">Admins manage products, not orders. Use the Admin panel to manage products.</p></div>';
      return;
    }
    
    // Get user email from localStorage or user object
    // The user object from API might not have email, so we need to get it from login
    const userEmail = user.email || localStorage.getItem('userEmail') || '';
    
    if (!userEmail) {
      ordersListEl.innerHTML = '<p class="text-muted">Unable to load orders. Please log out and log in again.</p>';
      return;
    }
    
    const orders = await ordersAPI.getByCustomerEmail(userEmail);
    renderOrders(orders);
  } catch (error) {
    console.error("Error loading orders:", error);
    ordersListEl.innerHTML = '<p class="text-danger">Failed to load orders. ' + (error.message || '') + '</p>';
  }
}

async function renderOrders(orders) {
  if (!ordersListEl) return;
  
  ordersListEl.innerHTML = "";
  
  if (!orders || orders.length === 0) {
    ordersListEl.innerHTML = '<div class="col-12"><p class="text-muted">You have no orders yet.</p></div>';
    return;
  }
  
  for (const order of orders) {
    const col = document.createElement("div");
    col.className = "col-12 mb-3";
    
    // Fetch product images for each item
    const itemsWithImages = await Promise.all(order.items.map(async (item) => {
      let productImage = 'https://via.placeholder.com/100x100?text=No+Image';
      
      if (item.productId && item.productId._id) {
        try {
          const product = await productsAPI.getById(item.productId._id);
          if (product && product.image) {
            productImage = getImageUrl(product);
          }
        } catch (error) {
          console.error('Error fetching product image:', error);
        }
      }
      
      return { ...item, productImage };
    }));
    
    col.innerHTML = `
      <div class="card shadow-sm">
        <div class="card-header bg-white d-flex justify-content-between align-items-center">
          <div>
            <strong class="fs-5">Order #${order.orderNumber}</strong>
            <span class="badge bg-${getStatusColor(order.status)} ms-2">${order.status.toUpperCase()}</span>
          </div>
          <div class="text-end">
            <div class="text-muted small">Total Amount</div>
            <strong class="fs-5 text-primary">${formatPrice(order.total)}</strong>
          </div>
        </div>
        <div class="card-body">
          <div class="row mb-3">
            <div class="col-md-6">
              <p class="mb-1"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p class="mb-1"><strong>Order Time:</strong> ${new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div class="col-md-6">
              <p class="mb-1"><strong>Subtotal:</strong> ${formatPrice(order.subtotal)}</p>
              <p class="mb-1"><strong>Tax:</strong> ${formatPrice(order.tax || 0)}</p>
              <p class="mb-0"><strong>Total Items:</strong> ${order.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
            </div>
          </div>
          
          <hr>
          
          <h6 class="mb-3">Ordered Items:</h6>
          <div class="row g-3">
            ${itemsWithImages.map(item => `
              <div class="col-12">
                <div class="d-flex align-items-center border rounded p-2">
                  <img src="${item.productImage}" 
                       alt="${item.productName}" 
                       class="img-thumbnail me-3" 
                       style="width: 80px; height: 80px; object-fit: cover;"
                       onerror="this.src='https://via.placeholder.com/80x80?text=No+Image'">
                  <div class="flex-grow-1">
                    <h6 class="mb-1">${item.productName}</h6>
                    <div class="text-muted small">
                      <span>Quantity: ${item.quantity}</span> × 
                      <span>${formatPrice(item.price)}</span> = 
                      <strong>${formatPrice(item.subtotal)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    ordersListEl.appendChild(col);
  }
}

function getStatusColor(status) {
  const colors = {
    pending: 'warning',
    processing: 'info',
    completed: 'success',
    cancelled: 'danger'
  };
  return colors[status] || 'secondary';
}

/* ------------------------- Admin Panel ------------------------- */
async function loadAdminProducts() {
  if (!adminProductsListEl) return;
  
  try {
    const adminProducts = await productsAPI.getAll();
    renderAdminProducts(adminProducts);
  } catch (error) {
    console.error("Error loading admin products:", error);
    adminProductsListEl.innerHTML = '<p class="text-danger">Failed to load products.</p>';
  }
}

function renderAdminProducts(productsList) {
  if (!adminProductsListEl) return;
  
  adminProductsListEl.innerHTML = "";
  
  productsList.forEach((p) => {
    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4";
    col.innerHTML = `
      <div class="card h-100">
        <img src="${getImageUrl(p)}" class="card-img-top" style="height: 200px; object-fit: cover;" alt="${p.name}" />
        <div class="card-body">
          <h6 class="card-title">${p.name}</h6>
          <p class="card-text small">${p.description || ''}</p>
          <p><strong>Price:</strong> ${formatPrice(p.price)} | <strong>Stock:</strong> ${p.stock}</p>
          <div class="btn-group w-100" role="group">
            <button class="btn btn-sm btn-warning" data-action="edit" data-id="${p._id}">Edit</button>
            <button class="btn btn-sm btn-danger" data-action="delete" data-id="${p._id}">Delete</button>
          </div>
        </div>
      </div>
    `;
    adminProductsListEl.appendChild(col);
  });
  
  // Attach handlers
  adminProductsListEl.querySelectorAll("button[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => editProduct(btn.dataset.id));
  });
  
  adminProductsListEl.querySelectorAll("button[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", () => deleteProduct(btn.dataset.id));
  });
}

async function loadAdminOrders() {
  if (!adminOrdersListEl) return;
  
  try {
    const orders = await ordersAPI.getAll();
    renderAdminOrders(orders);
  } catch (error) {
    console.error("Error loading admin orders:", error);
    adminOrdersListEl.innerHTML = '<p class="text-danger">Failed to load orders.</p>';
  }
}

async function renderAdminOrders(orders) {
  if (!adminOrdersListEl) return;
  
  adminOrdersListEl.innerHTML = "";
  
  if (!orders || orders.length === 0) {
    adminOrdersListEl.innerHTML = '<p class="text-muted">No orders yet.</p>';
    return;
  }
  
  // Create accordion-style order cards with detailed information
  const ordersContainer = document.createElement("div");
  ordersContainer.className = "accordion";
  ordersContainer.id = "ordersAccordion";
  
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const orderId = `order-${i}`;
    
    // Calculate total items
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Get product images for items
    const itemsWithImages = await Promise.all(order.items.map(async (item) => {
      let productImage = 'https://via.placeholder.com/60x60?text=No+Image';
      
      if (item.productId && item.productId._id) {
        try {
          const product = await productsAPI.getById(item.productId._id);
          if (product && product.image) {
            productImage = getImageUrl(product);
          }
        } catch (error) {
          console.error('Error fetching product image:', error);
        }
      }
      
      return { ...item, productImage };
    }));
    
    const orderCard = document.createElement("div");
    orderCard.className = "accordion-item mb-3 border rounded";
    orderCard.innerHTML = `
      <h2 class="accordion-header" id="heading-${orderId}">
        <button class="accordion-button ${i !== 0 ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${orderId}" aria-expanded="${i === 0 ? 'true' : 'false'}" aria-controls="collapse-${orderId}">
          <div class="d-flex justify-content-between align-items-center w-100 me-3">
            <div>
              <strong>Order #${order.orderNumber}</strong>
              <span class="badge bg-${getStatusColor(order.status)} ms-2">${order.status.toUpperCase()}</span>
            </div>
            <div class="text-end">
              <div class="text-muted small">${new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              <strong class="text-primary">${formatPrice(order.total)}</strong>
            </div>
          </div>
        </button>
      </h2>
      <div id="collapse-${orderId}" class="accordion-collapse collapse ${i === 0 ? 'show' : ''}" aria-labelledby="heading-${orderId}" data-bs-parent="#ordersAccordion">
        <div class="accordion-body">
          <div class="row mb-3">
            <div class="col-md-6">
              <h6 class="text-muted mb-2">Customer Information</h6>
              <p class="mb-1"><strong>Name:</strong> ${order.customerName}</p>
              <p class="mb-1"><strong>Email:</strong> <a href="mailto:${order.customerEmail}">${order.customerEmail}</a></p>
              <p class="mb-0"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div class="col-md-6">
              <h6 class="text-muted mb-2">Order Summary</h6>
              <div class="d-flex justify-content-between mb-1">
                <span>Items (${totalItems}):</span>
                <strong>${formatPrice(order.subtotal)}</strong>
              </div>
              <div class="d-flex justify-content-between mb-1">
                <span>Tax:</span>
                <strong>${formatPrice(order.tax || 0)}</strong>
              </div>
              <hr>
              <div class="d-flex justify-content-between">
                <span><strong>Total:</strong></span>
                <strong class="text-primary fs-5">${formatPrice(order.total)}</strong>
              </div>
            </div>
          </div>
          
          <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="text-muted mb-0">Order Status</h6>
              <select class="form-select form-select-sm" style="width: auto;" data-order-id="${order._id}" onchange="updateOrderStatus('${order._id}', this.value)">
                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </div>
          </div>
          
          <hr>
          
          <h6 class="text-muted mb-3">Ordered Items (${order.items.length})</h6>
          <div class="table-responsive">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th style="width: 80px;">Image</th>
                  <th>Product Name</th>
                  <th class="text-center">Quantity</th>
                  <th class="text-end">Unit Price</th>
                  <th class="text-end">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsWithImages.map(item => `
                  <tr>
                    <td>
                      <img src="${item.productImage}" 
                           alt="${item.productName}" 
                           class="img-thumbnail" 
                           style="width: 60px; height: 60px; object-fit: cover;"
                           onerror="this.src='https://via.placeholder.com/60x60?text=No+Image'">
                    </td>
                    <td><strong>${item.productName}</strong></td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-end">${formatPrice(item.price)}</td>
                    <td class="text-end"><strong>${formatPrice(item.subtotal)}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    ordersContainer.appendChild(orderCard);
  }
  
  adminOrdersListEl.appendChild(ordersContainer);
}

window.updateOrderStatus = async function(orderId, status) {
  try {
    await ordersAPI.updateStatus(orderId, status);
    showSuccess("Order status updated!");
    await loadAdminOrders();
  } catch (error) {
    console.error("Error updating order status:", error);
    showError(error.message || "Failed to update order status.");
  }
};

window.viewOrderDetails = async function(orderId) {
  try {
    const order = await ordersAPI.getById(orderId);
    
    // Create a detailed modal for order view
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'orderDetailsModal';
    modal.innerHTML = `
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Order Details - #${order.orderNumber}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row mb-3">
              <div class="col-md-6">
                <h6>Customer Information</h6>
                <p><strong>Name:</strong> ${order.customerName}</p>
                <p><strong>Email:</strong> ${order.customerEmail}</p>
              </div>
              <div class="col-md-6">
                <h6>Order Information</h6>
                <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                <p><strong>Status:</strong> <span class="badge bg-${getStatusColor(order.status)}">${order.status}</span></p>
              </div>
            </div>
            <hr>
            <h6>Items (${order.items.length})</h6>
            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th class="text-center">Qty</th>
                    <th class="text-end">Price</th>
                    <th class="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map(item => `
                    <tr>
                      <td>${item.productName}</td>
                      <td class="text-center">${item.quantity}</td>
                      <td class="text-end">${formatPrice(item.price)}</td>
                      <td class="text-end">${formatPrice(item.subtotal)}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" class="text-end"><strong>Total:</strong></td>
                    <td class="text-end"><strong>${formatPrice(order.total)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Remove modal from DOM after it's hidden
    modal.addEventListener('hidden.bs.modal', () => {
      document.body.removeChild(modal);
    });
  } catch (error) {
    showError("Failed to load order details.");
  }
};

// Admin: Create User button
document.getElementById("create-user-btn")?.addEventListener("click", () => {
  // Reset registration form
  document.getElementById("register-form")?.reset();
  document.getElementById("register-name").value = "";
  document.getElementById("register-email").value = "";
  document.getElementById("register-password").value = "";
  document.getElementById("register-role").value = "User";
  document.getElementById("register-error")?.classList.add("d-none");
  
  // Update modal title to indicate admin is creating user
  const modalTitle = document.querySelector("#registerModal .modal-title");
  if (modalTitle) modalTitle.textContent = "Create New User (Admin)";
  
  // Ensure admin role option is visible
  updateRegistrationModal();
  registerModal?.show();
});

document.getElementById("add-product-btn")?.addEventListener("click", () => {
  document.getElementById("product-form").reset();
  document.getElementById("product-id").value = "";
  document.getElementById("product-form-title").textContent = "Add Product";
  productFormModal?.show();
});

document.getElementById("product-form-submit")?.addEventListener("click", async () => {
  const productId = document.getElementById("product-id").value;
  const name = document.getElementById("product-name").value.trim();
  const description = document.getElementById("product-description").value.trim();
  const price = parseFloat(document.getElementById("product-price").value);
  const stock = parseInt(document.getElementById("product-stock").value);
  const category = document.getElementById("product-category").value.trim();
  const imageFile = document.getElementById("product-image").files[0];
  const imageUrl = document.getElementById("product-image-url").value.trim();
  const errorEl = document.getElementById("product-form-error");
  
  if (!name || !description || !price || !stock || !category) {
    if (errorEl) {
      errorEl.textContent = "Please fill in all required fields";
      errorEl.classList.remove("d-none");
    }
		return;
	}
  
  try {
    const productData = {
      name,
      description,
      price,
      stock,
      category
    };
    
    if (imageUrl && !imageFile) {
      productData.image = imageUrl;
    }
    
    if (productId) {
      await productsAPI.update(productId, productData, imageFile);
      showSuccess("Product updated successfully!");
    } else {
      await productsAPI.create(productData, imageFile);
      showSuccess("Product created successfully!");
    }
    
    productFormModal?.hide();
    await loadAdminProducts();
    await loadProducts();
  } catch (error) {
    if (errorEl) {
      errorEl.textContent = error.message || "Failed to save product.";
      errorEl.classList.remove("d-none");
    } else {
      showError(error.message || "Failed to save product.");
    }
  }
});

async function editProduct(productId) {
  try {
    const product = await productsAPI.getById(productId);
    document.getElementById("product-id").value = product._id;
    document.getElementById("product-name").value = product.name;
    document.getElementById("product-description").value = product.description || '';
    document.getElementById("product-price").value = product.price;
    document.getElementById("product-stock").value = product.stock;
    document.getElementById("product-category").value = product.category;
    document.getElementById("product-image-url").value = product.image || '';
    document.getElementById("product-image").value = '';
    document.getElementById("product-form-title").textContent = "Edit Product";
    document.getElementById("product-form-error")?.classList.add("d-none");
    productFormModal?.show();
  } catch (error) {
    showError("Failed to load product details.");
  }
}

async function deleteProduct(productId) {
  if (!confirm("Are you sure you want to delete this product?")) {
		return;
	}
  
  try {
    await productsAPI.delete(productId);
    showSuccess("Product deleted successfully!");
    await loadAdminProducts();
    await loadProducts();
  } catch (error) {
    showError(error.message || "Failed to delete product.");
  }
}

/* ------------------------- Routing ------------------------- */
const views = {
	home: document.getElementById("view-home"),
	products: document.getElementById("view-products"),
	cart: document.getElementById("view-cart"),
  orders: document.getElementById("view-orders"),
  admin: document.getElementById("view-admin"),
	about: document.getElementById("view-about"),
	contact: document.getElementById("view-contact")
};

function showView(name) {
	Object.entries(views).forEach(([key, el]) => {
    if (el) {
		el.style.display = key === name ? "block" : "none";
    }
	});
  
	document.querySelectorAll('[data-route]').forEach((a) => {
		if (a.classList.contains("nav-link")) {
			a.classList.toggle("active", a.getAttribute("data-route") === name);
		}
	});
  
  // Load data when switching views
  if (name === "products" || name === "home") {
    loadProducts();
  } else if (name === "cart") {
    // Prevent admins from accessing cart
    if (authAPI.isAdmin()) {
      showView("admin");
      showError("Admins cannot place orders. Use the Admin panel to manage products.");
      return;
    }
    loadCart();
    // Pre-fill checkout form with user info if logged in
    const user = authAPI.getCurrentUser();
    if (user) {
      const nameInput = document.getElementById("customer-name");
      const emailInput = document.getElementById("customer-email");
      if (nameInput && !nameInput.value) nameInput.value = user.name || "";
      if (emailInput && !emailInput.value) emailInput.value = localStorage.getItem('userEmail') || "";
    }
  } else if (name === "orders") {
    // Prevent admins from accessing orders
    if (authAPI.isAdmin()) {
      showView("admin");
      showError("Admins manage products, not orders. Use the Admin panel.");
      return;
    }
    loadOrders();
  } else if (name === "admin") {
    if (authAPI.isAdmin()) {
      loadAdminProducts();
      loadAdminOrders();
    } else {
      showView("home");
      showError("Access denied. Admin privileges required.");
    }
  }
  
  // Update registration modal when opening admin panel
  if (name === "admin" && authAPI.isAdmin()) {
    updateRegistrationModal();
  }
  
  if (name === "products") {
    window.scrollTo({ top: 0, behavior: "smooth" });
	}
}

document.querySelectorAll('[data-route]').forEach((el) => {
	el.addEventListener("click", (e) => {
		e.preventDefault();
		const route = el.getAttribute("data-route");
		if (!route) return;
		history.pushState({ route }, "", `#${route}`);
		showView(route);
	});
});

window.addEventListener("popstate", () => {
	const route = location.hash.replace("#", "") || "home";
	showView(route);
});

/* ------------------------- Contact Form ------------------------- */
document.getElementById("contact-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("contact-name").value.trim();
  const email = document.getElementById("contact-email").value.trim();
  const message = document.getElementById("contact-message").value.trim();
  
  if (!name || !email || !message) {
    showError("Please fill all contact fields.");
    return;
  }
  
  showSuccess("Thanks! We'll get back to you shortly.");
  e.target.reset();
});

/* ------------------------- Initial Load ------------------------- */
async function loadInitialData() {
  await loadProducts();
  await loadCart();
}

// Initialize
showView((location.hash.replace("#", "") || "home"));
