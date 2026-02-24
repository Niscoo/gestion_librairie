import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { API_BASE_URL } from '../config/api';
import { UserContext } from './UserContext';

export const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  // favorites: [{ id: dbId, isbn }]
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(UserContext);

  const fetchFavorites = useCallback(async (userId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/favoris?user_id=${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      setFavorites(data.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync favorites when user changes
  useEffect(() => {
    if (user?.id) {
      fetchFavorites(user.id);
    } else {
      setFavorites([]);
    }
  }, [user, fetchFavorites]);

  const isFavorite = useCallback((isbn) => {
    return favorites.some(f => f.isbn === isbn);
  }, [favorites]);

  const addFavorite = useCallback(async (isbn) => {
    if (!user?.id) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/api/favoris`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, isbn }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setFavorites(prev => {
        if (prev.some(f => f.isbn === isbn)) return prev;
        return [...prev, { id: data.id, isbn: data.isbn }];
      });
      return true;
    } catch {
      return false;
    }
  }, [user]);

  const removeFavorite = useCallback(async (isbn) => {
    const entry = favorites.find(f => f.isbn === isbn);
    if (!entry) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/api/favoris/${entry.id}`, { method: 'DELETE' });
      if (!res.ok) return false;
      setFavorites(prev => prev.filter(f => f.isbn !== isbn));
      return true;
    } catch {
      return false;
    }
  }, [favorites]);

  const toggleFavorite = useCallback(async (isbn) => {
    if (isFavorite(isbn)) return removeFavorite(isbn);
    return addFavorite(isbn);
  }, [isFavorite, addFavorite, removeFavorite]);

  return (
    <FavoritesContext.Provider value={{ favorites, loading, isFavorite, toggleFavorite, favoritesCount: favorites.length }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
