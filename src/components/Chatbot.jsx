import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  RotateCcw, 
  Bot, 
  User
} from 'lucide-react';
import { queryLocalExpert } from '../utils/solarExpert';

export default function Chatbot({ user, subscription, region, sunHours }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const chatEndRef = useRef(null);

  const getProfessionalGreeting = () =>
    `Welcome to Solar Pulse AI Advisor. I provide concise, engineering-backed guidance on solar panels, system sizing, battery backup, and energy savings.`;

  // Suggested prompt chips
  const suggestions = [
    "Monocrystalline vs Polycrystalline?",
    "How does Net Metering work?",
    "Do I need batteries for backup?",
    "How much does solar cost & save?"
  ];

  // Initialize messages from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('solar_pulse_chat_history');
    if (savedHistory) {
      try {
        setMessages(JSON.parse(savedHistory));
      } catch {
        localStorage.removeItem('solar_pulse_chat_history');
      }
    } else {
      const initialGreeting = {
        id: 1,
        sender: 'bot',
        text: `${getProfessionalGreeting()}\n\nHow can I help with your solar plans today? Ask a question or select a prompt below.`,
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

  // Text streaming simulator (mimics word-by-word LLM responses)
  const streamText = (fullText, messageId, sources = []) => {
    let currentIdx = 0;
    const words = fullText.split(' ');
    
    // Insert an empty bot message
    setMessages(prev => [
      ...prev,
      {
        id: messageId,
        sender: 'bot',
        text: '',
        sources,
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
            return { ...msg, text: fullText, sources, isStreaming: false };
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
    }, 28);
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
      const { answer, sources } = queryLocalExpert(query);
      setTimeout(() => {
        streamText(answer, botMessageId, sources);
      }, 250);
    } catch (error) {
      console.error('AI chat error:', error);
      const errMsg = "I encountered an unexpected issue while retrieving solar intelligence. Please try rephrasing your question.";
      
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

  // Clear chat logs (in-app confirmation)
  const clearChatLogs = () => {
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
    const initialGreeting = {
      id: 1,
      sender: 'bot',
      text: `${getProfessionalGreeting()}\n\nConversation cleared. How can I assist you with your next solar inquiry?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([initialGreeting]);
    localStorage.removeItem('solar_pulse_chat_history');
    setShowClearConfirm(false);
  };

  const cancelClear = () => setShowClearConfirm(false);

  // Simple Markdown UI Parser (renders bold, headers, list items nicely in UI)
  const renderMarkdown = (text) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let content = line;

      // Handle headers: ### Header
      if (content.startsWith('### ')) {
        return <h4 key={idx} style={{ marginTop: '12px', marginBottom: '6px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{content.replace('### ', '')}</h4>;
      }
      if (content.startsWith('## ')) {
        return <h3 key={idx} style={{ marginTop: '16px', marginBottom: '8px', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>{content.replace('## ', '')}</h3>;
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
        <p key={idx} style={{ marginBottom: idx === lines.length - 1 ? 0 : '8px', color: 'var(--text-secondary)' }}>
          {elements}
        </p>
      );
    });
  };

  return (
    <div className="animate-slide-up chatbot-container">
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={22} className="logo-icon" />
            Solar AI Advisor
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'hsl(var(--color-gen))' }} />
            <span>Solar Intelligence Active • Concise Guidance</span>
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-outline" onClick={clearChatLogs} style={{ padding: '8px', borderRadius: '50%', width: '38px', height: '38px' }} title="Clear conversation history" aria-label="Clear conversation history">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* In-app confirmation modal to avoid browser native confirm */}
      {showClearConfirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Clear conversation confirmation">
          <div className="modal-card">
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Clear conversation?</h3>
            <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>This will permanently remove all messages in this chat. This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-outline" onClick={cancelClear}>Cancel</button>
              <button className="btn-danger" onClick={confirmClear}>Clear Conversation</button>
            </div>
          </div>
        </div>
      )}

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

                {/* Source Attribution */}
                {msg.sender === 'bot' && !msg.isStreaming && msg.sources && msg.sources.length > 0 && (
                  <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      📚 Source
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {msg.sources.map((src, si) => (
                        <span key={si} title={`${src.source} — ${src.category}`} style={{
                          fontSize: '0.68rem',
                          padding: '2px 8px',
                          borderRadius: '99px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-secondary)',
                          color: src.confidence === 'high' ? 'hsl(var(--color-gen))' : src.confidence === 'medium' ? 'hsl(var(--color-solar))' : 'var(--text-muted)',
                          cursor: 'default',
                          whiteSpace: 'nowrap',
                          maxWidth: '220px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          ● {src.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

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
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Advisor consulting knowledge base...</span>
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
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
