import { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  Mic,
  Send,
  Clock,
  RotateCcw,
  Paperclip,
  Plus,
  Newspaper,
  IndianRupee,
  Briefcase,
  Building2,
  Share2,
  Copy,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'

let globalMsgId = 1000
const getNextMessageId = () => `msg-${++globalMsgId}`

interface Props {
  navigate: (screen: string) => void
}

type MessageRole = 'user' | 'ai'

interface Message {
  id: string
  role: MessageRole
  text: string
  cards?: Card[]
  sources?: string[]
  updatedAt?: string
}

interface Card {
  type: 'pg' | 'news' | 'price' | 'event' | 'alert' | 'job'
  title: string
  detail: string
  badge?: string
  color: string
  icon: string
}

// The 4 clean options matching the Script AI reference
const QUICK_OPTIONS = [
  {
    id: 'news',
    title: 'Latest News',
    prompt: 'Summarize the latest breaking news in Ludhiana today',
    icon: Newspaper,
    badgeBg: 'bg-[#FEF3C7]',
    badgeColor: 'text-[#D97706]',
  },
  {
    id: 'prices',
    title: 'Mandi Prices',
    prompt: 'Show today vegetable and mandi prices in Ludhiana',
    icon: IndianRupee,
    badgeBg: 'bg-[#E0F2FE]',
    badgeColor: 'text-[#0284C7]',
  },
  {
    id: 'jobs',
    title: 'Govt Jobs',
    prompt: 'What are the open government and local jobs in Ludhiana?',
    icon: Briefcase,
    badgeBg: 'bg-[#DCFCE7]',
    badgeColor: 'text-[#16A34A]',
  },
  {
    id: 'pg',
    title: 'PG Rates',
    prompt: 'Find student PGs and hostels under ₹8,000 near PTU Ludhiana',
    icon: Building2,
    badgeBg: 'bg-[#FCE7F3]',
    badgeColor: 'text-[#DB2777]',
  },
]

function AICard({ card, onClick }: { card: Card; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-[#F9F8F5] rounded-xl p-3 border border-[#E8E6E1] hover-lift flex items-start gap-3 transition-all cursor-pointer"
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
        style={{ backgroundColor: card.color + '15' }}
      >
        {card.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {card.badge && (
            <span
              className="text-[10px] font-700 px-1.5 py-0.5 rounded-full"
              style={{ color: card.color, backgroundColor: card.color + '18' }}
            >
              {card.badge}
            </span>
          )}
        </div>
        <h4 className="font-display font-600 text-[13px] text-[#0D1117] leading-snug">{card.title}</h4>
        <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{card.detail}</p>
      </div>
      <ChevronRight size={14} className="text-[#D1D5DB] shrink-0 mt-1" />
    </div>
  )
}

export default function AIScreen({ navigate }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [voiceActive, setVoiceActive] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const generateResponse = (query: string): Message => {
    const q = query.toLowerCase()

    if (q.includes('news') || q.includes('headline') || q.includes('update') || q.includes('happening')) {
      return {
        id: getNextMessageId(),
        role: 'ai',
        text: 'Here are the latest verified headlines for Ludhiana today:',
        cards: [
          {
            type: 'news',
            title: 'PTU adds 60 new BTech seats in CS for 2026-27',
            detail: 'Punjab Technical University approved extra seats following heavy student demand statewide.',
            badge: 'Education',
            color: '#2563EB',
            icon: '🎓',
          },
          {
            type: 'alert',
            title: 'Ferozepur Road diversion continues: 20-min delay',
            detail: 'Flyover construction active. Punjab Traffic Police recommends Pakhowal Road alternate.',
            badge: 'Traffic',
            color: '#DC2626',
            icon: '🚧',
          },
          {
            type: 'alert',
            title: 'IMD yellow rain alert tonight after 7 PM',
            detail: 'Thunderstorms and localized waterlogging expected near Miller Ganj and low-lying sectors.',
            badge: 'Weather',
            color: '#D97706',
            icon: '⛈️',
          },
          {
            type: 'news',
            title: 'Punjab Govt extends free bus pass to all college students from Nov 1',
            detail: 'All college-going students eligible under Mata Tripta Ji scheme across government routes.',
            badge: 'Government',
            color: '#16A34A',
            icon: '🚌',
          },
        ],
        sources: ['Tribune India', 'Punjab Traffic Police', 'IMD India'],
        updatedAt: 'Just now',
      }
    }

    if (q.includes('price') || q.includes('mandi') || q.includes('vegetable') || q.includes('rate') || q.includes('tomato')) {
      return {
        id: getNextMessageId(),
        role: 'ai',
        text: 'Live agricultural commodity rates at Ludhiana Mandi (Updated 9:30 AM):',
        cards: [
          {
            type: 'price',
            title: 'Tomato — ₹42 / kg (↓ 8% today)',
            detail: 'High arrivals from Himachal Pradesh. Retail expected around ₹48–50/kg.',
            badge: 'Best Buy',
            color: '#16A34A',
            icon: '🍅',
          },
          {
            type: 'price',
            title: 'Onion — ₹38 / kg (↑ 5%)',
            detail: 'Supplies tight from Nashik belt. Expected to stabilize by midweek.',
            badge: 'Rising',
            color: '#D97706',
            icon: '🧅',
          },
          {
            type: 'price',
            title: 'Potato — ₹24 / kg (Stable)',
            detail: 'Consistent cold storage outflows. Supply steady across major mandis.',
            badge: 'Stable',
            color: '#2563EB',
            icon: '🥔',
          },
          {
            type: 'price',
            title: 'Cauliflower — ₹35 / kg (↓ 12%)',
            detail: 'Fresh local harvest coming in from Jalandhar-Ludhiana border farms.',
            badge: 'Dropping',
            color: '#16A34A',
            icon: '🥦',
          },
        ],
        sources: ['AGMARKNET Govt', 'Ludhiana Mandi Board'],
        updatedAt: 'Just now',
      }
    }

    if (q.includes('job') || q.includes('police') || q.includes('vacancy') || q.includes('recruit') || q.includes('career') || q.includes('exam')) {
      return {
        id: getNextMessageId(),
        role: 'ai',
        text: 'Active government and verified local job recruitments in Ludhiana & Punjab:',
        cards: [
          {
            type: 'job',
            title: '850 Constable Vacancies — Punjab Police',
            detail: 'Applications open till 20 Oct 2026. Age: 18–28 years. 12th pass eligible.',
            badge: 'Govt Job',
            color: '#7C3AED',
            icon: '👮',
          },
          {
            type: 'job',
            title: 'PTU Ludhiana: 12 Research & Teaching Fellows',
            detail: 'Computer Science, AI & Mechanical departments. Stipend ₹35k–₹45k/month.',
            badge: 'University',
            color: '#2563EB',
            icon: '📚',
          },
          {
            type: 'job',
            title: 'Civil Hospital Ludhiana: 15 Lab Technicians',
            detail: 'Walk-in interviews on Oct 8, 2026 at Civil Surgeon Office. Diploma required.',
            badge: 'Healthcare',
            color: '#16A34A',
            icon: '🏥',
          },
          {
            type: 'job',
            title: 'Focal Point Industrial Zone: 40 CNC Operators',
            detail: 'Hero Cycles vendor unit. Salary ₹18,000–₹24,000 with PF and transport.',
            badge: 'Private',
            color: '#D97706',
            icon: '⚙️',
          },
        ],
        sources: ['PPSC Board', 'Punjab Govt Portal'],
        updatedAt: 'Just now',
      }
    }

    if (q.includes('pg') || q.includes('hostel') || q.includes('rent') || q.includes('room') || q.includes('stay') || q.includes('ptu')) {
      return {
        id: getNextMessageId(),
        role: 'ai',
        text: 'Verified student PGs and hostels near PTU and colleges in Ludhiana:',
        cards: [
          {
            type: 'pg',
            title: 'Green View Boys PG — ₹8,000 / month',
            detail: '0.7 km from PTU. 3 meals included, AC, 50 Mbps WiFi, backup power.',
            badge: '⭐ 4.6 Rated',
            color: '#16A34A',
            icon: '🏠',
          },
          {
            type: 'pg',
            title: 'Sharma Student Home — ₹7,200 / month',
            detail: '1.1 km from PTU. Double sharing, attached washroom, daily housekeeping.',
            badge: 'Budget Pick',
            color: '#2563EB',
            icon: '🛏️',
          },
          {
            type: 'pg',
            title: 'Model Town Girls Hostel — ₹8,500 / month',
            detail: '2.4 km from campus. 24x7 security guard, CCTV, library & study hall.',
            badge: 'Verified & Safe',
            color: '#DB2777',
            icon: '🔒',
          },
          {
            type: 'pg',
            title: 'City Star Shared Apartments — ₹6,000 / month',
            detail: 'Near Pakhowal Road. 3BHK flat sharing for 6 students with modular kitchen.',
            badge: 'Self Cooking',
            color: '#7C3AED',
            icon: '🏢',
          },
        ],
        sources: ['PTU Student Community', 'aaspaas Field Inspection'],
        updatedAt: 'Just now',
      }
    }

    // Default intelligent local answer
    return {
      id: getNextMessageId(),
      role: 'ai',
      text: `Here is what I found across verified Ludhiana records for "${query.trim()}":`,
      cards: [
        {
          type: 'news',
          title: `Local Intelligence for "${query.trim()}"`,
          detail: 'Aggregated from verified city databases, mandis, educational boards, and municipal feeds.',
          badge: 'Verified',
          color: '#1E2BB8',
          icon: '✦',
        },
        {
          type: 'alert',
          title: 'Live City Update',
          detail: 'Ludhiana traffic normal on GT Road; Ferozepur Road undergoing flyover construction. Mandis operating on schedule.',
          badge: 'Live Status',
          color: '#16A34A',
          icon: '📍',
        },
      ],
      sources: ['District Portal Ludhiana', 'aaspaas AI Engine'],
      updatedAt: 'Just now',
    }
  }

  const sendMessage = (text: string) => {
    if (!text.trim() || isThinking) return

    const userMsg: Message = {
      id: getNextMessageId(),
      role: 'user',
      text: text.trim(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsThinking(true)

    setTimeout(() => {
      const aiResponse = generateResponse(text)
      setMessages(prev => [...prev, aiResponse])
      setIsThinking(false)
    }, 800)
  }

  const startNewChat = () => {
    setMessages([])
    setInput('')
  }

  return (
    <div className="h-full flex flex-col bg-[#F9F8F5]">
      {/* Clean Header */}
      <div className="bg-white border-b border-[#E8E6E1] px-4 pt-3 pb-3 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1E2BB8] to-[#4357E6] flex items-center justify-center shadow-sm">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-700 text-[16px] text-[#0D1117] leading-tight">AI Chat</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              <span className="text-[11px] text-[#6B7280]">Ludhiana</span>
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={startNewChat}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E8E6E1] bg-[#F4F2ED] hover:bg-[#EBE8E0] text-xs font-600 text-[#0D1117] transition-all"
          >
            <RotateCcw size={13} className="text-[#1E2BB8]" />
            <span>New Chat</span>
          </button>
        )}
      </div>

      {/* Main Canvas */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
        {/* Simple & Clean Welcome State */}
        {messages.length === 0 ? (
          <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[58vh] py-6 animate-fade-in-up">
            {/* Clean Title */}
            <h2 className="font-display font-800 text-2xl md:text-3xl text-[#0D1117] text-center tracking-tight mb-2">
              Welcome to Script
            </h2>

            {/* Subtitle */}
            <p className="text-sm text-[#6B7280] text-center mb-8 leading-relaxed">
              Get started by choosing a task below or ask anything.
            </p>

            {/* 4 Clean Options (2x2 Grid) */}
            <div className="w-full grid grid-cols-2 gap-3 mb-6">
              {QUICK_OPTIONS.map(opt => {
                const IconComponent = opt.icon
                return (
                  <button
                    key={opt.id}
                    onClick={() => sendMessage(opt.prompt)}
                    className="group bg-white rounded-2xl border border-[#E8E6E1] p-3.5 shadow-sm hover:border-[#1E2BB8] hover:shadow transition-all flex items-center justify-between gap-2 text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl ${opt.badgeBg} flex items-center justify-center shrink-0`}>
                        <IconComponent size={18} className={opt.badgeColor} />
                      </div>
                      <span className="font-display font-700 text-[14px] text-[#0D1117] group-hover:text-[#1E2BB8] transition-colors truncate">
                        {opt.title}
                      </span>
                    </div>

                    <div className="w-6 h-6 rounded-full border border-[#E8E6E1] bg-[#FAF9F6] flex items-center justify-center text-[#9CA3AF] group-hover:border-[#1E2BB8] group-hover:text-[#1E2BB8] group-hover:bg-[#EEF1FF] transition-all shrink-0">
                      <Plus size={13} />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* Conversation Thread */
          <div className="space-y-4 max-w-xl mx-auto">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              >
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] px-4 py-2.5 bg-[#1E2BB8] text-white rounded-2xl rounded-br-sm shadow-sm">
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                ) : (
                  <div className="flex-1 space-y-2.5 max-w-full">
                    {/* AI Bubble */}
                    <div className="bg-white rounded-2xl rounded-tl-sm border border-[#E8E6E1] p-3.5 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={13} className="text-[#1E2BB8]" />
                          <span className="text-xs font-700 text-[#1E2BB8]">aaspaas AI</span>
                        </div>
                        {msg.updatedAt && (
                          <div className="flex items-center gap-1 text-[#9CA3AF] text-[10px]">
                            <Clock size={10} />
                            <span>{msg.updatedAt}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-[#0D1117] leading-relaxed">{msg.text}</p>

                      {/* Cards */}
                      {msg.cards && msg.cards.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {msg.cards.map((card, ci) => (
                            <AICard
                              key={ci}
                              card={card}
                              onClick={() => {
                                if (card.type === 'news') navigate('news')
                                if (card.type === 'price') navigate('prices')
                                if (card.type === 'job') navigate('news')
                                if (card.type === 'pg') navigate('student')
                                if (card.type === 'alert') navigate('alerts')
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="pt-2 border-t border-[#F4F2ED] flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[11px] text-[#16A34A] font-500">
                            <ShieldCheck size={13} />
                            <span>Verified: {msg.sources.join(' · ')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard?.writeText(msg.text)
                                setCopiedId(msg.id)
                                setTimeout(() => setCopiedId(null), 2000)
                              }}
                              className="text-[#9CA3AF] hover:text-[#0D1117] transition-colors p-1"
                              title="Copy response"
                            >
                              <Copy size={13} className={copiedId === msg.id ? 'text-[#16A34A]' : ''} />
                            </button>
                            <button
                              onClick={() => {
                                if (navigator.share) {
                                  navigator.share({ title: 'aaspaas AI', text: msg.text }).catch(() => {})
                                }
                              }}
                              className="text-[#9CA3AF] hover:text-[#0D1117] transition-colors p-1"
                              title="Share"
                            >
                              <Share2 size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Thinking indicator */}
            {isThinking && (
              <div className="flex items-center gap-2 bg-white rounded-xl border border-[#E8E6E1] px-3.5 py-2.5 max-w-xs shadow-sm animate-fade-in-up">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1E2BB8] pulse-dot" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#1E2BB8] pulse-dot" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#1E2BB8] pulse-dot" />
                <span className="text-xs text-[#6B7280] ml-1">Searching local feeds…</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Clean Input Box */}
      <div className="bg-white border-t border-[#E8E6E1] p-3 shrink-0">
        <div className="max-w-xl mx-auto">
          <div className="bg-[#FAF9F6] border-[1.5px] border-[#D4D8F0] focus-within:border-[#1E2BB8] focus-within:ring-3 focus-within:ring-[#EEF1FF] focus-within:bg-white rounded-2xl p-2.5 transition-all shadow-sm">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask about news, prices, jobs, PGs…"
              className="w-full bg-transparent text-[14px] text-[#0D1117] placeholder:text-[#9CA3AF] outline-none font-400 mb-2 px-1"
            />

            <div className="flex items-center justify-between pt-1.5 border-t border-[#E8E6E1]/60 px-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setInput('Find verified PGs near ')
                    inputRef.current?.focus()
                  }}
                  className="flex items-center gap-1 text-[11px] text-[#6B7280] hover:text-[#1E2BB8] transition-colors"
                >
                  <Paperclip size={13} className="text-[#9CA3AF]" />
                  <span>Attach</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVoiceActive(!voiceActive)
                    if (!voiceActive) sendMessage('What is happening around me today?')
                  }}
                  className={`flex items-center gap-1 text-[11px] transition-colors ${
                    voiceActive ? 'text-[#DC2626] font-600' : 'text-[#6B7280] hover:text-[#1E2BB8]'
                  }`}
                >
                  <Mic size={13} className={voiceActive ? 'animate-pulse text-[#DC2626]' : 'text-[#9CA3AF]'} />
                  <span>Voice</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#9CA3AF] font-mono-data">
                  {input.length}/2000
                </span>
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isThinking}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                    input.trim() && !isThinking
                      ? 'bg-[#1E2BB8] text-white hover:bg-[#162096] shadow-sm'
                      : 'bg-[#E8E6E1] text-[#9CA3AF]'
                  }`}
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-[#9CA3AF] text-center mt-1.5 leading-tight">
            Script may generate inaccurate information about people, places, or facts.
          </p>
        </div>
      </div>
    </div>
  )
}
