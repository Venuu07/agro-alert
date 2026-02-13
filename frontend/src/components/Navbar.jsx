import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, BarChart3, Zap, LogOut } from 'lucide-react';
import { TierToggle } from './TierToggle';
import { useTier } from '../context/TierContext';

export const Navbar = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate();
  const { logout, isPremium } = useTier();
  
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'simulate', label: 'Shock Engine', icon: Zap },
    { id: 'alerts', label: 'Risk Monitor', icon: AlertTriangle },
  ];

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar-glass sticky top-0 z-50" data-testid="navbar">
      <div className="px-6 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Clickable to Landing Page */}
          <div 
            className="flex items-center gap-3 cursor-pointer transition-opacity hover:opacity-80"
            onClick={handleLogoClick}
            data-testid="logo-link"
          >
            <div className="w-9 h-9 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-center float-animation">
              <Activity size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">AGRO INTEL</h1>
              <p className="text-[9px] text-muted-foreground font-mono tracking-wider">
                DECISION INTELLIGENCE
              </p>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider
                    transition-all duration-300 rounded-xl
                    ${isActive 
                      ? 'text-primary bg-primary/10 border border-primary/30' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent'
                    }
                  `}
                  data-testid={`nav-${tab.id}`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-3">
            <TierToggle />
            <button
              onClick={handleLogout}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                isPremium 
                  ? 'border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/5' 
                  : 'border-border hover:border-primary/30 hover:bg-secondary/50'
              }`}
              data-testid="logout-btn"
              title="Sign out"
            >
              <LogOut size={14} className="text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
