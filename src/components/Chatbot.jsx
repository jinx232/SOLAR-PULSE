import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Settings, 
  Sparkles, 
  RotateCcw, 
  Bot, 
  User, 
  Info, 
  X, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { queryLocalExpert, queryGeminiAPI } from '../utils/solarExpert';

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Settings Panel States
  const [showSettings, setShowSettings] = useState(false);
  const [useLiveAI, setUseLiveAI] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [isKeyValid, setIsKeyValid] = useState(null);

  const chatEndRef = useRef(null);

  // Suggested prompt chips
  const suggestions = [
    "Monocrystalline vs Polycrystalline?",
    "How does Net Metering work?",
    "Do I need batteries for backup?",
    "How much does solar cost & save?"
  ];

  // Initialize messages & loads configurations from localStorage
  useEffect(() => {
    // Load Gemini configurations
    const savedKey = localStorage.getItem('solar_pulse_gemini_key');
    const savedUseLive = localStorage.getItem('solar_pulse_use_live');
    
    if (savedKey) {
      setGeminiKey(savedKey);
      setIsKeyValid(true);
    }
    if (savedUseLive === 'true' && savedKey) {
      setUseLiveAI(true);
    }

    // Load or generate initial history
    const savedHistory = localStorage.getItem('solar_pulse_chat_history');
    if (savedHistory) {
      setMessages(JSON.parse(savedHistory));
    } else {
      const initialGreeting = {
        id: 1,
        sender: 'bot',
        text: `Hello! I'm your **Solar Pulse AI Advisor**. ☀️

I'm loaded with solar intelligence and can help you with:
* Choosing panel types (**Monocrystalline vs Polycrystalline**)
* Explaining financial incentives (**30% Tax Credits, SRECs**)
* Detailing **Net Metering** and Grid interactions
* Sizing your system or understanding battery storage.

Ask me anything or select a prompt suggestion below to begin!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([initialGreeting]);
    }
  }, []);

  // Save history to localstorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('solar_pulse_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle API Key storage
  const handleSaveSettings = (key, liveToggle) => {
    localStorage.setItem('solar_pulse_gemini_key', key);
    localStorage.setItem('solar_pulse_use_live', liveToggle ? 'true' : 'false');
    
    if (key.trim()) {
      setIsKeyValid(true);
    } else {
      setIsKeyValid(false);
      setUseLiveAI(false);
      localStorage.setItem('solar_pulse_use_live', 'false');
    }
  };

  // Text streaming simulator (mimics word-by-word LLM responses)
  const streamText = (fullText, messageId) => {
    let currentIdx = 0;
    const words = fullText.split(' ');
    
    // Insert an empty bot message
    setMessages(prev => [
      ...prev,
      {
        id: messageId,
        sender: 'bot',
        text: '',
        isStreaming: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    const interval = setInterval(() => {
      if (currentIdx >= words.length) {
        clearInterval(interval);
        // Mark streaming finished
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return { ...msg, text: fullText, isStreaming: false };
          }
          return msg;
        }));
        setIsLoading(false);
      } else {
        const partialText = words.slice(0, currentIdx + 1).join(' ');
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return { ...msg, text: partialText };
          }
          return msg;
        }));
        currentIdx++;
      }
    }, 40); // 40ms per word represents premium streaming speed!
  };

  // Send message
  const handleSendMessage = async (textToSend) => {
    const query = textToSend.trim();
    if (!query) return;

    setInputText('');
    setIsLoading(true);

    const userMessageId = Date.now();
    const botMessageId = userMessageId + 1;

    // Push User message
    const newUserMsg = {
      id: userMessageId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newUserMsg]);

    try {
      if (useLiveAI && geminiKey) {
        // Query Google Gemini API (Free Generative AI endpoint)
        // Strip out the current message to feed chat context
        const chatHistory = messages.map(msg => ({
          sender: msg.sender,
          text: msg.text
        }));

        const answer = await queryGeminiAPI(query, chatHistory, geminiKey);
        streamText(answer, botMessageId);
      } else {
        // Query offline Expert Knowledge Base
        const answer = queryLocalExpert(query);
        // Add artificial delay for realism
        setTimeout(() => {
          streamText(answer, botMessageId);
        }, 800);
      }
    } catch (error) {
      console.error('AI chat error:', error);
      const errMsg = `⚠️ **API Error**: Unable to contact the AI model. 

*Reason: ${error.message}*

**Troubleshooting Steps**:
1. Check your network connection.
2. Confirm your Gemini API Key in the **Settings Cog ⚙️** is active and valid.
3. Toggle off **Live AI Engine** in settings to fall back to the offline Solar Expert Brain instantly.`;
      
      setMessages(prev => [
        ...prev,
        {
          id: botMessageId,
          sender: 'bot',
          text: errMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputText);
    }
  };

  // Clear chat logs
  const clearChatLogs = () => {
    if (window.confirm("Clear all active chat logs?")) {
      const initialGreeting = {
        id: 1,
        sender: 'bot',
        text: `Hello! Chat log has been reset. Ask me any solar monitoring questions.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([initialGreeting]);
      localStorage.removeItem('solar_pulse_chat_history');
    }
  };

  // Simple Markdown UI Parser (renders bold, headers, list items nicely in UI)
  const renderMarkdown = (text) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let content = line;

      // Handle headers: ### Header
      if (content.startsWith('### ')) {
        return <h4 key={idx} style={{ marginTop: '16px', marginBottom: '8px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{content.replace('### ', '')}</h4>;
      }
      if (content.startsWith('## ')) {
        return <h3 key={idx} style={{ marginTop: '20px', marginBottom: '10px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{content.replace('## ', '')}</h3>;
      }

      // Handle bullet list: * item or - item
      const isListItem = content.startsWith('* ') || content.startsWith('- ');
      if (isListItem) {
        content = content.substring(2);
      }

      // Parse bold **text** -> <strong>text</strong>
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(content)) !== null) {
        // Text before the match
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        // Bolded match
        parts.push(<strong key={match.index} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }

      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }

      const elements = parts.length > 0 ? parts : content;

      if (isListItem) {
        return (
          <li key={idx} style={{ marginLeft: '20px', marginBottom: '4px', listStyleType: 'disc', color: 'var(--text-secondary)' }}>
            {elements}
          </li>
        );
      }

      return (
        <p key={idx} style={{ marginBottom: '10px', color: 'var(--text-secondary)' }}>
          {elements}
        </p>
      );
    });
  };

  return (
    <div className="animate-slide-up" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 130px)',
      position: 'relative'
    }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={22} className="logo-icon" />
            Solar AI Advisor
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {useLiveAI ? 'Connected to Live Gemini AI Engine' : 'Offline Solar Expert Reasoning Engine Active'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-outline" onClick={clearChatLogs} style={{ padding: '8px', borderRadius: '50%', width: '38px', height: '38px' }} title="Reset Chat Logs" aria-label="Reset chat logs">
            <RotateCcw size={16} />
          </button>
          <button 
            className="btn-outline" 
            onClick={() => setShowSettings(!showSettings)}
            style={{ 
              padding: '8px', 
              borderRadius: '50%', 
              width: '38px', 
              height: '38px',
              borderColor: useLiveAI ? 'hsl(var(--color-solar))' : 'var(--border-color)',
              color: useLiveAI ? 'hsl(var(--color-solar))' : 'var(--text-primary)'
            }} 
            title="AI Config Settings"
            aria-label="Open AI settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Main chat window container */}
      <div className="premium-card" style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '0', 
        overflow: 'hidden',
        position: 'relative'
      }}>
        
        {/* Messages viewport */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ 
              display: 'flex', 
              gap: '12px',
              maxWidth: '85%',
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
            }}>
              
              {/* Avatar */}
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                backgroundColor: msg.sender === 'user' ? 'hsl(var(--color-solar))' : 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: msg.sender === 'user' ? 'white' : 'hsl(var(--color-solar))',
                flexShrink: 0
              }}>
                {msg.sender === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>

              {/* Text Bubble */}
              <div style={{
                backgroundColor: msg.sender === 'user' ? 'var(--color-solar-glow)' : 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: msg.sender === 'user' ? '18px 2px 18px 18px' : '2px 18px 18px 18px',
                padding: '14px 18px',
                boxShadow: 'var(--shadow-sm)',
                fontSize: '0.9rem',
                lineHeight: '1.6'
              }}>
                {renderMarkdown(msg.text)}
                <span style={{ 
                  display: 'block', 
                  textAlign: msg.sender === 'user' ? 'right' : 'left', 
                  fontSize: '0.7rem', 
                  color: 'var(--text-muted)',
                  marginTop: '8px'
                }}>
                  {msg.timestamp}
                </span>
              </div>

            </div>
          ))}

          {isLoading && (
            <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--color-solar))'
              }}>
                <Bot size={18} />
              </div>
              <div style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '2px 18px 18px 18px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span className="logo-icon" style={{ fontSize: '1.2rem' }}>●</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Advisor reasoning...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input & Suggestions Deck */}
        <div style={{ 
          padding: '16px 24px', 
          borderTop: '1px solid var(--border-color)', 
          backgroundColor: 'var(--bg-primary)'
        }}>
          
          {/* Prompt suggestions row — shown until user sends first message */}
          {messages.filter(m => m.sender === 'user').length === 0 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '4px' }}>
              {suggestions.map((sug, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleSendMessage(sug)}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '99px',
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    color: 'var(--text-secondary)',
                    transition: 'all var(--transition-fast)'
                  }}
                  className="btn-outline"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Message input elements */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about panels, sizing, batteries, tax credits..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'none',
                height: '48px',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                transition: 'all var(--transition-fast)'
              }}
            />
            <button 
              className="btn-primary" 
              onClick={() => handleSendMessage(inputText)}
              disabled={isLoading || !inputText.trim()}
              style={{ width: '48px', height: '48px', padding: '0', borderRadius: '12px' }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Sliding settings overlay drawer */}
        {showSettings && (
          <div style={{
            position: 'absolute',
            top: 0, right: 0, bottom: 0,
            width: '320px',
            backgroundColor: 'var(--bg-secondary)',
            borderLeft: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 30,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            animation: 'slideInRight var(--transition-normal)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Advisor Engine Config</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Live AI Toggle Switch */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'block' }}>Live AI Engine</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Query Google Gemini API</span>
              </div>
              {/* Premium CSS Toggle Switch */}
              <label className="toggle-switch" aria-label="Toggle live AI engine">
                <input 
                  type="checkbox"
                  checked={useLiveAI}
                  disabled={!geminiKey}
                  onChange={(e) => {
                    setUseLiveAI(e.target.checked);
                    handleSaveSettings(geminiKey, e.target.checked);
                  }}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Gemini Key Input */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>
                <span>Gemini API Key</span>
                {isKeyValid && <span style={{ color: 'hsl(var(--color-gen))' }}>Active ✓</span>}
              </label>
              <input 
                type="password"
                value={geminiKey}
                onChange={(e) => {
                  setGeminiKey(e.target.value);
                  handleSaveSettings(e.target.value, useLiveAI);
                }}
                placeholder="AIzaSy..."
                className="form-input"
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            {/* Educational guide banner on how to fetch keys */}
            <div style={{
              padding: '14px',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              fontSize: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontWeight: 'bold' }}>
                <HelpCircle size={14} style={{ color: 'hsl(var(--color-solar))' }} />
                <span>How to get a free API Key:</span>
              </div>
              <p>1. Go to the [Google AI Studio Console](https://aistudio.google.com/).</p>
              <p>2. Log in with your standard Gmail account.</p>
              <p>3. Click **"Get API Key"** and copy your token.</p>
              <p>4. Paste your token above, and check the toggle box to unlock full conversational capability!</p>
            </div>

            <button className="btn-primary" onClick={() => setShowSettings(false)} style={{ marginTop: 'auto', width: '100%', fontSize: '0.85rem' }}>
              Apply Configurations
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
