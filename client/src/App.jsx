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
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">
              AI
            </div>
            <span className="font-bold text-lg">ChatBot</span>
          </div>
          <button
            onClick={handleNewChat}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-2 px-3 text-sm font-medium transition"
          >
            + New Chat
          </button>
        </div>

        {/* Chat History Placeholder */}
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-sm">No chat history</p>
          ) : (
            <div className="space-y-2">
              <div className="p-2 rounded bg-gray-800 text-sm truncate cursor-pointer hover:bg-gray-700">
                Current conversation
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">Welcome to ChatBot</h1>
                <p className="text-gray-400 text-lg">
                  Hi! I'm your AI assistant. Ask me anything!
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl rounded-lg px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.isError
                    ? 'bg-red-900 text-red-100'
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div>
                    <div className="prose prose-invert max-w-none text-sm">
                      <Markdown remarkPlugins={[remarkGfm]}>
                        {msg.content || ''}
                      </Markdown>
                    </div>
                    {msg.isStreaming && (
                      <div className="flex gap-1 mt-2">
                        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-800 bg-gray-900 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything... (Shift+Enter for new line)"
                  disabled={isLoading}
                  rows="1"
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 resize-none disabled:opacity-50"
                  style={{ maxHeight: '120px' }}
                />
              </div>
              <div className="flex gap-2 flex-col justify-end">
                {isLoading && (
                  <button
                    onClick={handleStopGenerating}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-3 font-medium transition text-sm"
                  >
                    Stop
                  </button>
                )}
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
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
