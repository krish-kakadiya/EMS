import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import "./ProjectChat.css";

const SOCKET_SERVER_URL = 'http://localhost:3000';

const ProjectChat = ({ project, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showTeamMembers, setShowTeamMembers] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!project || !currentUser) return;

    // Create socket connection
    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);
      
      // Join project room
      socket.emit('join_project', {
        projectId: project._id,
        userId: currentUser._id || currentUser.employeeId,
        userName: currentUser.name,
        userPhoto: currentUser.photo
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    // Message events
    socket.on('message_history', (history) => {
      const formattedMessages = history.map(msg => ({
        id: msg._id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderPhoto: msg.senderPhoto,
        message: msg.message,
        timestamp: new Date(msg.timestamp),
        isCurrentUser: msg.senderId === (currentUser._id || currentUser.employeeId),
        attachment: msg.attachment
      }));
      setMessages(formattedMessages);
    });

    socket.on('receive_message', (msg) => {
      const formattedMessage = {
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderPhoto: msg.senderPhoto,
        message: msg.message,
        timestamp: new Date(msg.timestamp),
        isCurrentUser: msg.senderId === (currentUser._id || currentUser.employeeId),
        attachment: msg.attachment
      };
      setMessages(prev => [...prev, formattedMessage]);
    });

    // Typing events
    socket.on('user_typing', (data) => {
      setTypingUser(data.userName);
      setIsTyping(true);
    });

    socket.on('user_stop_typing', () => {
      setIsTyping(false);
      setTypingUser(null);
    });

    // User events
    socket.on('user_joined', (data) => {
      console.log(`${data.userName} joined the chat`);
    });

    socket.on('user_left', (data) => {
      console.log(`${data.userName} left the chat`);
    });

    socket.on('active_users', (users) => {
      setActiveUsers(users);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      alert(error.message || 'An error occurred');
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.emit('leave_project', { projectId: project._id });
        socket.disconnect();
      }
    };
  }, [project, currentUser]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!socketRef.current) return;

    if (!isTyping) {
      socketRef.current.emit('typing', {
        projectId: project._id,
        userName: currentUser.name
      });
      setIsTyping(true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('stop_typing', {
        projectId: project._id,
        userName: currentUser.name
      });
      setIsTyping(false);
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !socketRef.current) return;

    try {
      let attachmentData = null;

      // Upload file if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadResponse = await axios.post(
          `${SOCKET_SERVER_URL}/api/chat/upload`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(progress);
            }
          }
        );

        attachmentData = uploadResponse.data.file;
        setUploadProgress(0);
      }

      // Send message via socket
      socketRef.current.emit('send_message', {
        projectId: project._id,
        senderId: currentUser._id || currentUser.employeeId,
        senderName: currentUser.name,
        senderPhoto: currentUser.photo || 'https://via.placeholder.com/40',
        message: newMessage.trim(),
        attachment: attachmentData
      });

      // Clear input and file
      setNewMessage('');
      setSelectedFile(null);
      
      // Stop typing indicator
      socketRef.current.emit('stop_typing', {
        projectId: project._id,
        userName: currentUser.name
      });
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size should not exceed 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('zip') || fileType.includes('rar')) return '🗜️';
    return '📎';
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

  const isUserOnline = (member) => {
    const memberId = member._id || member.employeeId;
    return activeUsers.some(user => user.userId === memberId);
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
              <p className="chat-team-count">
                {getTeamMembers().length} members • {activeUsers.length} online
                {!isConnected && <span style={{color: '#ef4444'}}> • Disconnected</span>}
              </p>
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
                  const isOnline = isUserOnline(employee);
                  return (
                    <div key={employee._id || employee.employeeId} className="team-member-item">
                      <div className="member-avatar-wrapper">
                        <img 
                          src={employee.photo || 'https://via.placeholder.com/40'} 
                          alt={employee.name}
                          className="member-avatar"
                        />
                        <span className={`member-status-dot ${isOnline ? 'online' : 'offline'}`}></span>
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
                      {msg.message && <p className="message-text">{msg.message}</p>}
                      {msg.attachment && (
                        <div className="message-attachment">
                          {msg.attachment.type.startsWith('image/') ? (
                            <img 
                              src={msg.attachment.url} 
                              alt={msg.attachment.name}
                              className="message-image"
                              onClick={() => window.open(msg.attachment.url, '_blank')}
                            />
                          ) : (
                            <div className="message-file" onClick={() => window.open(msg.attachment.url, '_blank')}>
                              <div className="message-file-icon">
                                {getFileIcon(msg.attachment.type)}
                              </div>
                              <div className="message-file-details">
                                <p className="message-file-name">{msg.attachment.name}</p>
                                <p className="message-file-size">{formatFileSize(msg.attachment.size)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
              
              {/* Typing Indicator */}
              {typingUser && (
                <div className="typing-indicator">
                  <span>{typingUser} is typing...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Attachment Preview */}
        {selectedFile && (
          <div className="attachment-preview-container">
            <div className="attachment-preview">
              <div className="attachment-icon">
                {getFileIcon(selectedFile.type)}
              </div>
              <div className="attachment-details">
                <p className="attachment-name">{selectedFile.name}</p>
                <p className="attachment-size">{formatFileSize(selectedFile.size)}</p>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="upload-progress-bar">
                    <div 
                      className="upload-progress-fill" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
              <button 
                type="button"
                className="attachment-remove"
                onClick={handleRemoveFile}
                title="Remove attachment"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Message Input */}
        <form className="chat-input-container" onSubmit={handleSendMessage}>
          <div className="input-wrapper">
            <input
              type="text"
              className="message-input"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              disabled={!isConnected}
            />
            <input
              ref={fileInputRef}
              type="file"
              className="file-input-hidden"
              onChange={handleFileSelect}
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
            />
            <button 
              type="button"
              className="attachment-button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
              disabled={!isConnected}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M17.5 9.58301V12.4997C17.5 15.833 15.8333 17.4997 12.5 17.4997H7.5C4.16667 17.4997 2.5 15.833 2.5 12.4997V7.49967C2.5 4.16634 4.16667 2.49967 7.5 2.49967H10.4167" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17.5 9.58301H14.1667C12.5 9.58301 11.6667 8.74967 11.6667 7.08301V3.74967L17.5 9.58301Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button 
              type="submit" 
              className="send-button"
              disabled={(!newMessage.trim() && !selectedFile) || !isConnected}
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