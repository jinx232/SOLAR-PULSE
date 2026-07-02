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
  ChevronDown
} from 'lucide-react';

import { supabase } from './utils/supabase';

// Subcomponents
import Dashboard from './components/Dashboard';
import ConsumptionCalculator from './components/Calculator';
import Estimator from './components/Estimator';
import Chatbot from './components/Chatbot';
import Orientation from './components/Orientation';
import Profile from './components/Profile';
import Auth from './components/Auth';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState('signin');
  const [activeView, setActiveView] = useState('dashboard');
  const [theme, setTheme] = useState('dark'); // 'dark' is default for professional premium look
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  
  // Shared state: passed from Calculator to Estimator
  const [calculatorRecommendation, setCalculatorRecommendation] = useState(null);

  // Geographic Location & Irradiance Shared States
  const [region, setRegion] = useState('Southwest');
  const [sunHours, setSunHours] = useState(5.8);
  const [zipCode, setZipCode] = useState('90210');

  // Sync theme with HTML data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Update document title per active view
  useEffect(() => {
    const viewNames = {
      dashboard: 'Dashboard',
      calculator: 'Consumption Calculator',
      estimator: 'Cost & ROI',
      orientation: 'Orientation Tuning',
      chatbot: 'AI Chatbot',
      profile: 'Profile'
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

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      setIsAuthenticated(Boolean(session));
      setUser(session?.user ?? null);
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(Boolean(session));
      setUser(session?.user ?? null);
      if (!session) {
        setActiveView('dashboard');
      }
    });

    return () => authListener?.subscription?.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
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
        return <Dashboard user={user} />;
      case 'calculator':
        return (
          <ConsumptionCalculator 
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
        return <Chatbot />;
      case 'profile':
        return <Profile user={user} setUser={setUser} />;
      default:
        return <Dashboard />;
    }
  };

  const handleAuthenticated = async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    setIsAuthenticated(Boolean(session));
    setUser(session?.user ?? null);
    setActiveView('dashboard');
  };

  const profileInitial = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'S';

  const avatarUrl = user?.user_metadata?.avatar_url;

  if (!isAuthenticated) {
    return (
      <Auth
        authView={authView}
        setAuthView={setAuthView}
        onAuthenticate={handleAuthenticated}
      />
    );
  }

  // Nav items details
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },    { id: 'calculator', name: 'Consumption', icon: <Calculator size={20} /> },
    { id: 'estimator', name: 'Cost & ROI', icon: <DollarSign size={20} /> },
    { id: 'orientation', name: 'Orientation Tuning', icon: <Compass size={20} /> },
    { id: 'chatbot', name: 'AI Chatbot', icon: <MessageSquare size={20} /> },
    { id: 'profile', name: 'Profile', icon: <UserCircle size={20} /> },
  ];

  return (
    <div className="app-container">
      
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <Sun className="logo-icon" size={28} />
          <span className="sidebar-brand">Solar Pulse</span>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)' }}>
            <Leaf size={14} style={{ color: '#10b981' }} />
            <span>Solar Pulse v1.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="main-wrapper">
        
        {/* Topbar Header */}
        <header className="topbar">
          <div className="topbar-title-wrap">
            <button 
              className="mobile-menu-btn" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
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
            <span><strong>Solar Pulse</strong> — A premium green engineering simulation platform. Engineered with React and optimized for sustainability.</span>          </div>
        </footer>

      </div>

    </div>
  );
}
