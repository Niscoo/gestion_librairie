const API_BASE = 'http://localhost:5000/api';

const orderService = {
  /**
   * Create a new order
   * @param {Array} items - Cart items with id, title, format, quantity, price
   * @param {Object} userData - User data {id} for connected users or {guestInfo: {email, nom, prenom, telephone}}
   * @param {Object} shippingAddress - {rue, ville, code_postal, pays}
   * @returns {Promise<Object>} Order response {id, total, status}
   */
  createOrder: async (items, userData, shippingAddress) => {
    try {
      const payload = {
        items,
        shipping_address: shippingAddress
      };

      if (userData?.id) {
        payload.user_id = userData.id;
      } else {
        payload.guest_info = userData.guestInfo;
      }

      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      return await response.json();
    } catch (error) {
      console.error('createOrder error:', error);
      throw error;
    }
  },

  /**
   * Get order details
   * @param {number} orderId
   * @returns {Promise<Object>} Order details
   */
  getOrder: async (orderId) => {
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      return await response.json();
    } catch (error) {
      console.error('getOrder error:', error);
      throw error;
    }
  },

  /**
   * Get user's order history
   * @param {number} userId
   * @returns {Promise<Array>} List of orders
   */
  getUserOrders: async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/orders?user_id=${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      return await response.json();
    } catch (error) {
      console.error('getUserOrders error:', error);
      throw error;
    }
  },

  /**
   * Register a new user
   * @param {Object} userData - {email, password, nom, prenom, telephone}
   * @returns {Promise<Object>} User data {id, email, nom, prenom}
   */
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('register error:', error);
      throw error;
    }
  },

  /**
   * Login user
   * @param {Object} credentials - {email, password}
   * @returns {Promise<Object>} User data {id, email, nom, prenom, telephone}
   */
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      return await response.json();
    } catch (error) {
      console.error('login error:', error);
      throw error;
    }
  },

  /**
   * Get user profile
   * @param {number} userId
   * @returns {Promise<Object>} User profile
   */
  getUserProfile: async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/users/profile/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      return await response.json();
    } catch (error) {
      console.error('getUserProfile error:', error);
      throw error;
    }
  }
};

export default orderService;
