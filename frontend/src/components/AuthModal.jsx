import { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import authService from '../services/authService';
import '../styles/AuthModal.css';

export default function AuthModal({ onClose }) {
  const { setUser } = useUser();
  const { addToast } = useToast();
  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'verify'
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ nom: '', prenom: '', email: '', password: '', confirm: '' });
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifyPassword, setVerifyPassword] = useState('');

  const firstInputRef = useRef(null);
  const codeRefs = useRef([]);

  // Trap focus & close on Escape
  useEffect(() => {
    firstInputRef.current?.focus();
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Focus first code input when entering verify tab
  useEffect(() => {
    if (tab === 'verify') codeRefs.current[0]?.focus();
  }, [tab]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Reset errors when switching tabs
  useEffect(() => { setErrors({}); }, [tab]);

  /* ── Login ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!loginForm.email) errs.email = 'Email requis';
    if (!loginForm.password) errs.password = 'Mot de passe requis';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const user = await authService.login(loginForm.email, loginForm.password);
      setUser(user);
      addToast(`Bienvenue, ${user.prenom || user.nom || user.email} !`, 'success');
      onClose();
    } catch (err) {
      if (err.requires_verification) {
        setVerifyEmail(err.email || loginForm.email);
        setVerifyPassword(loginForm.password);
        setTab('verify');
        addToast('Veuillez vérifier votre email pour continuer', 'info');
      } else {
        setErrors({ global: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Register ── */
  const handleRegister = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!registerForm.nom.trim()) errs.nom = 'Nom requis';
    if (!registerForm.email) errs.email = 'Email requis';
    if (!registerForm.password) errs.password = 'Mot de passe requis';
    if (registerForm.password.length < 6) errs.password = 'Minimum 6 caractères';
    if (registerForm.password !== registerForm.confirm) errs.confirm = 'Les mots de passe ne correspondent pas';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await authService.register({
        nom: registerForm.nom,
        prenom: registerForm.prenom,
        email: registerForm.email,
        password: registerForm.password,
      });
      setVerifyEmail(registerForm.email);
      setVerifyPassword(registerForm.password);
      setTab('verify');
      setResendCooldown(60);
      addToast('Code de vérification envoyé à votre email', 'success');
    } catch (err) {
      setErrors({ global: err.message });
    } finally {
      setLoading(false);
    }
  };

  /* ── Verify code ── */
  const handleCodeChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...verifyCode];
    newCode[index] = value;
    setVerifyCode(newCode);

    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verifyCode[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setVerifyCode(pasted.split(''));
      codeRefs.current[5]?.focus();
      e.preventDefault();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = verifyCode.join('');
    if (code.length !== 6) {
      setErrors({ global: 'Entrez le code à 6 chiffres' });
      return;
    }

    setLoading(true);
    try {
      await authService.verifyEmail(verifyEmail, code);
      // Auto-login après vérification
      const user = await authService.login(verifyEmail, verifyPassword);
      setUser(user);
      addToast(`Email vérifié ! Bienvenue, ${user.prenom || user.nom} !`, 'success');
      onClose();
    } catch (err) {
      setErrors({ global: err.message });
      setVerifyCode(['', '', '', '', '', '']);
      codeRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await authService.resendVerification(verifyEmail);
      setResendCooldown(60);
      addToast('Nouveau code envoyé', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <>
      <div className="auth-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-label={tab === 'login' ? 'Connexion' : tab === 'register' ? 'Créer un compte' : 'Vérification email'}
      >
        {/* Header */}
        <div className="auth-modal-header">
          {tab !== 'verify' ? (
            <div className="auth-tabs">
              <button
                className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
                onClick={() => setTab('login')}
              >
                Connexion
              </button>
              <button
                className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
                onClick={() => setTab('register')}
              >
                Créer un compte
              </button>
            </div>
          ) : (
            <div className="auth-tabs">
              <span className="auth-tab active">Vérification email</span>
            </div>
          )}
          <button className="auth-close" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        {/* Global error */}
        {errors.global && (
          <div className="auth-error-banner">{errors.global}</div>
        )}

        {/* ── Login form ── */}
        {tab === 'login' && (
          <form className="auth-form" onSubmit={handleLogin} noValidate>
            <div className="auth-field">
              <label htmlFor="login-email">Email</label>
              <input
                ref={firstInputRef}
                id="login-email"
                type="email"
                placeholder="votre@email.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className={errors.email ? 'error' : ''}
                autoComplete="email"
              />
              {errors.email && <span className="auth-field-error">{errors.email}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Mot de passe</label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className={errors.password ? 'error' : ''}
                autoComplete="current-password"
              />
              {errors.password && <span className="auth-field-error">{errors.password}</span>}
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>

            <p className="auth-switch">
              Pas encore de compte ?{' '}
              <button type="button" onClick={() => setTab('register')}>Créer un compte</button>
            </p>
          </form>
        )}

        {/* ── Register form ── */}
        {tab === 'register' && (
          <form className="auth-form" onSubmit={handleRegister} noValidate>
            <div className="auth-row">
              <div className="auth-field">
                <label htmlFor="reg-prenom">Prénom</label>
                <input
                  ref={firstInputRef}
                  id="reg-prenom"
                  type="text"
                  placeholder="Jean"
                  value={registerForm.prenom}
                  onChange={(e) => setRegisterForm({ ...registerForm, prenom: e.target.value })}
                  autoComplete="given-name"
                />
              </div>
              <div className="auth-field">
                <label htmlFor="reg-nom">Nom *</label>
                <input
                  id="reg-nom"
                  type="text"
                  placeholder="Dupont"
                  value={registerForm.nom}
                  onChange={(e) => setRegisterForm({ ...registerForm, nom: e.target.value })}
                  className={errors.nom ? 'error' : ''}
                  autoComplete="family-name"
                />
                {errors.nom && <span className="auth-field-error">{errors.nom}</span>}
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="reg-email">Email *</label>
              <input
                id="reg-email"
                type="email"
                placeholder="votre@email.com"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                className={errors.email ? 'error' : ''}
                autoComplete="email"
              />
              {errors.email && <span className="auth-field-error">{errors.email}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="reg-password">Mot de passe * <span className="auth-hint">(min. 6 caractères)</span></label>
              <input
                id="reg-password"
                type="password"
                placeholder="••••••"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                className={errors.password ? 'error' : ''}
                autoComplete="new-password"
              />
              {errors.password && <span className="auth-field-error">{errors.password}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="reg-confirm">Confirmer le mot de passe *</label>
              <input
                id="reg-confirm"
                type="password"
                placeholder="••••••"
                value={registerForm.confirm}
                onChange={(e) => setRegisterForm({ ...registerForm, confirm: e.target.value })}
                className={errors.confirm ? 'error' : ''}
                autoComplete="new-password"
              />
              {errors.confirm && <span className="auth-field-error">{errors.confirm}</span>}
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>

            <p className="auth-switch">
              Déjà un compte ?{' '}
              <button type="button" onClick={() => setTab('login')}>Se connecter</button>
            </p>
          </form>
        )}

        {/* ── Verify email form ── */}
        {tab === 'verify' && (
          <form className="auth-form auth-verify-form" onSubmit={handleVerify} noValidate>
            <div className="auth-verify-icon">✉️</div>
            <p className="auth-verify-text">
              Un code à 6 chiffres a été envoyé à<br />
              <strong>{verifyEmail}</strong>
            </p>

            <div className="auth-code-inputs" onPaste={handleCodePaste}>
              {verifyCode.map((digit, i) => (
                <input
                  key={i}
                  ref={el => codeRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`auth-code-digit ${errors.global ? 'error' : ''}`}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Vérification...' : 'Vérifier'}
            </button>

            <p className="auth-resend">
              Vous n'avez pas reçu le code ?{' '}
              <button
                type="button"
                className="auth-resend-btn"
                onClick={handleResend}
                disabled={resendCooldown > 0}
              >
                {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : 'Renvoyer le code'}
              </button>
            </p>

            <p className="auth-switch">
              <button type="button" onClick={() => setTab('login')}>← Retour à la connexion</button>
            </p>
          </form>
        )}
      </div>
    </>
  );
}
