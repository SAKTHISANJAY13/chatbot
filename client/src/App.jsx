import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './index.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
  };

  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => {
    setDarkMode((d) => {
      const next = !d;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    // Auto-expand textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Add placeholder for AI response
      let aiMessageIndex = newMessages.length;
      setMessages([...newMessages, { role: 'assistant', content: '', isStreaming: true }]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) {
                setMessages((prevMessages) => {
                  const updatedMessages = [...prevMessages];
                  updatedMessages[updatedMessages.length - 1].isStreaming = false;
                  return updatedMessages;
                });
              } else if (data.text) {
                setMessages((prevMessages) => {
                  const updatedMessages = [...prevMessages];
                  const lastMsg = updatedMessages[updatedMessages.length - 1];
                  lastMsg.content += data.text;
                  return updatedMessages;
                });
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request cancelled');
      } else {
        console.error('Error:', error);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: 'assistant',
            content: `Error: ${error.message}`,
            isError: true,
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleStopGenerating = () => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        const lastMsg = updatedMessages[updatedMessages.length - 1];
        if (lastMsg?.isStreaming) {
          lastMsg.isStreaming = false;
        }
        return updatedMessages;
      });
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-md">
              💬
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900">ChatBot</h1>
              <p className="text-xs text-slate-500">AI Assistant</p>
            </div>
          </div>
          <button
            onClick={handleNewChat}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg py-2.5 px-3 text-sm font-semibold transition duration-200 shadow-sm hover:shadow-md"
          >
            ✨ New Chat
          </button>
        </div>

        {/* Chat History Placeholder */}
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-slate-400 text-sm">No chat history</p>
          ) : (
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-blue-50 text-slate-700 text-sm truncate cursor-pointer hover:bg-blue-100 transition font-medium">
                💬 Current conversation
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-200 text-xs text-slate-500">
          <p>Powered by Claude AI</p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-50 to-slate-100">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold shadow-sm">💬</div>
            <div>
              <div className="font-semibold text-slate-900">ChatBot</div>
              <div className="text-xs text-slate-500">Helpful • Fast • Friendly</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleNewChat}
              className="text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg shadow-sm"
            >
              ✨ New
            </button>
            <button
              onClick={toggleDarkMode}
              className="text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg shadow-sm"
            >
              {darkMode ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
        </div>
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-6">🤖</div>
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Welcome to ChatBot
                </h1>
                <p className="text-slate-600 text-xl max-w-md mx-auto">
                  Your intelligent AI assistant is ready to help! Ask me anything and I'll provide clear, helpful responses with a touch of personality.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className="flex gap-3 max-w-2xl">
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                    AI
                  </div>
                )}
                <div
                  className={`rounded-2xl px-5 py-3 shadow-sm transition-all ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-sm'
                      : msg.isError
                      ? 'bg-red-50 text-red-900 border border-red-200 rounded-bl-sm'
                      : 'bg-white text-slate-900 border border-slate-200 rounded-bl-sm'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div>
                      <div className={`prose ${msg.role === 'user' ? 'prose-invert' : ''} max-w-none text-sm leading-relaxed`}>
                        <Markdown remarkPlugins={[remarkGfm]}>
                          {msg.content || ''}
                        </Markdown>
                      </div>
                      {msg.isStreaming && (
                        <div className="flex gap-1.5 mt-3 pt-2 border-t border-slate-300">
                          <span className="inline-block w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="inline-block w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="inline-block w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                    👤
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 bg-white p-6 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-1 flex flex-col">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything... (Shift+Enter for new line)"
                  disabled={isLoading}
                  rows="1"
                  className="w-full bg-slate-50 text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none disabled:opacity-50 border border-slate-200 transition placeholder-slate-500 font-medium"
                  style={{ maxHeight: '120px' }}
                />
              </div>
              <div className="flex gap-2 flex-col justify-end">
                {isLoading && (
                  <button
                    onClick={handleStopGenerating}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-4 py-3 font-semibold transition text-sm shadow-md hover:shadow-lg"
                  >
                    ⏹️ Stop
                  </button>
                )}
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl px-6 py-3 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  🚀 Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
