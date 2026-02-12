import React from 'react';
import { Activity, AlertTriangle, BarChart3, Zap } from 'lucide-react';

export const Navbar = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'simulate', label: 'Shock Engine', icon: Zap },
    { id: 'alerts', label: 'Risk Monitor', icon: AlertTriangle },
  ];

  return (
    <nav className="navbar-glass sticky top-0 z-50" data-testid="navbar">
      <div className="px-6 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary flex items-center justify-center float-animation">
              <Activity size={18} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">AGRO INTEL</h1>
              <p className="text-[10px] text-muted-foreground font-mono tracking-wider">
                DECISION INTELLIGENCE PLATFORM
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
                    flex items-center gap-2 px-4 py-2 text-sm font-mono uppercase tracking-wider
                    transition-all duration-300
                    ${isActive 
                      ? 'text-primary bg-primary/10 border border-primary/30' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }
                  `}
                  data-testid={`nav-${tab.id}`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
