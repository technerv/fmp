import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const ChatWidget = () => {
  const { user, token, isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      fetchChatHistory();
      if (!wsRef.current) {
        connectWebSocket();
      }
    }
    
    // Cleanup on unmount or when closed/logged out
    return () => {
      if (!isOpen || !isAuthenticated) {
        closeWebSocket();
      }
    };
  }, [isAuthenticated, isOpen]);

  const fetchChatHistory = async () => {
    try {
      const response = await api.get('/chat/sessions/');
      if (response.data && response.data.length > 0) {
        // Get the most recent active session
        const latestSession = response.data[0];
        setMessages(latestSession.messages);
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    }
  };

  const connectWebSocket = () => {
    const wsUrl = `ws://localhost:8000/ws/chat/?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to Chatbot');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    ws.onclose = () => {
      console.log('Disconnected from Chatbot');
      setIsConnected(false);
      wsRef.current = null;
    };

    ws.onerror = (error) => {
      console.error('Chatbot WebSocket error:', error);
      ws.close();
    };

    wsRef.current = ws;
  };

  const closeWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !wsRef.current) return;

    const message = {
      message: inputValue
    };

    wsRef.current.send(JSON.stringify(message));
    setInputValue('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-white rounded-lg shadow-xl w-80 sm:w-96 mb-4 flex flex-col overflow-hidden border border-gray-200"
            style={{ height: '500px' }}
          >
            {/* Header */}
            <div className="bg-primary-600 text-white p-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FaRobot className="text-xl" />
                <span className="font-semibold">Support Assistant</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-10">
                  <p>Say hello to start chatting!</p>
                </div>
              )}
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-primary-600 text-white rounded-br-none'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={sendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  disabled={!isConnected}
                />
                <button
                  type="submit"
                  disabled={!isConnected || !inputValue.trim()}
                  className="bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaPaperPlane />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
      >
        {isOpen ? <FaTimes className="text-xl" /> : <FaRobot className="text-xl" />}
      </motion.button>
    </div>
  );
};

export default ChatWidget;
