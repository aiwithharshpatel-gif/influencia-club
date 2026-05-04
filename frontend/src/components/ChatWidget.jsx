import { useState } from 'react';
import { MessageCircle, X, Send, User, Sparkles } from 'lucide-react';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Welcome to Influenzia Club! ✨ How can we help you today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickReplies = [
    'How do I join?',
    'Pricing information',
    'Brand partnerships',
    'Technical support',
  ];

  const botResponses = {
    'join': 'To join Influenzia Club, click on "Join Now" and fill out the registration form. Our team will review your application within 24 hours! ✨',
    'pricing': 'Our Founding Member offer is ₹4,999 (50% off regular price of ₹9,999). This includes lifetime VIP access! 💎',
    'brand': 'We partner with 50+ luxury brands including Gucci, Louis Vuitton, Chanel, and more. You\'ll get exclusive campaign access! ',
    'support': 'Our team is available 24/7. For immediate assistance, email us at hello@influenziaclub.com 📧',
    'default': 'Thank you for your message! Our team will respond within 24 hours. For urgent queries, email hello@influenziaclub.com',
  };

  const getBotResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('join') || lowerMessage.includes('register') || lowerMessage.includes('signup')) {
      return botResponses.join;
    } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('fee')) {
      return botResponses.pricing;
    } else if (lowerMessage.includes('brand') || lowerMessage.includes('partnership') || lowerMessage.includes('collaboration')) {
      return botResponses.brand;
    } else if (lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('contact')) {
      return botResponses.support;
    }
    return botResponses.default;
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        content: getBotResponse(inputValue),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickReply = (reply) => {
    setInputValue(reply);
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gold-gradient flex items-center justify-center shadow-gold-glow hover:shadow-2xl transition-all duration-300 hover:scale-110 ${
          isOpen ? 'rotate-90' : ''
        }`}
      >
        {isOpen ? (
          <X className="text-black w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="text-black w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] luxury-card rounded-2xl overflow-hidden shadow-2xl border border-gold/30 animate-slide-up">
          {/* Header */}
          <div className="bg-gold-gradient p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
                <Sparkles className="text-black w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-black">Influenzia Club</h3>
                <p className="text-xs text-black/80">VIP Support • Online</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-gold-gradient text-black'
                      : 'bg-gold/10 border border-gold/20 text-white'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-black/70' : 'text-gold/70'}`}>
                    {message.time}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gold/10 border border-gold/20 rounded-2xl px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Replies */}
          <div className="px-4 py-2 border-t border-gold/20">
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickReply(reply)}
                  className="px-3 py-1 text-xs bg-gold/10 border border-gold/30 text-gold rounded-full hover:bg-gold hover:text-black transition-all"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gold/20">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 bg-gold/5 border border-gold/30 rounded-xl px-4 py-3 text-white placeholder-gold/50 focus:outline-none focus:border-gold"
              />
              <button
                onClick={handleSend}
                className="w-12 h-12 rounded-xl bg-gold-gradient flex items-center justify-center hover:scale-110 transition-transform"
              >
                <Send className="text-black w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default ChatWidget;
