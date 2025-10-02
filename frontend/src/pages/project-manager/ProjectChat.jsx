import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import "./ProjectChat.css";

const SOCKET_SERVER_URL = 'http://localhost:3000';

// Generate local placeholder image using SVG data URL
const generatePlaceholderImage = (initials, size = 40, bgColor = '#4A90E2', textColor = '#FFFFFF') => {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}" rx="50%"/>
      <text x="50%" y="50%" dy="0.35em" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="${size * 0.4}" font-weight="bold" fill="${textColor}">
        ${initials.toUpperCase()}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Download file function
const downloadFile = async (fileUrl, fileName, event = null) => {
  try {
    // Show loading indicator
    const originalText = event?.target?.textContent;
    if (event?.target) {
      event.target.textContent = '⏳ Downloading...';
      event.target.disabled = true;
    }

    const response = await fetch(fileUrl, {
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'download';
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    // Show success feedback
    if (event?.target) {
      event.target.textContent = '✅ Downloaded';
      setTimeout(() => {
        event.target.textContent = originalText || '📥 Download';
        event.target.disabled = false;
      }, 2000);
    }
    
  } catch (error) {
    console.error('Error downloading file:', error);
    
    // Reset button state
    if (event?.target) {
      event.target.textContent = '❌ Failed';
      setTimeout(() => {
        event.target.textContent = originalText || '📥 Download';
        event.target.disabled = false;
      }, 2000);
    }
    
    // Fallback: open in new tab
    setTimeout(() => {
      window.open(fileUrl, '_blank');
    }, 1000);
  }
};

const ProjectChat = ({ project, currentUser, onClose, onMessagesRead }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showTeamMembers, setShowTeamMembers] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  
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
    // Mark messages as read when new messages arrive, but debounce to prevent excessive calls
    if (messages.length > 0) {
      const timeoutId = setTimeout(() => {
        markAllMessagesAsRead();
      }, 500); // Wait 500ms before marking as read
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length]); // Only depend on message count, not entire messages array

  // Helper: derive stable project id with fallbacks
  const getProjectId = (proj) => {
    if (!proj) return undefined;
    return proj._id || proj.id || proj.projectId || (proj.project && (proj.project._id || proj.project.id));
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!project || !currentUser) {
      console.error('ProjectChat: Missing project or currentUser data');
      return;
    }

    // Validate user has required fields
    const userId = currentUser._id || currentUser.employeeId;
    const userName = currentUser.name;
    
    if (!userId || !userName) {
      console.error('ProjectChat: User missing required fields (id or name)');
      return;
    }

    // Prevent multiple socket connections
    if (socketRef.current) {
      if (socketRef.current.connected) {
        console.log('Socket already connected, skipping initialization');
        return;
      } else {
        // Clean up existing disconnected socket
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }

    const resolvedProjectId = getProjectId(project);
    if (!resolvedProjectId) {
      console.error('ProjectChat: Unable to resolve project id from project object:', project);
      return;
    }

    // Create socket connection
    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'], // Allow fallback to polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10, // More reconnection attempts
      timeout: 60000, // Increased timeout for file uploads
      forceNew: false, // Reuse existing connection
      upgrade: true,
      rememberUpgrade: true
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('🟢 Connected to socket server');
      console.log('🟢 Socket ID:', socket.id);
      setIsConnected(true);
      
      // Join project room
      const joinData = {
        projectId: resolvedProjectId,
        userId: userId,
        userName: userName,
        userPhoto: currentUser.photo || 
                  (currentUser.profile && currentUser.profile.profilePicture) ||
                  generatePlaceholderImage(userName ? userName.charAt(0) : 'U')
      };
      console.log('🟢 JOINING PROJECT:', joinData);
      socket.emit('join_project', joinData);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
      setIsConnected(false);
      
      // Auto-reconnect if disconnected unexpectedly
      if (reason === 'io server disconnect') {
        // Server disconnected us, manually reconnect
        setTimeout(() => {
          socket.connect();
        }, 1000);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('🔴 Connection error:', error);
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('🔴 Socket error:', error);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to socket server after', attemptNumber, 'attempts');
      setIsConnected(true);
      
      // Rejoin project room after reconnection
      socket.emit('join_project', {
        projectId: resolvedProjectId,
        userId: userId,
        userName: userName,
        userPhoto: currentUser.photo || 
                  (currentUser.profile && currentUser.profile.profilePicture) ||
                  generatePlaceholderImage(userName ? userName.charAt(0) : 'U')
      });
    });

    socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
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
        isCurrentUser: msg.senderId === userId,
        attachment: msg.attachment
      }));
      setMessages(formattedMessages);
      
      // Mark all messages as read when chat is opened
      markAllMessagesAsRead();
    });

    socket.on('joined_project', (data) => {
      console.log('🟢 Join acknowledged by server:', data);
    });

    socket.on('join_error', (err) => {
      console.error('🔴 Join project failed:', err);
      setError(err.message || 'Failed to join project room');
      setTimeout(() => setError(null), 8000);
    });

    socket.on('receive_message', (msg) => {
      console.log('🔥 RECEIVED MESSAGE:', msg);
      const formattedMessage = {
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderPhoto: msg.senderPhoto,
        message: msg.message,
        timestamp: new Date(msg.timestamp),
        isCurrentUser: msg.senderId === userId,
        attachment: msg.attachment
      };
      console.log('🔥 FORMATTED MESSAGE:', formattedMessage);
      setMessages(prev => {
        console.log('🔥 PREV MESSAGES:', prev.length);
        const newMessages = [...prev, formattedMessage];
        console.log('🔥 NEW MESSAGES:', newMessages.length);
        return newMessages;
      });
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
      const errorMessage = error.details ? 
        `${error.message}: ${error.details}` : 
        (error.message || 'A connection error occurred');
      setError(errorMessage);
      setTimeout(() => setError(null), 10000); // Show error longer for debugging
    });

    // Handle messages marked as read event
    socket.on('messages_marked_read', (data) => {
      const { projectId, readByUserId } = data;
      console.log(`Messages marked as read in project ${projectId} by user ${readByUserId}`);
      
      // If we have an onMessagesRead callback, call it to update parent component
      if (typeof onMessagesRead === 'function') {
        onMessagesRead(projectId);
      }
    });

    // Note: Removed chat_history_cleared event handler since clearing is now user-specific

    // Cleanup on unmount
    return () => {
      if (socket) {
        console.log('Cleaning up socket connection');
        socket.off('receive_message');
        socket.off('typing');
        socket.off('stop_typing');
        socket.off('error');
        socket.off('messages_marked_read');
        socket.emit('leave_project', { projectId: project._id });
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [project?._id, currentUser._id]); // Only depend on IDs, not entire objects

  // Handle typing indicator
  const handleTyping = () => {
    if (!socketRef.current) return;

    const resolvedProjectId = getProjectId(project);
    if (!resolvedProjectId) {
      console.error('Typing aborted: unresolved project id');
      return;
    }

    if (!isTyping) {
      socketRef.current.emit('typing', {
        projectId: resolvedProjectId,
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
        projectId: resolvedProjectId,
        userName: currentUser.name
      });
      setIsTyping(false);
    }, 2000);
  };

  // Clear chat history function (user-specific)
  const handleClearHistory = async () => {
    if (!project?._id || !currentUser) return;
    
    setIsClearingHistory(true);
    try {
      const response = await axios.delete(
        `${SOCKET_SERVER_URL}/api/chat/clear-history/${project._id}`,
        {
          data: {
            userId: currentUser._id || currentUser.employeeId,
            userRole: currentUser.role || 'employee'
          }
        }
      );

      if (response.data.success) {
        // Clear local messages immediately for this user only
        setMessages([]);
        setSuccess('Chat history cleared for you. Other team members can still see their messages.');
        setTimeout(() => setSuccess(null), 5000);
      } else {
        throw new Error(response.data.error || 'Failed to clear history');
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
      setError(error.response?.data?.error || 'Failed to clear chat history');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsClearingHistory(false);
      setShowClearConfirm(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !socketRef.current) return;

    try {
      let attachmentData = null;

      // Upload file if selected
      if (selectedFile) {
        setError(null); // Clear any previous errors
        
        // Check socket connection before file upload
        if (!socketRef.current.connected) {
          console.log('Socket disconnected, attempting to reconnect...');
          socketRef.current.connect();
          // Wait a bit for reconnection
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadResponse = await axios.post(
          `${SOCKET_SERVER_URL}/api/chat/upload`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 300000, // 5 minutes timeout for large files
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(progress);
            }
          }
        );

        if (uploadResponse.data.success) {
          attachmentData = uploadResponse.data.file;
          setSuccess('File uploaded successfully to cloud storage!');
          setTimeout(() => setSuccess(null), 3000);
        } else {
          throw new Error(uploadResponse.data.error || 'Upload failed');
        }
        setUploadProgress(0);
      }

      // Extract user info
      const userId = currentUser._id || currentUser.employeeId;
      const userName = currentUser.name;
      // Try multiple sources for profile photo
      const userPhoto = currentUser.photo || 
                       (currentUser.profile && currentUser.profile.profilePicture) ||
                       generatePlaceholderImage(userName ? userName.charAt(0) : 'U');

      // Ensure socket is connected before sending message
      if (!socketRef.current.connected) {
        console.log('Socket disconnected before sending message, reconnecting...');
        socketRef.current.connect();
        
        // Wait for reconnection with timeout
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Socket reconnection timeout')), 10000);
          
          socketRef.current.once('connect', () => {
            clearTimeout(timeout);
            // Rejoin project room
            socketRef.current.emit('join_project', {
              projectId: project._id,
              userId: userId,
              userName: userName,
              userPhoto: userPhoto
            });
            resolve();
          });
        });
      }

      // Send message via socket
      const resolvedProjectId = getProjectId(project);
      if (!resolvedProjectId) {
        console.error('Cannot send message: unresolved project id');
        setError('Cannot send: project id missing');
        setTimeout(() => setError(null), 5000);
        return;
      }

      const messageData = {
        projectId: resolvedProjectId,
        senderId: userId,
        senderName: userName,
        senderPhoto: userPhoto,
        message: newMessage.trim(),
        attachment: attachmentData
      };
      console.log('🚀 SENDING MESSAGE:', messageData);
      console.log('🚀 SOCKET CONNECTED:', socketRef.current.connected);
      console.log('🚀 SOCKET ID:', socketRef.current.id);
      
      // Optimistic UI insert
      const tempId = `temp-${Date.now()}`;
      setMessages(prev => ([...prev, {
        id: tempId,
        senderId: userId,
        senderName: userName,
        senderPhoto: userPhoto,
        message: newMessage.trim(),
        timestamp: new Date(),
        isCurrentUser: true,
        attachment: attachmentData,
        pending: true
      }]));

      socketRef.current.emit('send_message', messageData, (ack) => {
        if (ack && ack.success && ack.message) {
          setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: ack.message.id, pending: false, timestamp: new Date(ack.message.timestamp) } : m));
        } else if (ack && ack.error) {
          console.error('Message rejected:', ack.error);
          setMessages(prev => prev.map(m => m.id === tempId ? { ...m, failed: true } : m));
        } else {
          // No ack received; leave optimistic message (server will also push real one)
        }
      });

      // Clear input and file
      setNewMessage('');
      setSelectedFile(null);
      
      // Stop typing indicator
      socketRef.current.emit('stop_typing', {
        projectId: resolvedProjectId,
        userName: userName
      });
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 100MB for Cloudinary)
      if (file.size > 100 * 1024 * 1024) {
        setError('File size should not exceed 100MB');
        setTimeout(() => setError(null), 5000);
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
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📊';
    if (fileType.includes('text') || fileType.includes('txt')) return '📃';
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return '🗜️';
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

  // Mark all messages as read
  const markAllMessagesAsRead = async () => {
    if (!socketRef.current || !project || !currentUser || isMarkingRead) return;
    
    setIsMarkingRead(true);
    try {
      const userId = currentUser._id || currentUser.employeeId;
      
      // Call API to mark messages as read
      const response = await fetch(`${SOCKET_SERVER_URL}/api/chat/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project._id,
          userId: userId
        })
      });

      if (response.ok) {
        // Emit socket event to notify other users that messages have been read
        socketRef.current.emit('messages_read', {
          projectId: project._id,
          userId: userId
        });
        
        // Call callback if provided
        if (typeof onMessagesRead === 'function') {
          onMessagesRead(project._id);
        }
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    } finally {
      setIsMarkingRead(false);
    }
  };

  const getTeamMembers = () => {
    const members = [];
    
    // Add project manager if available
    if (project.manager) {
      members.push(project.manager);
    }
    
    // Add team members
    if (project.teamMembers && Array.isArray(project.teamMembers)) {
      // Filter out duplicates (in case manager is also in teamMembers)
      const managerId = project.manager?._id || project.manager?.employeeId;
      const uniqueMembers = project.teamMembers.filter(member => {
        const memberId = member._id || member.employeeId;
        return memberId !== managerId;
      });
      members.push(...uniqueMembers);
    }
    
    return members;
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
              <h3 className="chat-project-name">🚀 {project.name} - Live Team Chat</h3>
              <p className="chat-team-count">
                {getTeamMembers().length} members • {activeUsers.length} online
                <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                  • {isConnected ? '🟢 Live' : '🔴 Connecting...'}
                </span>
              </p>
            </div>
          </div>
          <div className="chat-header-actions">
            <button 
              className="clear-history-btn"
              onClick={() => setShowClearConfirm(true)}
              title="Clear chat history"
              disabled={isClearingHistory}
            >
              🗑️
            </button>
            <button className="chat-close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Error/Success Notifications */}
        {error && (
          <div className="chat-notification error">
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
        {success && (
          <div className="chat-notification success">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)}>×</button>
          </div>
        )}

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
                          src={employee.photo || generatePlaceholderImage(employee.name ? employee.name.charAt(0) : 'T', 40)} 
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
                      src={msg.senderPhoto || generatePlaceholderImage(msg.senderName ? msg.senderName.charAt(0) : 'U')} 
                      alt={msg.senderName}
                      className="message-avatar"
                      onError={(e) => {
                        e.target.src = generatePlaceholderImage(msg.senderName ? msg.senderName.charAt(0) : 'U');
                      }}
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
                            <div className="message-image-container">
                              <img 
                                src={msg.attachment.url} 
                                alt={msg.attachment.name}
                                className="message-image"
                                onClick={() => window.open(msg.attachment.url, '_blank')}
                              />
                              <div className="message-image-overlay">
                                <button 
                                  className="download-btn image-download"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadFile(msg.attachment.url, msg.attachment.name, e);
                                  }}
                                  title="Download image"
                                >
                                  📥
                                </button>
                                <button 
                                  className="view-btn image-view"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(msg.attachment.url, '_blank');
                                  }}
                                  title="View full size"
                                >
                                  🔍
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="message-file">
                              <div className="message-file-content" onClick={() => window.open(msg.attachment.url, '_blank')}>
                                <div className="message-file-icon">
                                  {getFileIcon(msg.attachment.type)}
                                </div>
                                <div className="message-file-details">
                                  <p className="message-file-name">{msg.attachment.name}</p>
                                  <p className="message-file-size">
                                    {formatFileSize(msg.attachment.size)}
                                    <span className="cloud-indicator" title="Stored in cloud">☁️</span>
                                  </p>
                                </div>
                              </div>
                              <div className="message-file-actions">
                                <button 
                                  className="download-btn file-download"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadFile(msg.attachment.url, msg.attachment.name, e);
                                  }}
                                  title="Download file"
                                >
                                  📥 Download
                                </button>
                                <button 
                                  className="view-btn file-view"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(msg.attachment.url, '_blank');
                                  }}
                                  title="Open file"
                                >
                                  👁️ View
                                </button>
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
                      src={msg.senderPhoto || generatePlaceholderImage(msg.senderName ? msg.senderName.charAt(0) : 'U')} 
                      alt={msg.senderName}
                      className="message-avatar"
                      onError={(e) => {
                        e.target.src = generatePlaceholderImage(msg.senderName ? msg.senderName.charAt(0) : 'U');
                      }}
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
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z"
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

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <div className="modal-header">
              <h3>Clear Chat History</h3>
              <button 
                className="modal-close"
                onClick={() => setShowClearConfirm(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="warning-icon">⚠️</div>
              <p><strong>Are you sure you want to clear your chat history?</strong></p>
              <p>This action will:</p>
              <ul>
                <li>Hide all current messages for you only</li>
                <li>Other team members will still see their messages</li>
                <li>New messages will continue to appear normally</li>
                <li><strong>You can't restore hidden messages!</strong></li>
              </ul>
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearingHistory}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn danger"
                onClick={handleClearHistory}
                disabled={isClearingHistory}
              >
                {isClearingHistory ? 'Clearing...' : 'Clear History'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectChat;