import React, { useState, useEffect, useRef } from 'react';
import "./ProjectChat.css";

const ProjectChat = ({ project, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showTeamMembers, setShowTeamMembers] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simulate receiving messages (replace with actual WebSocket/API integration)
  useEffect(() => {
    // Load initial messages from backend here
    const initialMessages = [
      {
        id: 1,
        senderId: 'user1',
        senderName: 'John Doe',
        senderPhoto: 'https://via.placeholder.com/40',
        message: 'Hey team! Let\'s discuss the project timeline.',
        timestamp: new Date(Date.now() - 3600000),
        isCurrentUser: false
      },
      {
        id: 2,
        senderId: 'current',
        senderName: 'You',
        senderPhoto: 'https://via.placeholder.com/40',
        message: 'Sure! I\'ve completed the initial setup.',
        timestamp: new Date(Date.now() - 1800000),
        isCurrentUser: true
      }
    ];
    setMessages(initialMessages);
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      senderId: 'current',
      senderName: 'You',
      senderPhoto: currentUser?.photo || 'https://via.placeholder.com/40',
      message: newMessage.trim(),
      timestamp: new Date(),
      isCurrentUser: true
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // TODO: Send message to backend via WebSocket or API
    // socket.emit('send_message', { projectId: project._id, message });
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const getTeamMembers = () => {
    return project.teamMembers || [];
  };

  return (
    <div className="chat-overlay">
      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <button 
              className="team-toggle-btn"
              onClick={() => setShowTeamMembers(!showTeamMembers)}
              title="View team members"
            >
              <span className="group-icon">👥</span>
            </button>
            <div className="chat-header-info">
              <h3 className="chat-project-name">{project.name}</h3>
              <p className="chat-team-count">{getTeamMembers().length} members</p>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="chat-body">
          {/* Team Members Sidebar */}
          {showTeamMembers && (
            <div className="team-sidebar">
              <div className="team-sidebar-header">
                <h4>Team Members</h4>
                <span className="member-count">{getTeamMembers().length}</span>
              </div>
              <div className="team-members-list">
                {getTeamMembers().map((member) => {
                  const employee = typeof member === 'object' ? member : { name: 'Unknown', photo: null };
                  return (
                    <div key={employee._id || employee.employeeId} className="team-member-item">
                      <div className="member-avatar-wrapper">
                        <img 
                          src={employee.photo || 'https://via.placeholder.com/40'} 
                          alt={employee.name}
                          className="member-avatar"
                        />
                        <span className="member-status-dot online"></span>
                      </div>
                      <div className="member-details">
                        <h5 className="member-name">{employee.name}</h5>
                        <p className="member-role">{employee.designation || employee.department || 'Team Member'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="messages-area" ref={chatContainerRef}>
            <div className="messages-container">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`message-wrapper ${msg.isCurrentUser ? 'current-user' : 'other-user'}`}
                >
                  {!msg.isCurrentUser && (
                    <img 
                      src={msg.senderPhoto} 
                      alt={msg.senderName}
                      className="message-avatar"
                    />
                  )}
                  <div className="message-content">
                    {!msg.isCurrentUser && (
                      <span className="message-sender">{msg.senderName}</span>
                    )}
                    <div className="message-bubble">
                      <p className="message-text">{msg.message}</p>
                    </div>
                    <span className="message-time">{formatMessageTime(msg.timestamp)}</span>
                  </div>
                  {msg.isCurrentUser && (
                    <img 
                      src={msg.senderPhoto} 
                      alt={msg.senderName}
                      className="message-avatar"
                    />
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Message Input */}
        <form className="chat-input-container" onSubmit={handleSendMessage}>
          <div className="input-wrapper">
            <input
              type="text"
              className="message-input"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button 
              type="submit" 
              className="send-button"
              disabled={!newMessage.trim()}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2 10L18 2L10 18L8 11L2 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectChat;