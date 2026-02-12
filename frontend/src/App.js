import React, { useState, useEffect, useCallback } from 'react';
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from 'sonner';
import { Navbar } from './components/Navbar';
import { MandiCard } from './components/MandiCard';
import { SummaryStats } from './components/SummaryStats';
import { SystemOverview } from './components/SystemOverview';
import { PriceChart } from './components/PriceChart';
import { ArrivalsChart } from './components/ArrivalsChart';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { SimulationPanel } from './components/SimulationPanel';
import { SimulationResults } from './components/SimulationResults';
import { RecommendationPanel } from './components/RecommendationPanel';
import { LandingPage } from './components/LandingPage';
import { JarvisAssistant } from './components/JarvisAssistant';
import { NetworkGraph } from './components/NetworkGraph';
import { CommodityPanel } from './components/CommodityPanel';
import { SurplusDeficitPanel } from './components/SurplusDeficitPanel';
import { TransferRecommendations } from './components/TransferRecommendations';
import { Button } from './components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import { StressGauge } from './components/StressGauge';
import { LinkedMandis } from './components/LinkedMandis';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Dashboard View
const Dashboard = ({ stressData, loading }) => {
  const navigate = useNavigate();

  const handleMandiClick = (mandi) => {
    navigate(`/app/mandi/${mandi.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="loading-spinner">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="dashboard">
      {/* System Stability Overview */}
      {stressData && <SystemOverview data={stressData} />}
      
      {/* Network Graph */}
      {stressData && (
        <div className="network-section">
          <NetworkGraph mandis={stressData.mandis} />
        </div>
      )}
      
      {/* Summary Stats */}
      {stressData && <SummaryStats data={stressData} />}
      
      {/* Mandi Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">MARKET STRESS INDEX</h2>
          <span className="data-label">{stressData?.totalMandis || 0} MANDIS MONITORED</span>
        </div>
        <div className="dashboard-grid">
          {stressData?.mandis.map((mandi, index) => (
            <div 
              key={mandi.id} 
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <MandiCard mandi={mandi} onClick={handleMandiClick} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Mandi Detail View
const MandiDetail = ({ onMandiLoaded }) => {
  const navigate = useNavigate();
  const { mandiId } = useParams();
  const [mandi, setMandi] = useState(null);
  const [linkedMandis, setLinkedMandis] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);

  const fetchMandiDetail = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/mandi/${mandiId}`);
      setMandi(response.data);
      onMandiLoaded && onMandiLoaded(response.data);
      
      // Fetch connected mandis
      if (response.data.connectedMandis?.length > 0) {
        const linkedPromises = response.data.connectedMandis.map(id => 
          axios.get(`${API}/mandi/${id}`)
        );
        const linkedResults = await Promise.all(linkedPromises);
        setLinkedMandis(linkedResults.map(r => r.data));
      }
    } catch (error) {
      console.error('Failed to fetch mandi detail:', error);
      toast.error('Failed to load mandi details');
      navigate('/app');
    } finally {
      setLoading(false);
    }
  }, [mandiId, navigate, onMandiLoaded]);

  const fetchRecommendations = useCallback(async () => {
    setRecLoading(true);
    try {
      const response = await axios.post(`${API}/recommend`, {
        mandiId: mandiId,
        includeAiInsights: true
      });
      setRecommendations(response.data);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setRecLoading(false);
    }
  }, [mandiId]);

  useEffect(() => {
    fetchMandiDetail();
  }, [fetchMandiDetail]);

  useEffect(() => {
    if (mandi) {
      fetchRecommendations();
    }
  }, [mandi, fetchRecommendations]);

  const handleLinkedMandiClick = (linkedMandi) => {
    navigate(`/app/mandi/${linkedMandi.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="loading-detail">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!mandi) return null;

  return (
    <div className="space-y-8 animate-fade-in" data-testid="mandi-detail">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate('/app')}
        className="font-mono text-xs uppercase tracking-wider rounded-xl"
        data-testid="back-btn"
      >
        <ArrowLeft size={14} className="mr-2" />
        Back to Dashboard
      </Button>

      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
            <BarChart3 size={28} className="text-primary" />
          </div>
          <div>
            <h1 className="page-header-title">{mandi.name}</h1>
            <p className="page-header-subtitle">
              {mandi.location} • {mandi.commodity} • Market Stress Index Analysis
            </p>
          </div>
        </div>
      </div>

      {/* Detail Layout */}
      <div className="detail-layout">
        {/* Charts Column */}
        <div className="detail-charts space-y-6">
          <div className="chart-container">
            <PriceChart data={mandi.priceHistory} title="PRICE HISTORY" />
          </div>
          <div className="chart-container">
            <ArrivalsChart data={mandi.arrivalsHistory} title="ARRIVALS HISTORY" />
          </div>
        </div>

        {/* Diagnostics Column */}
        <div className="detail-sidebar space-y-6">
          <DiagnosticsPanel mandi={mandi} />
        </div>
      </div>

      {/* Multi-Commodity & Supply-Demand Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CommodityPanel mandiId={mandiId} mandiName={mandi.name} />
        <SurplusDeficitPanel mandiId={mandiId} />
      </div>

      {/* Linked Mandis */}
      <LinkedMandis 
        linkedMandis={linkedMandis} 
        currentMandiId={mandiId}
        onMandiClick={handleLinkedMandiClick}
      />

      {/* Recommendations */}
      <RecommendationPanel 
        recommendations={recommendations?.recommendations}
        mandiName={mandi.name}
        stressScore={mandi.stressScore}
        isLoading={recLoading}
        onRequestRecommendations={fetchRecommendations}
      />
    </div>
  );
};

// Simulation View
const SimulateView = ({ stressData, onSimulationComplete }) => {
  const [mandis, setMandis] = useState([]);
  const [shockTypes, setShockTypes] = useState([]);
  const [simulationResults, setSimulationResults] = useState(null);
  const [originalMandi, setOriginalMandi] = useState(null);
  const [shockContext, setShockContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchInitialData = useCallback(async () => {
    try {
      const [mandisRes, shockRes] = await Promise.all([
        axios.get(`${API}/mandis`),
        axios.get(`${API}/shock-types`)
      ]);
      setMandis(mandisRes.data.mandis);
      setShockTypes(shockRes.data.shockTypes);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      toast.error('Failed to load simulation data');
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleSimulate = async (params) => {
    setLoading(true);
    try {
      // Fetch original mandi data for comparison
      const mandiRes = await axios.get(`${API}/mandi/${params.mandiId}`);
      setOriginalMandi(mandiRes.data);

      // Store shock context for Jarvis
      if (params.shockDescription) {
        setShockContext({
          description: params.shockDescription,
          detectedSignals: params.detectedSignals || []
        });
      }

      // Run simulation
      const simRes = await axios.post(`${API}/simulate`, params);
      setSimulationResults(simRes.data);
      onSimulationComplete && onSimulationComplete({
        ...simRes.data,
        shockContext: params.shockDescription
      });
      toast.success('Simulation completed');
    } catch (error) {
      console.error('Simulation failed:', error);
      toast.error('Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="loading-simulation">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6" data-testid="simulate-view">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulation Controls */}
        <div className="lg:col-span-1 space-y-6">
          <SimulationPanel 
            mandis={mandis}
            shockTypes={shockTypes}
            onSimulate={handleSimulate}
            isLoading={loading}
          />
          
          {/* Network Graph in Simulation */}
          {stressData && (
            <NetworkGraph 
              mandis={stressData.mandis} 
              simulationTarget={simulationResults?.originalMandiId}
              affectedMandis={simulationResults?.affectedMandis || []}
            />
          )}
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {simulationResults ? (
            <SimulationResults 
              results={simulationResults}
              originalData={originalMandi?.priceHistory || []}
              shockContext={shockContext}
            />
          ) : (
            <div className="bg-card border border-border p-12 text-center rounded-2xl">
              <div className="text-muted-foreground">
                <p className="text-lg font-bold mb-2">NO SIMULATION YET</p>
                <p className="text-sm">Configure and run a simulation to see projected impacts</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Transfer Recommendations */}
      <TransferRecommendations />
    </div>
  );
};

// Alerts View (Risk Monitor)
const AlertsView = () => {
  const navigate = useNavigate();
  const [stressData, setStressData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/stress`);
        setStressData(response.data);
      } catch (error) {
        console.error('Failed to fetch stress data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const highRiskMandis = stressData?.mandis.filter(m => m.status === 'high_risk') || [];
  const watchMandis = stressData?.mandis.filter(m => m.status === 'watch') || [];
  const totalAlerts = highRiskMandis.length + watchMandis.length;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="alerts-view">
      {/* Header */}
      <div className="system-overview-panel p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">SYSTEM RISK MONITOR</h2>
              <p className="text-xs text-muted-foreground font-mono">REAL-TIME THREAT ASSESSMENT</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="font-mono text-3xl font-bold text-red-500">{totalAlerts}</span>
              <p className="text-xs text-muted-foreground font-mono">ACTIVE WARNINGS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Risk */}
      {highRiskMandis.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <h3 className="text-lg font-bold text-red-500 uppercase tracking-wider">CRITICAL RISK</h3>
            <span className="text-xs text-muted-foreground font-mono">({highRiskMandis.length})</span>
          </div>
          {highRiskMandis.map((mandi, index) => (
            <div 
              key={mandi.id}
              className="risk-card risk-card-critical animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => navigate(`/app/mandi/${mandi.id}`)}
              data-testid={`alert-${mandi.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <StressGauge score={mandi.stressScore} size={60} showLabel={false} />
                  <div>
                    <p className="font-mono text-sm font-bold">{mandi.name}</p>
                    <p className="text-xs text-muted-foreground">{mandi.location} • {mandi.commodity}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-mono text-red-500">
                        Price: {mandi.priceChangePct > 0 ? '+' : ''}{mandi.priceChangePct?.toFixed(1)}%
                      </span>
                      <span className="text-xs font-mono text-orange-500">
                        Supply: {mandi.arrivalChangePct?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-3xl font-bold text-red-500">{mandi.stressScore}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">STRESS INDEX</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Elevated Watch */}
      {watchMandis.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full" />
            <h3 className="text-lg font-bold text-orange-500 uppercase tracking-wider">ELEVATED WATCH</h3>
            <span className="text-xs text-muted-foreground font-mono">({watchMandis.length})</span>
          </div>
          {watchMandis.map((mandi, index) => (
            <div 
              key={mandi.id}
              className="risk-card risk-card-watch animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => navigate(`/app/mandi/${mandi.id}`)}
              data-testid={`alert-${mandi.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <StressGauge score={mandi.stressScore} size={60} showLabel={false} />
                  <div>
                    <p className="font-mono text-sm font-bold">{mandi.name}</p>
                    <p className="text-xs text-muted-foreground">{mandi.location} • {mandi.commodity}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-mono text-orange-500">
                        Price: {mandi.priceChangePct > 0 ? '+' : ''}{mandi.priceChangePct?.toFixed(1)}%
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        Supply: {mandi.arrivalChangePct?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-3xl font-bold text-orange-500">{mandi.stressScore}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">STRESS INDEX</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {highRiskMandis.length === 0 && watchMandis.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center justify-center">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <p className="text-lg font-bold text-green-500">SYSTEM STABLE</p>
          <p className="text-sm text-muted-foreground mt-1">All markets operating within normal parameters</p>
        </div>
      )}
    </div>
  );
};

// Main App with Tab Navigation
const MainApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stressData, setStressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMandi, setCurrentMandi] = useState(null);
  const [simulationResults, setSimulationResults] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchStressData = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/stress`);
      setStressData(response.data);
    } catch (error) {
      console.error('Failed to fetch stress data:', error);
      toast.error('Failed to load market data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStressData();
  }, [fetchStressData]);

  // Sync active tab with route
  useEffect(() => {
    if (location.pathname === '/app' || location.pathname === '/app/') {
      setActiveTab('dashboard');
    } else if (location.pathname.includes('/simulate')) {
      setActiveTab('simulate');
    } else if (location.pathname.includes('/alerts')) {
      setActiveTab('alerts');
    }
  }, [location]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'dashboard') navigate('/app');
    else if (tab === 'simulate') navigate('/app/simulate');
    else if (tab === 'alerts') navigate('/app/alerts');
  };

  return (
    <div className="main-container min-h-screen" data-testid="main-app">
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="px-6 md:px-8 lg:px-12 py-8">
        <Routes>
          <Route path="/" element={<Dashboard stressData={stressData} loading={loading} />} />
          <Route path="/mandi/:mandiId" element={<MandiDetail onMandiLoaded={setCurrentMandi} />} />
          <Route path="/simulate" element={<SimulateView stressData={stressData} onSimulationComplete={setSimulationResults} />} />
          <Route path="/alerts" element={<AlertsView />} />
        </Routes>
      </main>
      
      {/* Jarvis Assistant */}
      <JarvisAssistant 
        stressData={stressData}
        currentMandi={currentMandi}
        simulationResults={simulationResults}
      />
    </div>
  );
};

// Landing Wrapper
const LandingWrapper = () => {
  const navigate = useNavigate();

  const handleEnterPlatform = () => {
    navigate('/app');
  };

  const handleRunSimulator = () => {
    navigate('/app/simulate');
  };

  return (
    <LandingPage 
      onEnterPlatform={handleEnterPlatform}
      onRunSimulator={handleRunSimulator}
    />
  );
};

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'hsl(240 6% 10%)',
            border: '1px solid hsl(240 5% 18%)',
            color: '#f8fafc',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            borderRadius: '12px',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingWrapper />} />
        <Route path="/app/*" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
