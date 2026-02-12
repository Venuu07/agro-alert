import React, { useState, useEffect, useCallback } from 'react';
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
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
import { Button } from './components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Dashboard View
const Dashboard = () => {
  const navigate = useNavigate();
  const [stressData, setStressData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleMandiClick = (mandi) => {
    navigate(`/mandi/${mandi.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="loading-spinner">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard">
      {/* System Stability Overview */}
      {stressData && <SystemOverview data={stressData} />}
      
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
const MandiDetail = () => {
  const navigate = useNavigate();
  const { mandiId } = useParams();
  const [mandi, setMandi] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);

  const fetchMandiDetail = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/mandi/${mandiId}`);
      setMandi(response.data);
    } catch (error) {
      console.error('Failed to fetch mandi detail:', error);
      toast.error('Failed to load mandi details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [mandiId, navigate]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="loading-detail">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!mandi) return null;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="mandi-detail">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate('/')}
        className="font-mono uppercase tracking-wider"
        data-testid="back-btn"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Dashboard
      </Button>

      {/* Detail Layout */}
      <div className="detail-layout">
        {/* Charts Column */}
        <div className="detail-charts">
          <PriceChart data={mandi.priceHistory} title="PRICE HISTORY" />
          <ArrivalsChart data={mandi.arrivalsHistory} title="ARRIVALS HISTORY" />
        </div>

        {/* Diagnostics Column */}
        <div className="detail-sidebar">
          <DiagnosticsPanel mandi={mandi} />
        </div>
      </div>

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
const SimulateView = () => {
  const [mandis, setMandis] = useState([]);
  const [shockTypes, setShockTypes] = useState([]);
  const [simulationResults, setSimulationResults] = useState(null);
  const [originalMandi, setOriginalMandi] = useState(null);
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

      // Run simulation
      const simRes = await axios.post(`${API}/simulate`, params);
      setSimulationResults(simRes.data);
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
    <div className="animate-fade-in" data-testid="simulate-view">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulation Controls */}
        <div className="lg:col-span-1">
          <SimulationPanel 
            mandis={mandis}
            shockTypes={shockTypes}
            onSimulate={handleSimulate}
            isLoading={loading}
          />
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {simulationResults ? (
            <SimulationResults 
              results={simulationResults}
              originalData={originalMandi?.priceHistory || []}
            />
          ) : (
            <div className="bg-card border border-border p-12 text-center">
              <div className="text-muted-foreground">
                <p className="text-lg font-bold mb-2">NO SIMULATION YET</p>
                <p className="text-sm">Configure and run a simulation to see projected impacts</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Alerts View (placeholder)
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

  return (
    <div className="space-y-6 animate-fade-in" data-testid="alerts-view">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">ACTIVE ALERTS</h2>
        <span className="data-label">{highRiskMandis.length + watchMandis.length} ALERTS</span>
      </div>

      {/* High Risk */}
      {highRiskMandis.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-red-500">HIGH RISK</h3>
          {highRiskMandis.map((mandi) => (
            <div 
              key={mandi.id}
              className="p-4 bg-red-500/5 border border-red-500/30 flex items-center justify-between cursor-pointer hover:bg-red-500/10 transition-colors"
              onClick={() => navigate(`/mandi/${mandi.id}`)}
              data-testid={`alert-${mandi.id}`}
            >
              <div>
                <p className="font-mono text-sm">{mandi.name}</p>
                <p className="text-xs text-muted-foreground">{mandi.location} • {mandi.commodity}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-2xl text-red-500">{mandi.stressScore}</p>
                <p className="text-xs text-muted-foreground">stress score</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Watch */}
      {watchMandis.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-orange-500">UNDER WATCH</h3>
          {watchMandis.map((mandi) => (
            <div 
              key={mandi.id}
              className="p-4 bg-orange-500/5 border border-orange-500/30 flex items-center justify-between cursor-pointer hover:bg-orange-500/10 transition-colors"
              onClick={() => navigate(`/mandi/${mandi.id}`)}
              data-testid={`alert-${mandi.id}`}
            >
              <div>
                <p className="font-mono text-sm">{mandi.name}</p>
                <p className="text-xs text-muted-foreground">{mandi.location} • {mandi.commodity}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-2xl text-orange-500">{mandi.stressScore}</p>
                <p className="text-xs text-muted-foreground">stress score</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {highRiskMandis.length === 0 && watchMandis.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-bold">NO ACTIVE ALERTS</p>
          <p className="text-sm">All mandis are operating normally</p>
        </div>
      )}
    </div>
  );
};

// Main App with Tab Navigation
const MainApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'dashboard') navigate('/');
    else if (tab === 'simulate') navigate('/simulate');
    else if (tab === 'alerts') navigate('/alerts');
  };

  return (
    <div className="main-container min-h-screen" data-testid="main-app">
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="px-6 md:px-8 lg:px-12 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mandi/:mandiId" element={<MandiDetail />} />
          <Route path="/simulate" element={<SimulateView />} />
          <Route path="/alerts" element={<AlertsView />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#121212',
            border: '1px solid #27272a',
            color: '#f8fafc',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
          },
        }}
      />
      <MainApp />
    </BrowserRouter>
  );
}

export default App;
