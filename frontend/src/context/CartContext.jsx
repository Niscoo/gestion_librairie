import { createContext, useContext, useReducer, useEffect } from 'react';
import { useUser } from './UserContext';
import { API_BASE_URL } from '../config/api';

const CartContext = createContext();

const initialState = () => {
  try {
    const raw = localStorage.getItem('cart_items');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse cart from localStorage', e);
    return [];
  }
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const book = action.payload;
      const itemKey = `${book.id}-${book.format}`;
      const existing = state.find(item => `${item.id}-${item.format}` === itemKey);
      if (existing) {
        return state.map(item =>
          `${item.id}-${item.format}` === itemKey
            ? { ...item, quantity: item.quantity + (book.quantity || 1) }
            : item
        );
      }
      return [...state, { ...book, quantity: book.quantity || 1 }];
    }
    case 'REMOVE': {
      const { bookId, format } = action.payload;
      return state.filter(item => !(item.id === bookId && item.format === format));
    }
    case 'UPDATE_QUANTITY': {
      const { bookId, format, quantity } = action.payload;
      if (quantity <= 0) {
        return state.filter(item => !(item.id === bookId && item.format === format));
      }
      return state.map(item =>
        item.id === bookId && item.format === format ? { ...item, quantity } : item
      );
    }
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [cartItems, dispatch] = useReducer(cartReducer, undefined, initialState);

  const { user, isConnected } = useUser();

  useEffect(() => {
    try {
      localStorage.setItem('cart_items', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
    // when user is connected, persist cart to backend
    const persist = async () => {
      if (!isConnected || !user?.id) return;
      try {
        await fetch(`${API_BASE_URL}/api/panier`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, items: cartItems.map(it=>({ isbn: it.id, titre: it.title || it.titre, format: it.format, quantity: it.quantity, prix_unitaire: it.price })) })
        });
      } catch (e) {
        console.error('Failed to persist cart to backend', e);
      }
    };
    persist();
  }, [cartItems, isConnected, user]);

  // on user connect, load cart from backend
  useEffect(() => {
    const load = async () => {
      if (!isConnected || !user?.id) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/panier?user_id=${user.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.items) && data.items.length > 0) {
          dispatch({ type: 'CLEAR' });
          data.items.forEach(it => dispatch({ type: 'ADD', payload: { id: it.isbn, title: it.titre, format: it.format, quantity: it.quantity, price: it.prix_unitaire } }));
        }
      } catch (e) {
        console.error('Failed to load cart from backend', e);
      }
    };
    load();
  }, [isConnected, user]);

  const addToCart = (book) => {
    dispatch({ type: 'ADD', payload: book });
  };

  const removeFromCart = (bookId, format) => {
    dispatch({ type: 'REMOVE', payload: { bookId, format } });
  };

  const updateQuantity = (bookId, format, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { bookId, format, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR' });
  };

  const getTotalItems = () => cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const getTotalPrice = () => cartItems.reduce((sum, item) => sum + ((item.price ?? 0) * (item.quantity ?? 0)), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart doit être utilisé dans un CartProvider');
  }
  return context;
}
