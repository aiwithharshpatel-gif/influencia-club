import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ArrowLeft, User, Circle } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const BrandMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [messages, setMessages] = useState([]);
  const [creatorInfo, setCreatorInfo] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/brand/messages');
      if (response.data.success) {
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const openThread = async (creatorId) => {
    setSelectedCreator(creatorId);
    setThreadLoading(true);
    try {
      const response = await api.get(`/brand/messages/${creatorId}`);
      if (response.data.success) {
        setMessages(response.data.messages);
        setCreatorInfo(response.data.creator);
        // Update unread count locally
        setConversations(prev =>
          prev.map(c => c.creatorId === creatorId ? { ...c, unreadCount: 0 } : c)
        );
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
      toast.error('Failed to load messages');
    } finally {
      setThreadLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await api.post('/brand/messages', {
        creatorId: selectedCreator,
        content: newMessage.trim()
      });
      if (response.data.success) {
        setMessages(prev => [...prev, response.data.message]);
        setNewMessage('');
        // Update conversation list
        setConversations(prev =>
          prev.map(c =>
            c.creatorId === selectedCreator
              ? { ...c, lastMessage: newMessage.trim(), lastMessageAt: new Date().toISOString() }
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
    setSelectedCreator(null);
    setMessages([]);
    setCreatorInfo(null);
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

  // Mobile: show either list or thread
  // Desktop: show both side by side
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-white mb-6">
        Messages
      </h1>

      {conversations.length === 0 && !selectedCreator ? (
        <div className="bg-bg-card rounded-xl p-12 border border-border text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare size={32} className="text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold text-white mb-2">
            No Messages Yet
          </h2>
          <p className="text-muted text-sm max-w-md mx-auto">
            Once you invite creators to collaborate, you'll be able to message them here to discuss campaign details.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-280px)] min-h-[500px]">
          {/* Conversation List - hide on mobile when thread is open */}
          <div className={`lg:col-span-1 bg-bg-card rounded-xl border border-border overflow-hidden flex flex-col ${selectedCreator ? 'hidden lg:flex' : 'flex'}`}>
            <div className="p-4 border-b border-border">
              <h2 className="font-display text-sm font-bold text-muted uppercase tracking-wider">
                Conversations
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {conversations.map((conv) => (
                <button
                  key={conv.creatorId}
                  onClick={() => openThread(conv.creatorId)}
                  className={`w-full text-left p-4 border-b border-border/50 hover:bg-bg transition-colors flex items-center gap-3 ${
                    selectedCreator === conv.creatorId ? 'bg-bg border-l-2 border-l-primary' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-purple-glow rounded-full flex items-center justify-center flex-shrink-0 relative">
                    {conv.creator?.photoUrl ? (
                      <img src={conv.creator.photoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {conv.creator?.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                    {conv.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-black">{conv.unreadCount}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white text-sm truncate">
                        {conv.creator?.name || 'Creator'}
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
          <div className={`lg:col-span-2 bg-bg-card rounded-xl border border-border overflow-hidden flex flex-col ${!selectedCreator ? 'hidden lg:flex' : 'flex'}`}>
            {selectedCreator ? (
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
                    {creatorInfo?.photoUrl ? (
                      <img src={creatorInfo.photoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {creatorInfo?.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-sm">
                      {creatorInfo?.name || 'Creator'}
                    </h3>
                    <p className="text-muted text-xs capitalize">
                      {creatorInfo?.category} {creatorInfo?.instagram ? `• @${creatorInfo.instagram}` : ''}
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
                      const isBrand = msg.senderType === 'brand';
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isBrand ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                              isBrand
                                ? 'bg-primary/20 text-white rounded-br-md border border-primary/30'
                                : 'bg-bg text-white rounded-bl-md border border-border'
                            }`}
                          >
                            <p className="break-words">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isBrand ? 'text-primary/60' : 'text-muted/60'} text-right`}>
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Compose */}
                <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-bg border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="btn-primary px-4 py-2.5 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
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

export default BrandMessages;
