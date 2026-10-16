import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Menu, 
  X, 
  LayoutDashboard, 
  Calculator, 
  DollarSign, 
  MessageSquare, 
  Leaf,
  Compass,
  UserCircle,
  LogOut,
  ShieldCheck,
  CreditCard,
  Download,
  HelpCircle
} from 'lucide-react';

import { auth, clearChatHistory, isAdminUser, onAuthStateChanged, signOut, startPresence, subscribeToUserPlan, toAppUser } from './utils/firebase';

// Subcomponents
import Dashboard from './components/Dashboard';
import ConsumptionCalculator from './components/Calculator';
import Estimator from './components/Estimator';
import Chatbot from './components/Chatbot';
import Orientation from './components/Orientation';
import Profile from './components/Profile';
import Auth from './components/Auth';
import Admin from './components/Admin';
import Plans from './components/Plans';
import PaymentMethods from './components/PaymentMethods';
import Checkout from './components/Checkout';
import ComplaintModal from './components/ComplaintModal';

const VALID_VIEWS = ['dashboard', 'calculator', 'estimator', 'orientation', 'chatbot', 'profile', 'admin', 'plans', 'paymentMethods', 'checkout'];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // prevent auth flash on reload
  const [authView, setAuthView] = useState('signin');

  const getInitialView = () => {
    const hash = window.location.hash.replace(/^#\/?/, '').trim();
    return VALID_VIEWS.includes(hash) ? hash : 'dashboard';
  };

  const [activeView, setActiveViewRaw] = useState(getInitialView);

  const setActiveView = (view, replace = false) => {
    setActiveViewRaw(view);
    const targetHash = `#/${view}`;
    if (window.location.hash !== targetHash) {
      if (replace) {
        window.history.replaceState(null, '', targetHash);
      } else {
        window.location.hash = targetHash;
      }
    }
  };

  // Sync activeView with browser Back / Forward buttons and URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (VALID_VIEWS.includes(hash)) {
        setActiveViewRaw(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Theme: Dark mode default, follows visitor's system setting, remembers manual choice
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('sp_theme');
      if (saved) return saved;
      if (typeof window !== 'undefined' && window.matchMedia) {
        if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
      }
    } catch (_) {}
    return 'dark'; // Dark mode is the primary default
  });

  // Listen to system preference changes if no manual preference has been stored yet
  useEffect(() => {
    try {
      if (!localStorage.getItem('sp_theme') && window.matchMedia) {
        const media = window.matchMedia('(prefers-color-scheme: light)');
        const listener = (e) => setTheme(e.matches ? 'light' : 'dark');
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
      }
    } catch (_) {}
  }, []);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const isAdmin = isAdminUser(user);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [subscription, setSubscription] = useState({ plan: 'free', status: 'inactive' });
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [complaintOpen, setComplaintOpen] = useState(false);
  
  // Shared state: passed from Calculator to Estimator
  const [calculatorRecommendation, setCalculatorRecommendation] = useState(null);

  // Geographic Location & Irradiance Shared States
  const [region, setRegion] = useState('West Africa');
  const [sunHours, setSunHours] = useState(5.4);
  const [zipCode, setZipCode] = useState('101001');

  // Sync theme with HTML data-theme attribute and persist it
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sp_theme', theme);
  }, [theme]);

  // Update document title per active view
  useEffect(() => {
    const viewNames = {
      dashboard: 'Dashboard',
      calculator: 'Consumption Calculator',
      estimator: 'Cost & ROI',
      orientation: 'Orientation Tuning',
      chatbot: 'AI Chatbot',
      profile: 'Profile',
      admin: 'Admin',
      plans: 'Plans'
      ,paymentMethods: 'Payment methods'
      ,checkout: 'Checkout'
    };
    document.title = `${viewNames[activeView] || 'Solar Pulse'} | Solar Pulse`;
  }, [activeView]);

  // ESC key closes mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setAvatarDropdownOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scrolling when mobile menu drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    // Synchronous setup — no async wrapper so cleanup is returned directly and
    // React StrictMode double-invoke cannot orphan a listener.
    let stopPresence = () => {};
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      stopPresence();
      setIsAuthenticated(Boolean(firebaseUser));
      setUser(toAppUser(firebaseUser));
      if (firebaseUser) {
        const currentHash = window.location.hash.replace(/^#\/?/, '').trim();
        if (VALID_VIEWS.includes(currentHash)) {
          setActiveView(currentHash);
        } else {
          setActiveView(isAdminUser(firebaseUser) ? 'admin' : 'dashboard');
        }
      }
      stopPresence = startPresence(firebaseUser);
      setAuthLoading(false);
    });

    return () => {
      stopPresence();
      unsubscribe();
    };
  }, []);

  useEffect(() => subscribeToUserPlan(auth.currentUser, setSubscription), [user]);

  const handleSignOut = async () => {
    const isGuest = user?.id === 'demo-guest';
    clearChatHistory(user?.id);
    if (isGuest) {
      // Guest has no Firebase session — clear state directly
      setUser(null);
      setIsAuthenticated(false);
      setActiveView('dashboard');
      setSubscription({ plan: 'free', status: 'inactive' });
      return;
    }
    await signOut(auth);
    setUser(null);
    setIsAuthenticated(false);
    setSubscription({ plan: 'free', status: 'inactive' });
  };

  // Toggle Dark/Light Mode
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Clear recommended size passed from calculator
  const clearRecommendation = () => {
    setCalculatorRecommendation(null);
  };

  // Render active view component
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard user={user} onNavigate={setActiveView} onComplaint={() => setComplaintOpen(true)} />;
      case 'calculator':
        return (
          <ConsumptionCalculator 
            user={user}
            subscription={subscription}
            setActiveView={setActiveView} 
            setRecommendation={setCalculatorRecommendation} 
            region={region}
            setRegion={setRegion}
            sunHours={sunHours}
            setSunHours={setSunHours}
            zipCode={zipCode}
            setZipCode={setZipCode}
          />
        );
      case 'estimator':
        return (
          <Estimator 
            recommendation={calculatorRecommendation} 
            clearRecommendation={clearRecommendation} 
            region={region}
            setRegion={setRegion}
            sunHours={sunHours}
            setSunHours={setSunHours}
            zipCode={zipCode}
            setZipCode={setZipCode}
          />
        );
      case 'orientation':
        return <Orientation />;
      case 'chatbot':
        return <Chatbot user={user} subscription={subscription} region={region} sunHours={sunHours} />;
      case 'profile':
        return <Profile user={user} setUser={setUser} onComplaint={() => setComplaintOpen(true)} />;
      case 'admin':
        return isAdminUser(user) ? <Admin user={user} /> : <Dashboard user={user} />;
      case 'plans':
        return <Plans user={user} subscription={subscription} onSelectPlan={(plan) => { setSelectedPlan(plan); setActiveView('paymentMethods'); }} />;
      case 'paymentMethods':
        return <PaymentMethods plan={selectedPlan} onBack={() => setActiveView('plans')} onContinue={(method) => { setSelectedPaymentMethod(method); setActiveView('checkout'); }} />;
      case 'checkout':
        return <Checkout plan={selectedPlan} method={selectedPaymentMethod} user={user} onBack={() => setActiveView('paymentMethods')} onComplete={() => setActiveView('plans')} />;
      default:
        return <Dashboard />;
    }
  };

  const handleAuthenticated = async () => {
    const firebaseUser = auth.currentUser;
    setIsAuthenticated(Boolean(firebaseUser));
    setUser(toAppUser(firebaseUser));
    setActiveView(isAdminUser(firebaseUser) ? 'admin' : 'dashboard');
  };

  const handleGuestLogin = () => {
    setUser({
      id: 'demo-guest',
      email: 'guest@solarpulse.io',
      user_metadata: { full_name: 'Solar Guest Analyst' },
      created_at: new Date().toISOString()
    });
    setIsAuthenticated(true);
    setActiveView('dashboard');
  };

  const profileInitial = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'S';

  const avatarUrl = user?.user_metadata?.avatar_url;

  if (authLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', backgroundColor: 'var(--bg-primary)', flexDirection: 'column', gap: '16px'
      }}>
        <div style={{
          width: 44, height: 44, border: '3px solid rgba(249,115,22,0.2)',
          borderTopColor: 'hsl(var(--color-solar))', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite'
        }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading Solar Pulse...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Auth
        authView={authView}
        setAuthView={setAuthView}
        onAuthenticate={handleAuthenticated}
        onGuestLogin={handleGuestLogin}
      />
    );
  }

  // Nav items details
  const navItems = [
    ...(isAdmin ? [{ id: 'admin', name: 'Admin', icon: <ShieldCheck size={20} /> }] : []),
    { id: 'plans', name: 'Plans', icon: <CreditCard size={20} /> },
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'calculator', name: 'Consumption', icon: <Calculator size={20} /> },
    { id: 'estimator', name: 'Cost & ROI', icon: <DollarSign size={20} /> },
    { id: 'orientation', name: 'Orientation Tuning', icon: <Compass size={20} /> },
    { id: 'chatbot', name: 'AI Chatbot', icon: <MessageSquare size={20} /> },
    { id: 'profile', name: 'Profile', icon: <UserCircle size={20} /> },
  ];

  return (
    <div className="app-container">
      
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header-bar">
          <div className="sidebar-logo">
            <Sun className="logo-icon" size={28} />
            <div>
              <span className="sidebar-brand">Solar Pulse</span>
              <span style={{ display: 'block', fontSize: '0.68rem', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em', fontWeight: 600, marginTop: '1px' }}>
                Solar Sizing &amp; ROI
              </span>
            </div>
          </div>
          <button 
            className="sidebar-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu drawer"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <div 
              key={item.id} 
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveView(item.id);
                setMobileMenuOpen(false);
              }}
            >
              {item.icon}
              <span>{item.name}</span>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {/* Download App Button */}
          <a
            href="/landing/index.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 14px', borderRadius: '10px', marginBottom: '8px',
              background: 'linear-gradient(135deg, hsl(var(--color-solar)), #ef4444)',
              color: '#000', fontWeight: 700, fontSize: '0.8rem',
              textDecoration: 'none', transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            aria-label="Download Solar Pulse mobile app"
          >
            <Download size={14} /> Download App
          </a>
          {/* Support Button */}
          <button
            onClick={() => { setComplaintOpen(true); setMobileMenuOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
              padding: '9px 14px', borderRadius: '10px', marginBottom: '10px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '0.8rem',
              cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            aria-label="Open support and feedback form"
          >
            <HelpCircle size={14} /> Support &amp; Feedback
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)' }}>
            <Leaf size={14} style={{ color: '#10b981' }} />
            <span>Solar Pulse v2.0.0</span>
          </div>
        </div>
      </aside>

      {/* Tap-to-Close Backdrop for Mobile Drawer */}
      <div 
        className={`sidebar-backdrop ${mobileMenuOpen ? 'visible' : ''}`} 
        onClick={() => setMobileMenuOpen(false)} 
        aria-hidden="true" 
      />

      {/* Main Content Wrapper */}
      <div className="main-wrapper">
        
        {/* Topbar Header */}
        <header className="topbar">
          <div className="topbar-title-wrap">
            <button 
              className="mobile-menu-btn" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation drawer' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h1 className="topbar-title">
              {navItems.find(item => item.id === activeView)?.name}
            </h1>
          </div>

          <div className="topbar-actions">
            <button 
              className="theme-toggle-btn" 
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Avatar + dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                className="avatar"
                title={user?.email ? `Signed in as ${user.email}` : 'Account'}
                onClick={() => setAvatarDropdownOpen(prev => !prev)}
                aria-label="Open account menu"
                style={{ cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, hsl(var(--color-solar)) 0%, hsl(var(--color-bat)) 100%)' }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="avatar-image" />
                ) : (
                  profileInitial
                )}
              </button>

              {avatarDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  minWidth: '200px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 200,
                  overflow: 'hidden',
                  animation: 'slideInUp 0.2s ease forwards'
                }}>
                  {/* Account info header */}
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>{user?.user_metadata?.full_name || 'Solar Analyst'}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>{user?.email}</p>
                  </div>
                  {/* View Profile */}
                  <button
                    onClick={() => { setActiveView('profile'); setAvatarDropdownOpen(false); }}
                    style={{
                      width: '100%', padding: '12px 16px', background: 'none', border: 'none',
                      textAlign: 'left', cursor: 'pointer', fontSize: '0.875rem',
                      color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px',
                      transition: 'background var(--transition-fast)'
                    }}
                    className="dropdown-item"
                  >
                    <UserCircle size={16} /> View Profile
                  </button>
                  {/* Support / Complaint */}
                  <button
                    onClick={() => { setComplaintOpen(true); setAvatarDropdownOpen(false); }}
                    style={{
                      width: '100%', padding: '12px 16px', background: 'none', border: 'none',
                      textAlign: 'left', cursor: 'pointer', fontSize: '0.875rem',
                      color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px',
                      transition: 'background var(--transition-fast)'
                    }}
                    className="dropdown-item"
                  >
                    <HelpCircle size={16} /> Support &amp; Feedback
                  </button>
                  {/* Download App */}
                  <a
                    href="/landing/index.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setAvatarDropdownOpen(false)}
                    style={{
                      width: '100%', padding: '12px 16px', background: 'none',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      fontSize: '0.875rem', color: 'var(--text-primary)', textDecoration: 'none',
                      transition: 'background var(--transition-fast)'
                    }}
                    className="dropdown-item"
                  >
                    <Download size={16} /> Download App
                  </a>

                  {/* Sign Out */}
                  <button
                    onClick={() => { handleSignOut(); setAvatarDropdownOpen(false); }}
                    style={{
                      width: '100%', padding: '12px 16px', background: 'none', border: 'none',
                      textAlign: 'left', cursor: 'pointer', fontSize: '0.875rem',
                      color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px',
                      borderTop: '1px solid var(--border-color)',
                      transition: 'background var(--transition-fast)'
                    }}
                    className="dropdown-item"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content View Container */}
        <main className="content-container" onClick={() => setAvatarDropdownOpen(false)}>
          {renderContent()}
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Leaf size={16} style={{ color: '#10b981' }} />
            <span><strong>Solar Pulse</strong> — A premium green engineering simulation platform. Engineered with React and optimized for sustainability.</span>
          </div>
        </footer>

      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <button
          className={`mobile-nav-btn ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => {
            setActiveView('dashboard');
            setMobileMenuOpen(false);
          }}
          aria-label="Dashboard"
        >
          <div className="mobile-nav-icon-wrap">
            <LayoutDashboard size={20} />
          </div>
          <span>Dashboard</span>
        </button>

        <button
          className={`mobile-nav-btn ${activeView === 'calculator' ? 'active' : ''}`}
          onClick={() => {
            setActiveView('calculator');
            setMobileMenuOpen(false);
          }}
          aria-label="Consumption Calculator"
        >
          <div className="mobile-nav-icon-wrap">
            <Calculator size={20} />
          </div>
          <span>Sizing</span>
        </button>

        <button
          className={`mobile-nav-btn ${activeView === 'estimator' ? 'active' : ''}`}
          onClick={() => {
            setActiveView('estimator');
            setMobileMenuOpen(false);
          }}
          aria-label="Cost and ROI"
        >
          <div className="mobile-nav-icon-wrap">
            <DollarSign size={20} />
          </div>
          <span>Cost & ROI</span>
        </button>

        <button
          className={`mobile-nav-btn ${activeView === 'chatbot' ? 'active' : ''}`}
          onClick={() => {
            setActiveView('chatbot');
            setMobileMenuOpen(false);
          }}
          aria-label="AI Chatbot Advisor"
        >
          <div className="mobile-nav-icon-wrap">
            <MessageSquare size={20} />
          </div>
          <span>AI Advisor</span>
        </button>

        <button
          className={`mobile-nav-btn ${['plans', 'orientation', 'profile', 'admin', 'paymentMethods', 'checkout'].includes(activeView) || mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(prev => !prev)}
          aria-label="More navigation options"
          aria-expanded={mobileMenuOpen}
        >
          <div className="mobile-nav-icon-wrap">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </div>
          <span>More</span>
        </button>
      </nav>

      {/* Global Complaint / Support Modal */}
      <ComplaintModal
        isOpen={complaintOpen}
        onClose={() => setComplaintOpen(false)}
        user={user}
      />

    </div>
  );
}
