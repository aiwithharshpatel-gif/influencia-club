import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ArrowLeft, User, Circle, Paperclip, X, FileText } from 'lucide-react';
import api, { API_URL } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const CreatorMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [messages, setMessages] = useState([]);
  const [brandInfo, setBrandInfo] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const messagesEndRef = useRef(null);
  const selectedBrandRef = useRef(null);
  const fileInputRef = useRef(null);

  // Keep ref up to date for socket listener callback
  useEffect(() => {
    selectedBrandRef.current = selectedBrand;
  }, [selectedBrand]);

  useEffect(() => {
    fetchConversations();
  }, []);

  // Socket connection and listener
  useEffect(() => {
    if (!user?.id) return;

    const socketUrl = API_URL.replace('/api', '');
    const socket = io(socketUrl, {
      withCredentials: true
    });

    // Creator joins their unique ID room
    socket.emit('join', user.id);

    socket.on('message', (message) => {
      const activeBrand = selectedBrandRef.current;
      const isFromOrToActive = 
        (message.senderType === 'brand' && message.senderId === activeBrand) ||
        (message.recipientType === 'brand' && message.recipientId === activeBrand);

      if (isFromOrToActive) {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }

      setConversations(prev => {
        const partnerEmail = message.senderType === 'brand' ? message.senderId : message.recipientId;
        const existingIdx = prev.findIndex(c => c.brandEmail === partnerEmail);
        if (existingIdx > -1) {
          const updated = [...prev];
          const conv = updated[existingIdx];
          const isCurrentActive = activeBrand === conv.brandEmail;
          updated[existingIdx] = {
            ...conv,
            lastMessage: message.attachments?.length ? '📎 Attachment' : message.content,
            lastMessageAt: message.createdAt,
            unreadCount: isCurrentActive ? 0 : (message.recipientType === 'creator' ? conv.unreadCount + 1 : conv.unreadCount)
          };
          return updated.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        } else {
          // Fetch conversations again to load brand details
          fetchConversations();
          return prev;
        }
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/dashboard/messages');
      if (response.data.success) {
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const openThread = async (brandEmail) => {
    setSelectedBrand(brandEmail);
    setThreadLoading(true);
    setSelectedFile(null);
    try {
      const response = await api.get(`/dashboard/messages/${brandEmail}`);
      if (response.data.success) {
        setMessages(response.data.messages);
        setBrandInfo(response.data.brand);
        // Update unread count locally
        setConversations(prev =>
          prev.map(c => c.brandEmail === brandEmail ? { ...c, unreadCount: 0 } : c)
        );
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
      toast.error('Failed to load messages');
    } finally {
      setThreadLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);

    const toastId = toast.loading('Uploading attachment...');
    try {
      const response = await api.post('/dashboard/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setSelectedFile(response.data.attachment);
        toast.success('File ready to send!', { id: toastId });
      } else {
        toast.error('Upload failed', { id: toastId });
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload file', { id: toastId });
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || sending || uploadingFile) return;

    setSending(true);
    try {
      const payload = {
        brandEmail: selectedBrand,
        content: newMessage.trim(),
        attachments: selectedFile ? [selectedFile] : undefined
      };
      
      const response = await api.post('/dashboard/messages', payload);
      if (response.data.success) {
        setMessages(prev => [...prev, response.data.message]);
        setNewMessage('');
        setSelectedFile(null);
        // Update conversation list
        setConversations(prev =>
          prev.map(c =>
            c.brandEmail === selectedBrand
              ? { 
                  ...c, 
                  lastMessage: selectedFile ? '📎 Attachment' : newMessage.trim(), 
                  lastMessageAt: new Date().toISOString() 
                }
              : c
          )
        );
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const goBack = () => {
    setSelectedBrand(null);
    setMessages([]);
    setBrandInfo(null);
    setSelectedFile(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-bg-card rounded-lg skeleton-shimmer" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-bg-card rounded-xl p-4 border border-border h-20 skeleton-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-white mb-6">
        Messages
      </h1>

      {conversations.length === 0 && !selectedBrand ? (
        <div className="bg-bg-card rounded-xl p-12 border border-border text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare size={32} className="text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold text-white mb-2">
            No Messages Yet
          </h2>
          <p className="text-muted text-sm max-w-md mx-auto">
            Once brands invite you to collaborate, you'll be able to chat with them here.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-280px)] min-h-[500px]">
          {/* Conversation List */}
          <div className={`lg:col-span-1 bg-bg-card rounded-xl border border-border overflow-hidden flex flex-col ${selectedBrand ? 'hidden lg:flex' : 'flex'}`}>
            <div className="p-4 border-b border-border">
              <h2 className="font-display text-sm font-bold text-muted uppercase tracking-wider">
                Conversations
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {conversations.map((conv) => (
                <button
                  key={conv.brandEmail}
                  onClick={() => openThread(conv.brandEmail)}
                  className={`w-full text-left p-4 border-b border-border/50 hover:bg-bg transition-colors flex items-center gap-3 ${
                    selectedBrand === conv.brandEmail ? 'bg-bg border-l-2 border-l-primary' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-purple-glow rounded-full flex items-center justify-center flex-shrink-0 relative">
                    <span className="text-sm font-bold text-white">
                      {conv.brand?.brandName?.charAt(0).toUpperCase() || 'B'}
                    </span>
                    {conv.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-black">{conv.unreadCount}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white text-sm truncate">
                        {conv.brand?.brandName || 'Brand Partner'}
                      </span>
                      <span className="text-muted text-[10px] flex-shrink-0 ml-2">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-muted text-xs truncate mt-0.5">
                      {conv.lastMessage}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Message Thread */}
          <div className={`lg:col-span-2 bg-bg-card rounded-xl border border-border overflow-hidden flex flex-col ${!selectedBrand ? 'hidden lg:flex' : 'flex'}`}>
            {selectedBrand ? (
              <>
                {/* Thread Header */}
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <button
                    onClick={goBack}
                    className="lg:hidden w-8 h-8 bg-bg rounded-lg flex items-center justify-center text-muted hover:text-white transition-colors"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="w-10 h-10 bg-purple-glow rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-white">
                      {brandInfo?.brandName?.charAt(0).toUpperCase() || 'B'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-sm">
                      {brandInfo?.brandName || 'Brand Partner'}
                    </h3>
                    <p className="text-muted text-xs">
                      {brandInfo?.email}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                  {threadLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-muted text-sm">
                      <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isCreator = msg.senderType === 'creator';
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isCreator ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                              isCreator
                                ? 'bg-primary/20 text-white rounded-br-md border border-primary/30'
                                : 'bg-bg text-white rounded-bl-md border border-border'
                            }`}
                          >
                            {msg.content && <p className="break-words">{msg.content}</p>}
                            
                            {/* Render Attachments */}
                            {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {msg.attachments.map((att, index) => {
                                  if (att.type === 'image') {
                                    return (
                                      <a 
                                        key={index} 
                                        href={att.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="block rounded-lg overflow-hidden border border-border/40 max-w-xs hover:opacity-90 transition-opacity"
                                      >
                                        <img src={att.url} alt={att.name || 'Attachment'} className="max-h-48 w-full object-cover" />
                                      </a>
                                    );
                                  } else {
                                    return (
                                      <a 
                                        key={index} 
                                        href={att.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex items-center gap-2 p-2 bg-black/30 hover:bg-black/50 border border-border/50 rounded-lg text-xs transition-colors text-white"
                                      >
                                        <FileText size={16} className="text-primary" />
                                        <div className="min-w-0 flex-1">
                                          <div className="truncate font-semibold">{att.name}</div>
                                          {att.size && <div className="text-[10px] text-muted">{Math.round(att.size / 1024)} KB</div>}
                                        </div>
                                      </a>
                                    );
                                  }
                                })}
                              </div>
                            )}

                            <p className={`text-[10px] mt-1 ${isCreator ? 'text-primary/60' : 'text-muted/60'} text-right`}>
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* File Compose Preview */}
                {selectedFile && (
                  <div className="px-4 py-2 bg-bg/50 border-t border-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-white">
                      {selectedFile.type === 'image' ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-border flex-shrink-0">
                          <img src={selectedFile.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-black/40 border border-border flex items-center justify-center flex-shrink-0">
                          <FileText size={16} className="text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{selectedFile.name}</p>
                        {selectedFile.size && <p className="text-[10px] text-muted">{Math.round(selectedFile.size / 1024)} KB</p>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center text-muted hover:text-white hover:border-red-500/50 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* Compose */}
                <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending || uploadingFile}
                    className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-muted hover:text-white hover:border-primary/50 transition-colors"
                    title="Attach image or file"
                  >
                    <Paperclip size={18} />
                  </button>

                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-bg border border-border rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedFile) || sending || uploadingFile}
                    className="btn-primary px-4 py-2 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                  >
                    <Send size={16} />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted text-sm">
                <div className="text-center">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export default CreatorMessages;
