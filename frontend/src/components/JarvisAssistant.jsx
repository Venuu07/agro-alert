import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Send, X, Minimize2, Maximize2, Sparkles, Loader2, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const JarvisAssistant = ({ 
  systemContext = {}, 
  currentMandi = null,
  simulationResults = null,
  stressData = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `I'm **Jarvis**, your Decision Intelligence Assistant. I can help you understand:\n\n• **Market Stress Signals** - Why specific mandis are flagged\n• **Price Dynamics** - Supply-demand impacts on pricing\n• **Shock Propagation** - How disruptions ripple through networks\n• **Surplus/Deficit Status** - Supply-demand balance analysis\n• **Transfer Strategies** - Commodity redistribution recommendations\n• **Stabilization Strategies** - Best intervention approaches\n\nWhat would you like to analyze?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const buildSystemContext = useCallback(() => {
    let context = [];

    if (stressData) {
      const highRisk = stressData.mandis?.filter(m => m.status === 'high_risk') || [];
      const watch = stressData.mandis?.filter(m => m.status === 'watch') || [];
      context.push(`**System Overview:**`);
      context.push(`- Total Mandis: ${stressData.totalMandis}`);
      context.push(`- High Risk: ${highRisk.length} (${highRisk.map(m => m.name).join(', ') || 'None'})`);
      context.push(`- Watch: ${watch.length}`);
      context.push(`- Average System Stress: ${Math.round(stressData.mandis?.reduce((sum, m) => sum + m.stressScore, 0) / stressData.mandis?.length || 0)}/100`);
    }

    if (currentMandi) {
      context.push(`\n**Current Mandi Analysis (${currentMandi.name}):**`);
      context.push(`- Location: ${currentMandi.location}`);
      context.push(`- Commodity: ${currentMandi.commodity}`);
      context.push(`- Stress Score: ${currentMandi.stressScore}/100 (${currentMandi.status})`);
      context.push(`- Current Price: ₹${currentMandi.currentPrice}/quintal`);
      context.push(`- Price Change: ${currentMandi.priceChangePct?.toFixed(1)}%`);
      context.push(`- Arrivals: ${currentMandi.arrivals} quintals`);
      context.push(`- Arrival Change: ${currentMandi.arrivalChangePct?.toFixed(1)}%`);
      context.push(`- Volatility: ${currentMandi.volatility?.toFixed(1)}%`);
      if (currentMandi.stressBreakdown) {
        context.push(`- Stress Breakdown: Price(${currentMandi.stressBreakdown.priceStress}), Supply(${currentMandi.stressBreakdown.supplyStress}), Volatility(${currentMandi.stressBreakdown.instabilityStress}), External(${currentMandi.stressBreakdown.externalStress})`);
      }
      if (currentMandi.rainFlag) context.push(`- ⚠️ Rain Flag Active`);
      if (currentMandi.festivalFlag) context.push(`- 🎉 Festival Period Active`);
    }

    if (simulationResults) {
      context.push(`\n**Recent Simulation Results:**`);
      context.push(`- Shock Type: ${simulationResults.shockType}`);
      context.push(`- Target: ${simulationResults.originalMandi}`);
      context.push(`- Intensity: ${simulationResults.intensity}%`);
      context.push(`- Price Impact: ${simulationResults.priceImpact?.toFixed(1)}%`);
      context.push(`- Original Price: ₹${simulationResults.originalPrice}`);
      context.push(`- Predicted Price: ₹${Math.round(simulationResults.predictedPrice)}`);
      context.push(`- Stress Change: ${simulationResults.previousStressScore} → ${simulationResults.newStressScore}`);
      if (simulationResults.affectedMandis?.length > 0) {
        context.push(`- Affected Markets: ${simulationResults.affectedMandis.map(m => `${m.mandiName}(+${m.priceChange?.toFixed(1)}%)`).join(', ')}`);
      }
      // Include shock context if available
      if (simulationResults.shockContext) {
        context.push(`- User-Described Context: "${simulationResults.shockContext}"`);
      }
    }

    return context.join('\n');
  }, [stressData, currentMandi, simulationResults]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const systemContextStr = buildSystemContext();
      const response = await axios.post(`${API}/jarvis/chat`, {
        message: userMessage,
        systemContext: systemContextStr,
        conversationHistory: messages.slice(-6).map(m => ({
          role: m.role,
          content: m.content
        })),
        // Include shock context for enhanced interpretation
        shockContext: simulationResults?.shockContext || null
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.response 
      }]);
    } catch (error) {
      console.error('Jarvis chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an issue processing your request. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQueries = [
    "Why is this mandi High Risk?",
    "Explain surplus/deficit status",
    "Best transfer strategy?",
    "Explain the ripple effects"
  ];

  const handleSuggestedQuery = (query) => {
    setInput(query);
    inputRef.current?.focus();
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="jarvis-fab"
        data-testid="jarvis-fab"
      >
        <div className="jarvis-fab-glow" />
        <div className="jarvis-fab-inner">
          <Sparkles size={24} className="text-primary" />
        </div>
        <span className="jarvis-fab-label">Jarvis</span>
      </button>
    );
  }

  return (
    <div 
      className={`jarvis-panel ${isMinimized ? 'jarvis-minimized' : ''}`}
      data-testid="jarvis-panel"
    >
      {/* Header */}
      <div className="jarvis-header">
        <div className="flex items-center gap-3">
          <div className="jarvis-avatar">
            <Sparkles size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Jarvis</h3>
            <p className="text-[10px] text-muted-foreground font-mono">DECISION INTELLIGENCE ASSISTANT</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="jarvis-control-btn"
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="jarvis-control-btn"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="jarvis-messages">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`jarvis-message ${message.role === 'user' ? 'jarvis-message-user' : 'jarvis-message-assistant'}`}
              >
                {message.role === 'assistant' && (
                  <div className="jarvis-message-avatar">
                    <Sparkles size={12} className="text-primary" />
                  </div>
                )}
                <div className="jarvis-message-content">
                  {message.content.split('\n').map((line, i) => (
                    <p key={i} className={line.startsWith('•') ? 'ml-2' : ''}>
                      {line.startsWith('**') && line.endsWith('**') 
                        ? <strong>{line.slice(2, -2)}</strong>
                        : line.includes('**') 
                          ? line.split('**').map((part, j) => 
                              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                            )
                          : line
                      }
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="jarvis-message jarvis-message-assistant">
                <div className="jarvis-message-avatar">
                  <Sparkles size={12} className="text-primary" />
                </div>
                <div className="jarvis-message-content">
                  <div className="jarvis-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Queries */}
          {messages.length <= 2 && (
            <div className="jarvis-suggestions">
              <p className="text-[10px] text-muted-foreground font-mono mb-2">SUGGESTED QUERIES</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQueries.map((query, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSuggestedQuery(query)}
                    className="jarvis-suggestion-chip"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="jarvis-input-container">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about market conditions..."
              className="jarvis-input"
              rows={1}
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="jarvis-send-btn"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default JarvisAssistant;
