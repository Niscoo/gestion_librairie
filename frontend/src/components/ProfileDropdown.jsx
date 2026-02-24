import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useFavorites } from '../context/FavoritesContext';
import '../styles/ProfileDropdown.css';

export default function ProfileDropdown({ onClose }) {
  const { user, logout } = useUser();
  const { favoritesCount } = useFavorites();
  const navigate = useNavigate();
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [onClose]);

  const go = (path) => { navigate(path); onClose(); };

  const initials = (() => {
    const p = (user?.prenom || '').trim();
    const n = (user?.nom || '').trim();
    if (p && n) return `${p[0]}${n[0]}`.toUpperCase();
    if (n) return n.slice(0, 2).toUpperCase();
    return (user?.email || '?')[0].toUpperCase();
  })();

  const fullName = [user?.prenom, user?.nom].filter(Boolean).join(' ') || user?.email || '';

  return (
    <div className="profile-dropdown" ref={ref} role="menu">
      {/* Header */}
      <div className="pd-header">
        <div className="pd-avatar-lg">{initials}</div>
        <div className="pd-user-info">
          <span className="pd-name">{fullName}</span>
          <span className="pd-email">{user?.email}</span>
        </div>
      </div>

      <div className="pd-divider" />

      {/* Menu items */}
      <button className="pd-item" onClick={() => go('/favoris')} role="menuitem">
        <span className="pd-item-icon">♥</span>
        <span className="pd-item-label">Mes favoris</span>
        {favoritesCount > 0 && <span className="pd-badge">{favoritesCount}</span>}
      </button>

      <button className="pd-item" onClick={() => go('/commandes')} role="menuitem">
        <span className="pd-item-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </span>
        <span className="pd-item-label">Mes commandes</span>
      </button>

      <button className="pd-item" onClick={() => go('/profil')} role="menuitem">
        <span className="pd-item-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </span>
        <span className="pd-item-label">Informations personnelles</span>
      </button>

      <div className="pd-divider" />

      <button className="pd-item pd-item-logout" onClick={() => { logout(); onClose(); }} role="menuitem">
        <span className="pd-item-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </span>
        <span className="pd-item-label">Déconnexion</span>
      </button>
    </div>
  );
}
