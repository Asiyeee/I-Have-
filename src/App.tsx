import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Utensils, 
  Heart, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  User,
  Bot,
  ArrowRight,
  Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Entity {
  id: number;
  name: string;
  type: 'restaurant' | 'charity';
  lat: number;
  lng: number;
  contact: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  match?: any;
}

const Logo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={cn("w-12 h-12", className)} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Pot Body */}
    <path d="M20 40H80V75C80 80.5228 75.5228 85 70 85H30C24.4772 85 20 80.5228 20 75V40Z" fill="currentColor" />
    {/* Pot Lid */}
    <path d="M25 38C25 32.4772 29.4772 28 35 28H65C70.5228 28 75 32.4772 75 38H25Z" fill="currentColor" />
    {/* Pot Handle Top */}
    <rect x="42" y="22" width="16" height="6" rx="2" fill="currentColor" />
    {/* Side Handles */}
    <path d="M10 45C10 45 15 45 15 50C15 55 10 55 10 55" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M90 45C90 45 85 45 85 50C85 55 90 55 90 55" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    {/* Exclamation Mark */}
    <circle cx="50" cy="72" r="4" fill="#fccb58" stroke="currentColor" strokeWidth="1" />
    <path d="M47 50L48 65H52L53 50H47Z" fill="#fccb58" stroke="currentColor" strokeWidth="1" />
    {/* Signal Waves */}
    <path d="M38 55C36 58 36 62 38 65" stroke="#fdfcf8" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <path d="M33 52C30 57 30 63 33 68" stroke="#fdfcf8" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    <path d="M62 55C64 58 64 62 62 65" stroke="#fdfcf8" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <path d="M67 52C70 57 70 63 67 68" stroke="#fdfcf8" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
  </svg>
);

export default function App() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: "### SYSTEM ONLINE\n\nWelcome to **I HAVE!** (v2.0).\n\nConnecting surplus to demand in real-time. \n\nSelect your entity to broadcast your status.",
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/entities')
      .then(res => res.json())
      .then(data => setEntities(data));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedEntity || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, entityId: selectedEntity.id }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: data.text || "Protocol error: Empty response.",
        sender: 'bot',
        timestamp: new Date(),
        match: data.match
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "### CONNECTION ERROR\n\nUnable to reach the protocol server. Please verify your network status and try again.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcf8] text-[#436d2e] selection:bg-[#fccb58]/30">
      {/* Soft Header */}
      <header className="bg-white/80 backdrop-blur-md p-6 sticky top-0 z-20 shadow-sm border-b border-[#436d2e]/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-[#436d2e]/10 text-[#436d2e] p-3 rounded-2xl">
              <Logo className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight leading-none">
                I have<span className="text-[#fccb58] font-black">!</span>
              </h1>
              <p className="font-medium text-[11px] mt-1 uppercase tracking-wider opacity-60">
                Surplus Distribution Network
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedEntity ? (
              <div className="bg-white border border-[#436d2e]/10 px-4 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-sm">
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  selectedEntity.type === 'restaurant' ? "bg-orange-500" : "bg-blue-500"
                )} />
                <span className="text-sm tracking-tight">{selectedEntity.name}</span>
              </div>
            ) : (
              <div className="bg-[#436d2e]/5 px-4 py-2 rounded-xl font-medium text-[11px] animate-pulse">
                Awaiting Authentication...
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Entity Selector - Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="soft-card p-6">
            <h2 className="text-base font-bold mb-6 flex items-center justify-between opacity-80">
              Identity
              <User size={18} />
            </h2>
            <div className="space-y-3">
              {entities.map(entity => (
                <button
                  key={entity.id}
                  onClick={() => setSelectedEntity(entity)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl transition-all font-semibold text-sm flex items-center justify-between group",
                    selectedEntity?.id === entity.id
                      ? "bg-[#436d2e] text-white shadow-lg shadow-[#436d2e]/20"
                      : "bg-[#436d2e]/5 text-[#436d2e] hover:bg-[#436d2e]/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {entity.type === 'restaurant' ? <Utensils size={18} /> : <Heart size={18} />}
                    <span>{entity.name}</span>
                  </div>
                  <ArrowRight size={16} className={cn(
                    "transition-transform",
                    selectedEntity?.id === entity.id ? "translate-x-0" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                  )} />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#436d2e] text-white p-6 rounded-3xl shadow-xl shadow-[#436d2e]/10">
            <h3 className="font-bold text-xs mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-[#fccb58] rounded-full animate-pulse" />
              Network Status
            </h3>
            <div className="text-[11px] space-y-3 font-medium opacity-90">
              <p className="flex justify-between border-b border-white/10 pb-2"><span>Node:</span> <span className="text-[#fccb58]">Active</span></p>
              <p className="flex justify-between border-b border-white/10 pb-2"><span>Latency:</span> <span className="text-[#fccb58]">Minimal</span></p>
              <p className="flex justify-between"><span>Impact:</span> <span className="text-[#fccb58]">Optimized</span></p>
            </div>
          </div>
        </aside>

        {/* Chat Interface */}
        <section className="lg:col-span-9 flex flex-col soft-card overflow-hidden">
          {/* Chat Header */}
          <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#436d2e]/5">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold opacity-60">Secure Broadcast Channel</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-200" />
              <div className="w-2 h-2 rounded-full bg-slate-200" />
              <div className="w-2 h-2 rounded-full bg-slate-200" />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 chat-container bg-[#fdfcf8]/50">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex flex-col gap-2 max-w-[85%]",
                    msg.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "flex items-center gap-2 px-1 text-[10px] font-bold opacity-40",
                    msg.sender === 'user' ? "flex-row-reverse" : ""
                  )}>
                    <span>{msg.sender === 'user' ? "You" : "I have!"}</span>
                    <span>•</span>
                    <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  <div className={cn(
                    "p-5 rounded-2xl text-sm leading-relaxed",
                    msg.sender === 'user' 
                      ? "bg-[#436d2e] text-white shadow-md shadow-[#436d2e]/10" 
                      : "bg-white border border-[#436d2e]/5 shadow-sm"
                  )}>
                    <div className={cn(
                      "prose prose-sm max-w-none prose-p:leading-relaxed font-medium",
                      msg.sender === 'user' ? "prose-invert" : "text-[#436d2e]"
                    )}>
                      <ReactMarkdown>
                        {msg.text}
                      </ReactMarkdown>
                    </div>

                    {msg.match && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-6 bg-[#fccb58]/10 border border-[#fccb58]/30 p-5 rounded-2xl space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-[#fccb58]/20 pb-3">
                          <span className="font-bold text-xs">Match Detected</span>
                          <Logo className="w-5 h-5 opacity-60" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white/50 p-3 rounded-xl">
                            <p className="text-[9px] font-bold opacity-50 uppercase">Target Node</p>
                            <p className="text-xs font-bold">{msg.match.name}</p>
                          </div>
                          <div className="bg-white/50 p-3 rounded-xl">
                            <p className="text-[9px] font-bold opacity-50 uppercase">Payload Units</p>
                            <p className="text-xs font-bold">{msg.match.quantity} Units</p>
                          </div>
                          <div className="flex items-center gap-2 px-1">
                            <MapPin size={14} className="opacity-40" />
                            <span className="text-[10px] font-bold opacity-60">Range: Optimal</span>
                          </div>
                          <div className="flex items-center gap-2 px-1">
                            <Clock size={14} className="opacity-40" />
                            <span className="text-[10px] font-bold opacity-60">ETA: T-30m</span>
                          </div>
                        </div>
                        <button className="soft-button w-full text-xs py-3.5">
                          Confirm Handshake
                        </button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <div className="flex flex-col gap-2 mr-auto items-start">
                <div className="flex items-center gap-2 px-1 text-[10px] font-bold opacity-40">
                  <Logo className="w-3 h-3 animate-spin" />
                  <span>Negotiating...</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#436d2e]/5 shadow-sm flex gap-2">
                  <div className="w-1.5 h-1.5 bg-[#436d2e]/20 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-[#436d2e]/20 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-[#436d2e]/20 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-[#436d2e]/5">
            <div className="max-w-4xl mx-auto relative">
              {!selectedEntity && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-2xl border border-dashed border-[#436d2e]/20">
                  <p className="text-xs font-bold opacity-60 flex items-center gap-2">
                    <AlertCircle size={16} className="text-[#fccb58]" />
                    Authenticate Identity to Broadcast
                  </p>
                </div>
              )}
              <div className="flex gap-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={selectedEntity?.type === 'restaurant' ? "I have: [Surplus Data]" : "I need: [Demand Data]"}
                  className="flex-1 bg-[#436d2e]/5 border-none rounded-2xl p-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#436d2e]/10 transition-all placeholder:opacity-30"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="soft-button px-8 flex items-center gap-2"
                >
                  <span className="hidden md:inline">Broadcast</span>
                  <Send size={18} />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-6 justify-center">
                <div className="flex items-center gap-2 text-[10px] font-bold opacity-30">
                  <div className="w-1 h-1 bg-[#436d2e] rounded-full" />
                  P2P Secure
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold opacity-30">
                  <div className="w-1 h-1 bg-[#436d2e] rounded-full" />
                  AI Matching Engine
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold opacity-30">
                  <div className="w-1 h-1 bg-[#436d2e] rounded-full" />
                  Impact Verified
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Decoration */}
      <footer className="p-6 text-center opacity-30">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em]">
          I have! // You need! // 2026
        </p>
      </footer>
    </div>
  );

}
