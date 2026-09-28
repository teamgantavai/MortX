import {
  ArrowUp,
  Briefcase,
  Building2,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Ellipsis,
  FileText,
  Image,
  IndianRupee,
  Map,
  MapPin,
  Menu,
  MessageSquare,
  Mic,
  Newspaper,
  Paperclip,
  Pencil,
  Pin,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Volume2,
  X
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

let globalMsgId = 1000
const getNextMessageId = () => `msg-${++globalMsgId}`

let globalSessionId = 500
const getNextSessionId = () => `chat-${++globalSessionId}`

interface Props {
  navigate: (screen: string) => void
}

type MessageRole = 'user' | 'ai'

interface Attachment {
  name: string
  type: 'image' | 'file' | 'location'
}

interface Message {
  id: string
  role: MessageRole
  text: string
  attachment?: Attachment
  docAttachment?: {
    name: string
    type: string
    size?: string
  }
  toolsInfo?: string
  cards?: Card[]
  sources?: string[]
  updatedAt?: string
}

interface Card {
  type: 'pg' | 'news' | 'price' | 'event' | 'alert' | 'job'
  title: string
  detail: string
  price?: string
  priceUnit?: string
  trend?: string
  trendType?: 'up' | 'down' | 'neutral'
  location?: string
  distance?: string
  amenities?: string[]
  badge?: string
  color: string
  icon: string
  image?: string
  source?: string
  actionLabel?: string
}

export interface ChatHistoryItem {
  id: string
  title: string
  timeGroup: 'Today' | 'Yesterday' | 'Previous 7 Days'
  timestamp: string
  messages: Message[]
  isPinned?: boolean
}

const INITIAL_HISTORY: ChatHistoryItem[] = [
  {
    id: 'chat-resume',
    title: 'Sheetal Jha resume redesign',
    timeGroup: 'Today',
    timestamp: 'Sep 8',
    isPinned: true,
    messages: [
      {
        id: 'msg-res-1',
        role: 'user',
        text: 'the resume is not looking professional make it professional and premium with premium color and design',
        attachment: {
          name: 'Sheetal_Jha_..._Resume.docx',
          type: 'file',
        },
        updatedAt: 'Sep 8',
      },
      {
        id: 'msg-res-2',
        role: 'ai',
        text: `I gave it a complete redesign with a premium navy-and-gold theme:

• **Navy header banner** with your name in an elegant serif, gold subtitle, and contact line
• **Gold rules** under every section heading for a consistent premium accent
• **Styled education table** with a navy header row and soft alternating shading
• **Diamond-bullet skills grid** in two clean columns
• **Tag-style rows** (with gold diamond separators) for Areas of Interest, Languages, and Personal Strengths
• Fits neatly on **one page**

Two things to update before you send it out: **[Your Phone Number]** and **[Your Email Address]** in the header — just replace the placeholder text directly in the file. Also worth double-checking the exact official name of your college, as flagged in the footnote.`,
        docAttachment: {
          name: 'Sheetal jha resume premium',
          type: 'docx',
        },
        toolsInfo: 'Ran 14 commands, read 3 files, and 2 more tools',
        updatedAt: 'Sep 8',
      },
    ],
  },
  {
    id: 'chat-1',
    title: 'Ludhiana Mandi tomato & onion prices',
    timeGroup: 'Today',
    timestamp: '2 hours ago',
    isPinned: false,
    messages: [
      {
        id: 'msg-h1',
        role: 'user',
        text: 'Show today vegetable and mandi prices in Ludhiana',
      },
      {
        id: 'msg-h2',
        role: 'ai',
        text: `Live agricultural commodity rates at Ludhiana Mandi (Updated 9:30 AM):

• **Tomato — ₹42 / kg** (↓ 8% today): High arrivals from Himachal Pradesh. Retail expected around ₹48–50/kg.
• **Onion — ₹38 / kg** (↑ 5%): Supplies tight from Nashik belt. Expected to stabilize by midweek.
• **Potato — ₹24 / kg** (Stable): Jalandhar cold-storage stock steady.`,
        sources: ['Punjab Mandi Board', 'Local Wholesalers Association'],
        updatedAt: '2h ago',
        cards: [
          {
            type: 'price',
            title: 'Tomato (Hybrid)',
            price: '₹42 / kg',
            trend: '↓ 8% today',
            trendType: 'down',
            detail: 'High arrivals from Himachal Pradesh. Retail expected around ₹48–50/kg',
            badge: 'Mandi',
            icon: '🍅',
            color: '#EF4444',
            source: 'Ludhiana Mandi',
            image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop&auto=format',
          },
          {
            type: 'price',
            title: 'Onion (Nashik)',
            price: '₹38 / kg',
            trend: '↑ 5% today',
            trendType: 'up',
            detail: 'Supplies tight from Nashik belt. Expected to stabilize by midweek',
            badge: 'Mandi',
            icon: '🧅',
            color: '#F59E0B',
            source: 'Ludhiana Mandi',
            image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&h=300&fit=crop&auto=format',
          },
          {
            type: 'price',
            title: 'Potato (Jyoti)',
            price: '₹24 / kg',
            trend: 'Stable',
            trendType: 'neutral',
            detail: 'Jalandhar cold-storage stock steady across wholesale depots',
            badge: 'Mandi',
            icon: '🥔',
            color: '#10B981',
            source: 'Cold Storage Depo',
            image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop&auto=format',
          },
        ],
      },
    ],
  },
  {
    id: 'chat-2',
    title: 'PTU CS BTech extra seats update',
    timeGroup: 'Today',
    timestamp: '5 hours ago',
    messages: [
      {
        id: 'msg-h3',
        role: 'user',
        text: 'Summarize the latest breaking news in Ludhiana today',
      },
      {
        id: 'msg-h4',
        role: 'ai',
        text: `Here are the latest verified headlines for Ludhiana today:

• **PTU CS Seats Increased**: Punjab Technical University approved 60 new BTech seats in CS for 2026–27 following heavy student demand.
• **District Education Fund**: Grant approved for modernization of engineering labs across colleges.`,
        sources: ['Tribune India', 'District Portal Ludhiana'],
        updatedAt: '5h ago',
        cards: [
          {
            type: 'news',
            title: 'PTU Approved 60 CS Seats for 2026-27',
            detail: 'State technical board approved intake increase after high admission cutoff surge.',
            badge: 'Education',
            icon: '🎓',
            color: '#1E2BB8',
            source: 'Punjab Tech Univ',
            image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop&auto=format',
          },
          {
            type: 'news',
            title: '₹4.8 Cr Sanctioned for Engineering Labs',
            detail: 'Modernization of smart robotics and electrical labs across Ludhiana colleges.',
            badge: 'District Fund',
            icon: '🏛️',
            color: '#3B82F6',
            source: 'District Portal',
            image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&h=300&fit=crop&auto=format',
          },
        ],
      },
    ],
  },
  {
    id: 'chat-3',
    title: 'Student PGs near PTU under ₹8,000',
    timeGroup: 'Yesterday',
    timestamp: 'Yesterday',
    messages: [
      {
        id: 'msg-h5',
        role: 'user',
        text: 'Find student PGs and hostels under ₹8,000 near PTU Ludhiana',
      },
      {
        id: 'msg-h6',
        role: 'ai',
        text: `Top verified student accommodations near PTU & Model Town:

• **Green View Boys PG — ₹6,500/mo**: Model Town, 1.2 km from PTU. Includes WiFi, 3 meals daily, AC power backup.
• **Comfort Stay Girls Hostel — ₹7,200/mo**: Civil Lines, 800m from bus stand. Biometric entry, CCTV, meals included.`,
        sources: ['aaspaas Student Directory'],
        updatedAt: 'Yesterday',
        cards: [
          {
            type: 'pg',
            title: 'Green View Boys PG',
            price: '₹6,500 / mo',
            location: 'Model Town',
            distance: '1.2 km from PTU',
            detail: 'Spacious double & single AC rooms, high-speed fiber WiFi, and 3 fresh homestyle meals daily.',
            badge: 'Verified',
            icon: '🏠',
            color: '#8B5CF6',
            source: 'Model Town PG',
            image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop&auto=format',
            actionLabel: 'View PG Details',
          },
          {
            type: 'pg',
            title: 'Comfort Stay Girls Hostel',
            price: '₹7,200 / mo',
            location: 'Civil Lines',
            distance: '800m from Bus Stand',
            detail: 'Secure biometric gated entry, 24/7 CCTV surveillance, female resident warden, and laundry included.',
            badge: 'Verified',
            icon: '🏢',
            color: '#EC4899',
            source: 'Civil Lines Hostel',
            image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=400&h=300&fit=crop&auto=format',
            actionLabel: 'View Hostel Details',
          },
        ],
      },
    ],
  },
  {
    id: 'chat-4',
    title: 'PSPCL Junior Engineer job openings',
    timeGroup: 'Yesterday',
    timestamp: 'Yesterday',
    messages: [
      {
        id: 'msg-h7',
        role: 'user',
        text: 'What are the open government and local jobs in Ludhiana?',
      },
      {
        id: 'msg-h8',
        role: 'ai',
        text: `Active job openings in Ludhiana district:

• **PSPCL Junior Engineer (Electrical) — 84 Posts**: Govt of Punjab · Diploma/B.Tech · Deadline: Oct 15, 2026.
• **Hero Cycles Production Supervisor**: Focal Point Phase IV · ₹28,000–35,000/mo · Immediate hiring.`,
        sources: ['Punjab Employment Portal'],
        updatedAt: 'Yesterday',
        cards: [
          {
            type: 'job',
            title: 'PSPCL Junior Engineer (Electrical)',
            price: '84 Openings',
            location: 'Punjab State Power Corp Ltd',
            distance: 'Deadline: Oct 15, 2026',
            detail: 'Diploma / B.Tech in Electrical Engineering. Govt Pay Scale Level 7 with pension benefits.',
            badge: 'Govt Job',
            icon: '⚡',
            color: '#10B981',
            source: 'PSPCL Punjab',
            image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&h=300&fit=crop&auto=format',
            actionLabel: 'Apply on Portal',
          },
          {
            type: 'job',
            title: 'Hero Cycles Production Supervisor',
            price: '₹28k–35k/mo',
            location: 'Focal Point Phase IV',
            distance: 'Immediate Joining',
            detail: 'Shift supervisor for manufacturing assembly line. 2+ years production plant experience required.',
            badge: 'Industrial',
            icon: '🚲',
            color: '#6366F1',
            source: 'Hero Cycles Ltd',
            image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop&auto=format',
            actionLabel: 'View Vacancy',
          },
        ],
      },
    ],
  },
  {
    id: 'chat-5',
    title: 'Ferozepur Road diversion & traffic',
    timeGroup: 'Previous 7 Days',
    timestamp: '4 days ago',
    messages: [
      {
        id: 'msg-h9',
        role: 'user',
        text: 'What is the traffic situation on Ferozepur Road?',
      },
      {
        id: 'msg-h10',
        role: 'ai',
        text: `Punjab Traffic Police reports ongoing flyover construction on Ferozepur Road:

• **Ferozepur Road Diversion**: Active flyover work causing ~20-min delay between Octroi post and Canal bridge.
• **Recommended Route**: Traffic police advises taking Pakhowal Road or Southern Bypass.`,
        sources: ['Punjab Traffic Police'],
        updatedAt: '4d ago',
      },
    ],
  },
]

// 4 Clean Options matching local features
const QUICK_OPTIONS = [
  {
    id: 'news',
    title: 'Latest News',
    prompt: 'Summarize the latest breaking news in Ludhiana today',
    icon: Newspaper,
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-200/60',
    badgeColor: 'text-amber-600',
  },
  {
    id: 'prices',
    title: 'Mandi Prices',
    prompt: 'Show today vegetable and mandi prices in Ludhiana',
    icon: IndianRupee,
    badgeBg: 'bg-sky-50',
    badgeBorder: 'border-sky-200/60',
    badgeColor: 'text-sky-600',
  },
  {
    id: 'jobs',
    title: 'Govt Jobs',
    prompt: 'What are the open government and local jobs in Ludhiana?',
    icon: Briefcase,
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200/60',
    badgeColor: 'text-emerald-600',
  },
  {
    id: 'pg',
    title: 'PG Rates',
    prompt: 'Find student PGs and hostels under ₹8,000 near PTU Ludhiana',
    icon: Building2,
    badgeBg: 'bg-purple-50',
    badgeBorder: 'border-purple-200/60',
    badgeColor: 'text-purple-600',
  },
]

function FormattedMessageText({ text }: { text?: string }) {
  const content = text || ''
  const lines = content.split('\n')

  return (
    <div className="space-y-3 text-[15px] sm:text-[15.5px] text-slate-800 leading-[1.75]">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />
        }

        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')
        const bulletContent = isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : trimmed

        // Parse bold markers: **text**
        const parts = bulletContent.split(/(\*\*[^*]+\*\*)/g)
        const parsedContent = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-semibold text-slate-950">
                {part.slice(2, -2)}
              </strong>
            )
          }
          return part
        })

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1 my-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2.5 shrink-0" />
              <div className="flex-1 min-w-0 text-slate-800">
                {parsedContent}
              </div>
            </div>
          )
        }

        return (
          <p key={idx} className="text-slate-800">
            {parsedContent}
          </p>
        )
      })}
    </div>
  )
}

function AICard({ card, onClick }: { card: Card; onClick?: () => void }) {
  const [imgError, setImgError] = useState(false)

  // Default topic-matching thumbnail images matching the visual style
  const defaultImage =
    card.image ||
    (card.type === 'price'
      ? card.title.toLowerCase().includes('tomato')
        ? 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop&auto=format'
        : card.title.toLowerCase().includes('onion')
          ? 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&h=300&fit=crop&auto=format'
          : 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop&auto=format'
      : card.type === 'pg'
        ? card.title.toLowerCase().includes('boys')
          ? 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop&auto=format'
          : 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=400&h=300&fit=crop&auto=format'
        : card.type === 'job'
          ? card.title.toLowerCase().includes('engineer')
            ? 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&h=300&fit=crop&auto=format'
            : 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop&auto=format'
          : card.title.toLowerCase().includes('seat') || card.title.toLowerCase().includes('ptu')
            ? 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop&auto=format'
            : 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=400&h=300&fit=crop&auto=format')

  const brandName =
    card.source ||
    (card.type === 'price'
      ? 'Ludhiana Mandi'
      : card.type === 'pg'
        ? card.location || 'Student Stay'
        : card.type === 'job'
          ? card.location || 'Punjab Career'
          : 'Punjab News')

  const badgeText =
    card.badge ||
    (card.type === 'price'
      ? 'Rate'
      : card.type === 'pg'
        ? 'Verified'
        : card.type === 'job'
          ? 'Job'
          : 'Live')

  const getBadgeStyles = (type: string) => {
    switch (type) {
      case 'price':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
      case 'news':
        return 'bg-indigo-50 text-[#1E2BB8] border-indigo-200/80'
      case 'alert':
        return 'bg-amber-50 text-amber-800 border-amber-200/80'
      case 'pg':
        return 'bg-purple-50 text-purple-700 border-purple-200/80'
      case 'job':
        return 'bg-blue-50 text-blue-700 border-blue-200/80'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200/80'
    }
  }

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="group relative bg-white rounded-[20px] overflow-hidden border border-slate-200/90 hover:border-[#1E2BB8]/40 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_24px_-4px_rgba(30,43,184,0.12),0_2px_6px_rgba(15,23,42,0.04)] transition-all duration-200 cursor-pointer flex flex-row items-stretch w-full h-[122px] sm:h-[126px] shrink-0 active:scale-[0.99]"
    >
      {/* Left Thumbnail Banner */}
      <div className="w-[115px] sm:w-[130px] shrink-0 h-full relative overflow-hidden bg-slate-100 border-r border-slate-100">
        {!imgError ? (
          <img
            src={defaultImage}
            alt={card.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 flex flex-col items-center justify-center p-2 text-center">
            <div className="w-9 h-9 rounded-xl bg-white shadow-2xs border border-slate-200/70 flex items-center justify-center text-lg mb-1">
              {card.icon || '📌'}
            </div>
            <span className="text-[9.5px] font-bold text-slate-500 tracking-wider uppercase">{badgeText}</span>
          </div>
        )}

        {/* Price / Highlight Chip overlay on thumbnail */}
        {card.price && (
          <div className="absolute bottom-2 left-2 bg-slate-900/85 backdrop-blur-xs text-white text-[10.5px] font-bold px-2 py-0.5 rounded-md truncate border border-white/10 shadow-xs max-w-[90%]">
            {card.price}
          </div>
        )}
      </div>

      {/* Right Details Container */}
      <div className="flex-1 p-3 sm:p-3.5 flex flex-col justify-between min-w-0 bg-white">
        {/* Top Entity & Badge Header: Avatar + Brand Name + Pill Badge + Three Dots */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#1E2BB8] to-[#4F46E5] text-white flex items-center justify-center font-bold text-[9px] shrink-0 shadow-2xs">
              {card.icon ? card.icon.slice(0, 2) : '•'}
            </div>
            <span className="text-[13px] font-semibold text-slate-900 truncate">
              {brandName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getBadgeStyles(card.type)} tracking-tight`}>
              {badgeText}
            </span>
            <button
              type="button"
              onClick={e => e.stopPropagation()}
              className="text-slate-400 hover:text-slate-700 transition-colors p-0.5"
              title="More options"
            >
              <Ellipsis size={15} />
            </button>
          </div>
        </div>

        {/* Bold Headline & 2-Line Subtitle */}
        <div className="my-auto py-0.5">
          <h4 className="font-bold text-[14px] sm:text-[14.5px] text-slate-900 leading-tight line-clamp-1 group-hover:text-[#1E2BB8] transition-colors tracking-tight">
            {card.title}
          </h4>

          {/* Subtitle / Description Snippet with ellipsis */}
          <p className="text-[12px] sm:text-[12.5px] text-slate-500 line-clamp-2 leading-relaxed font-normal mt-0.5">
            {card.detail}
          </p>
        </div>
      </div>
    </div>
  )
}

interface ChatHistoryRowProps {
  item: ChatHistoryItem
  isActive: boolean
  isRenaming: boolean
  renameText: string
  setRenameText: (text: string) => void
  onSelect: () => void
  onTogglePin: (e: React.MouseEvent) => void
  onStartRename: (e: React.MouseEvent) => void
  onSaveRename: (e?: React.FormEvent | React.MouseEvent) => void
  onCancelRename: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
}

function ChatHistoryRow({
  item,
  isActive,
  isRenaming,
  renameText,
  setRenameText,
  onSelect,
  onTogglePin,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onDelete,
}: ChatHistoryRowProps) {
  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors duration-150 ${isActive
          ? 'bg-[#EEF2FF] text-[#1E2BB8] font-semibold'
          : 'text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
        }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
        <MessageSquare
          size={14}
          strokeWidth={isActive ? 2.2 : 1.8}
          className={`shrink-0 ${isActive ? 'text-[#1E2BB8]' : 'text-[#94A3B8] group-hover:text-[#64748B]'}`}
        />
        {isRenaming ? (
          <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
            <input
              type="text"
              value={renameText}
              onChange={e => setRenameText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') onSaveRename()
                if (e.key === 'Escape') onCancelRename(e as any)
              }}
              autoFocus
              className="w-full text-xs font-medium px-2 py-0.5 rounded-md border border-[#1E2BB8] bg-white text-[#0F172A] outline-none"
            />
            <button
              type="button"
              onClick={e => onSaveRename(e)}
              className="p-1 rounded text-[#1E2BB8] hover:bg-[#EEF2FF]"
            >
              <Check size={12} />
            </button>
            <button
              type="button"
              onClick={onCancelRename}
              className="p-1 rounded text-[#94A3B8] hover:bg-[#F1F5F9]"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <span className="truncate text-[13px] leading-tight select-none">
            {item.title}
          </span>
        )}
      </div>

      {/* Action icons on hover / active */}
      {!isRenaming && (
        <div className="flex items-center gap-1 shrink-0">
          {item.isPinned && (
            <Pin size={11} className="text-[#1E2BB8] fill-[#1E2BB8] shrink-0" />
          )}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
            <button
              type="button"
              onClick={onTogglePin}
              title={item.isPinned ? 'Unpin' : 'Pin'}
              className="p-1 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#E2E8F0]/60 transition-colors"
            >
              <Pin size={12} className={item.isPinned ? 'fill-current' : ''} />
            </button>
            <button
              type="button"
              onClick={onStartRename}
              title="Rename"
              className="p-1 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#E2E8F0]/60 transition-colors"
            >
              <Pencil size={12} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              title="Delete"
              className="p-1 rounded-md text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AIScreen({ navigate }: Props) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_HISTORY[0].messages)
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [voiceActive, setVoiceActive] = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [attachedFile, setAttachedFile] = useState<Attachment | null>(null)

  // Chat History Sidebar states
  const [showSidebar, setShowSidebar] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>(INITIAL_HISTORY)
  const [activeChatId, setActiveChatId] = useState<string | null>(INITIAL_HISTORY[0].id)
  const [searchQuery, setSearchQuery] = useState('')
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null)
  const [renameText, setRenameText] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages, isThinking])

  // Handle mobile visualViewport resize when virtual keyboard opens
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return

    const handleViewportChange = () => {
      if (typeof document !== 'undefined' && document.activeElement === inputRef.current) {
        setTimeout(() => {
          inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }, 100)
      }
    }

    window.visualViewport.addEventListener('resize', handleViewportChange)
    return () => window.visualViewport?.removeEventListener('resize', handleViewportChange)
  }, [])

  const handleInputFocus = () => {
    setShowAttachMenu(false)
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 150)
  }

  const triggerVoiceInput = () => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.lang = 'en-IN'
        recognition.interimResults = false
        setVoiceActive(true)
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInput(transcript)
          setVoiceActive(false)
          sendMessage(transcript)
        }
        recognition.onerror = () => setVoiceActive(false)
        recognition.onend = () => setVoiceActive(false)
        recognition.start()
        return
      } catch {
        // Fallback
      }
    }

    setVoiceActive(true)
    setTimeout(() => {
      setVoiceActive(false)
      sendMessage('What is the latest update in Ludhiana?')
    }, 1200)
  }

  const generateResponse = (query: string, attachment?: Attachment): Message => {
    const q = query.toLowerCase()

    if (attachment && (attachment.name.toLowerCase().includes('resume') || q.includes('resume') || q.includes('cv') || q.includes('redesign'))) {
      return {
        id: getNextMessageId(),
        role: 'ai',
        text: `I gave it a complete redesign with a premium navy-and-gold theme:

• **Navy header banner** with your name in an elegant serif, gold subtitle, and contact line
• **Gold rules** under every section heading for a consistent premium accent
• **Styled education table** with a navy header row and soft alternating shading
• **Diamond-bullet skills grid** in two clean columns
• **Tag-style rows** (with gold diamond separators) for Areas of Interest, Languages, and Personal Strengths
• Fits neatly on **one page**

Two things to update before you send it out: **[Your Phone Number]** and **[Your Email Address]** in the header — just replace the placeholder text directly in the file. Also worth double-checking the exact official name of your college, as flagged in the footnote.`,
        docAttachment: {
          name: `${attachment.name.replace(/\.[^/.]+$/, '')} premium`,
          type: 'docx',
        },
        toolsInfo: 'Ran 14 commands, read 3 files, and 2 more tools',
        sources: ['Template Studio Pro', 'ATS Formatter'],
        updatedAt: 'Just now',
      }
    }

    if (q.includes('resume') || q.includes('cv') || q.includes('redesign')) {
      return {
        id: getNextMessageId(),
        role: 'ai',
        text: `I gave it a complete redesign with a premium navy-and-gold theme:

• **Navy header banner** with your name in an elegant serif, gold subtitle, and contact line
• **Gold rules** under every section heading for a consistent premium accent
• **Styled education table** with a navy header row and soft alternating shading
• **Diamond-bullet skills grid** in two clean columns
• **Tag-style rows** (with gold diamond separators) for Areas of Interest, Languages, and Personal Strengths
• Fits neatly on **one page**

Two things to update before you send it out: **[Your Phone Number]** and **[Your Email Address]** in the header — just replace the placeholder text directly in the file. Also worth double-checking the exact official name of your college, as flagged in the footnote.`,
        docAttachment: {
          name: 'Sheetal jha resume premium',
          type: 'docx',
        },
        toolsInfo: 'Ran 14 commands, read 3 files, and 2 more tools',
        sources: ['Template Studio Pro', 'ATS Formatter'],
        updatedAt: 'Just now',
      }
    }

    if (attachment) {
      return {
        id: getNextMessageId(),
        role: 'ai',
        text: `I've analyzed your attached ${attachment.type === 'image' ? 'photo' : attachment.type === 'location' ? 'location' : 'document'} **"${attachment.name}"**:

• **Document Processed**: Extracted context successfully cross-referenced against verified records.
• **Status**: All entries matched with active listings. No discrepancies found.`,
        toolsInfo: 'Ran 4 commands, read 1 file',
        sources: ['District Portal Ludhiana'],
        updatedAt: 'Just now',
      }
    }

    if (q.includes('news') || q.includes('headline') || q.includes('update') || q.includes('happening')) {
      return {
        id: getNextMessageId(),
        role: 'ai',
        text: `Here are the latest verified headlines for Ludhiana today:

• **PTU CS Seats Increased**: Punjab Technical University approved 60 new BTech seats in CS for 2026–27 following statewide student demand.
• **Ferozepur Road Diversion**: Flyover construction active with 20-min delay; Punjab Traffic Police recommends Pakhowal Road.
• **IMD Yellow Rain Alert**: Thunderstorms and localized waterlogging expected tonight after 7 PM in low-lying sectors.
• **Free College Bus Pass**: Punjab Govt announced free bus passes for all college students on state transport routes.`,
        sources: ['Tribune India', 'Punjab Traffic Police', 'District Portal Ludhiana'],
        updatedAt: 'Just now',
        cards: [
          {
            type: 'news',
            title: 'PTU Approved 60 CS Seats for 2026-27',
            detail: 'Punjab Technical University approved intake increase after high admission cutoff surge.',
            badge: 'Education',
            icon: '🎓',
            color: '#1E2BB8',
            source: 'Punjab Tech Univ',
            image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop&auto=format',
          },
          {
            type: 'news',
            title: 'Ferozepur Road Flyover Diversion Active',
            detail: 'Construction work causing ~20-min delay; Police recommends Pakhowal Road.',
            badge: 'Traffic Alert',
            icon: '🚧',
            color: '#F59E0B',
            source: 'Traffic Police',
            image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=400&h=300&fit=crop&auto=format',
          },
        ],
      }
    }

    if (q.includes('price') || q.includes('mandi') || q.includes('vegetable') || q.includes('rate') || q.includes('tomato')) {
      return {
        id: getNextMessageId(),
        role: 'ai',
        text: `Live agricultural commodity rates at Ludhiana Mandi (Updated 9:30 AM):

• **Tomato — ₹42 / kg** (↓ 8% today): High arrivals from Himachal Pradesh. Retail expected around ₹48–50/kg.
• **Onion — ₹38 / kg** (↑ 5%): Supplies tight from Nashik belt. Expected to stabilize by midweek.
• **Potato — ₹24 / kg** (Stable): Jalandhar cold-storage stock steady. No change expected this week.`,
        sources: ['Punjab Mandi Board', 'Local Wholesalers Association'],
        updatedAt: 'Updated 2h ago',
        cards: [
          {
            type: 'price',
            title: 'Tomato (Hybrid)',
            price: '₹42 / kg',
            trend: '↓ 8% today',
            trendType: 'down',
            detail: 'High arrivals from Himachal Pradesh. Retail expected around ₹48–50/kg',
            badge: 'Mandi Rate',
            icon: '🍅',
            color: '#EF4444',
            source: 'Ludhiana Mandi',
            image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop&auto=format',
          },
          {
            type: 'price',
            title: 'Onion (Nashik)',
            price: '₹38 / kg',
            trend: '↑ 5% today',
            trendType: 'up',
            detail: 'Supplies tight from Nashik belt. Expected to stabilize by midweek',
            badge: 'Mandi Rate',
            icon: '🧅',
            color: '#F59E0B',
            source: 'Ludhiana Mandi',
            image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&h=300&fit=crop&auto=format',
          },
          {
            type: 'price',
            title: 'Potato (Jyoti)',
            price: '₹24 / kg',
            trend: 'Stable',
            trendType: 'neutral',
            detail: 'Jalandhar cold-storage stock steady across wholesale depots',
            badge: 'Cold Storage',
            icon: '🥔',
            color: '#10B981',
            source: 'Cold Storage Depo',
            image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop&auto=format',
          },
        ],
      }
    }

    if (q.includes('pg') || q.includes('room') || q.includes('hostel') || q.includes('rent') || q.includes('student')) {
      return {
        id: getNextMessageId(),
        role: 'ai',
        text: `Top verified student accommodations near PTU & Model Town:

• **Green View Boys PG — ₹6,500/mo**: Model Town, 1.2 km from PTU. Includes WiFi, 3 meals daily, and AC backup.
• **Comfort Stay Girls Hostel — ₹7,200/mo**: Civil Lines, 800m from bus stand. Biometric entry, CCTV coverage, and meals included.`,
        sources: ['aaspaas Student Directory', 'Property Verification Team'],
        updatedAt: 'Today',
        cards: [
          {
            type: 'pg',
            title: 'Green View Boys PG',
            price: '₹6,500 / mo',
            location: 'Model Town',
            distance: '1.2 km from PTU',
            detail: 'Spacious double & single AC rooms, high-speed fiber WiFi, and 3 fresh homestyle meals daily.',
            amenities: ['WiFi', '3 Meals', 'AC Backup', 'RO Water', 'Study Desk'],
            badge: 'Verified PG',
            icon: '🏠',
            color: '#8B5CF6',
            source: 'Model Town PG',
            image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop&auto=format',
            actionLabel: 'View PG Details',
          },
          {
            type: 'pg',
            title: 'Comfort Stay Girls Hostel',
            price: '₹7,200 / mo',
            location: 'Civil Lines',
            distance: '800m from Bus Stand',
            detail: 'Secure biometric gated entry, 24/7 CCTV surveillance, female resident warden, and laundry included.',
            amenities: ['Biometric Entry', 'CCTV 24/7', '3 Meals', 'Laundry', 'Power Backup'],
            badge: 'Verified Hostel',
            icon: '🏢',
            color: '#EC4899',
            source: 'Civil Lines Hostel',
            image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=400&h=300&fit=crop&auto=format',
            actionLabel: 'View Hostel Details',
          },
        ],
      }
    }

    if (q.includes('job') || q.includes('vacancy') || q.includes('work') || q.includes('hiring') || q.includes('recruitment')) {
      return {
        id: getNextMessageId(),
        role: 'ai',
        text: `Active employment opportunities in Ludhiana district:

• **PSPCL Junior Engineer (Electrical) — 84 Posts**: Govt of Punjab · Diploma/B.Tech · Deadline: Oct 15, 2026.
• **Hero Cycles Production Supervisor**: Focal Point Phase IV · ₹28,000–35,000/mo · Immediate hiring.`,
        sources: ['Punjab Employment Portal', 'Ludhiana Industrial Directory'],
        updatedAt: 'Today',
        cards: [
          {
            type: 'job',
            title: 'PSPCL Junior Engineer (Electrical)',
            price: '84 Openings',
            location: 'Punjab State Power Corp Ltd',
            distance: 'Deadline: Oct 15, 2026',
            detail: 'Diploma / B.Tech in Electrical Engineering. Govt Pay Scale Level 7 with pension benefits.',
            badge: 'Govt Job',
            icon: '⚡',
            color: '#10B981',
            source: 'Govt of Punjab',
            image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&h=300&fit=crop&auto=format',
            actionLabel: 'Apply on Portal',
          },
          {
            type: 'job',
            title: 'Hero Cycles Production Supervisor',
            price: '₹28k–35k/mo',
            location: 'Focal Point Phase IV',
            distance: 'Immediate Joining',
            detail: 'Shift supervisor for manufacturing assembly line. 2+ years production plant experience required.',
            badge: 'Industrial',
            icon: '🚲',
            color: '#6366F1',
            source: 'Hero Cycles Ltd',
            image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop&auto=format',
            actionLabel: 'View Vacancy',
          },
        ],
      }
    }

    // Natural greeting handling
    const isGreeting = ['hi', 'hello', 'hey', 'hmm', 'hmmm', 'ok', 'okay', 'good morning', 'good evening', 'namaste'].some(
      g => q === g || q.startsWith(g + ' ')
    )
    if (isGreeting) {
      return {
        id: getNextMessageId(),
        role: 'ai',
        text: `Hello! I can help you with live verified information across Ludhiana:

• **Mandi Commodity Rates**: Real-time vegetable and grain prices.
• **Traffic & Road Work**: GT Road, flyover construction, and alternate diversions.
• **City News & Weather**: Verified headlines, alerts, and municipal updates.
• **Student & Job Hub**: Verified PGs near PTU and government job openings.`,
        sources: ['District Administration Ludhiana'],
        updatedAt: 'Just now',
      }
    }

    // Default intelligent response without robotic echoing
    return {
      id: getNextMessageId(),
      role: 'ai',
      text: `Live status and verified updates across Ludhiana:

• **Traffic Conditions**: GT Road traffic moving normally; Ferozepur Road diversion active near flyover construction.
• **Markets & City Services**: Mandis, public transport, and municipal offices operating on schedule.`,
      sources: ['District Administration Ludhiana'],
      updatedAt: 'Just now',
    }
  }

  const sendMessage = (text: string) => {
    if ((!text.trim() && !attachedFile) || isThinking) return

    const currentAttach = attachedFile
    const userMsg: Message = {
      id: getNextMessageId(),
      role: 'user',
      text: text.trim(),
      attachment: currentAttach || undefined,
    }

    // Add or update chat history
    let currentSessionId = activeChatId
    if (!currentSessionId) {
      currentSessionId = getNextSessionId()
      setActiveChatId(currentSessionId)
      const newHistoryItem: ChatHistoryItem = {
        id: currentSessionId,
        title: text.trim().slice(0, 32) || currentAttach?.name || 'New conversation',
        timeGroup: 'Today',
        timestamp: 'Just now',
        messages: [userMsg],
      }
      setChatHistory(prev => [newHistoryItem, ...prev])
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setAttachedFile(null)
    setShowAttachMenu(false)
    setIsThinking(true)

    const userQuery = text || currentAttach?.name || ''

    // Connect to backend AI Answer Engine
    fetch('/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: userQuery,
        userLocation: { latitude: 31.3260, longitude: 75.5762 },
        location: { latitude: 31.3260, longitude: 75.5762 }
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.answer?.text) {
          const sourcesList = (data.answer.sources || []).map((s: any) => s.name || s.url)

          // Map interactive cards from retrieved results (events, alerts, news)
          let cardsList: Card[] = []
          if (Array.isArray(data.results) && data.results.length > 0) {
            cardsList = data.results.slice(0, 6).map((item: any) => {
              if (item.type === 'EVENT') {
                const dateBadge = item.metadata?.startAt
                  ? new Date(item.metadata.startAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  : 'Event'
                return {
                  type: 'event' as const,
                  title: item.title,
                  detail: item.summary || item.title,
                  badge: dateBadge,
                  icon: '📅',
                  color: '#8B5CF6',
                  source: item.metadata?.venue || item.source?.name || 'Local Event',
                  location: item.location?.name,
                  distance: item.location?.distanceKm != null ? `${item.location.distanceKm} km` : undefined,
                  actionLabel: 'View Event',
                }
              }
              if (item.type === 'ALERT' || item.type === 'GOVERNMENT_ALERT') {
                return {
                  type: 'alert' as const,
                  title: item.title,
                  detail: item.summary || item.title,
                  badge: item.metadata?.severity || 'Official Notice',
                  icon: '⚠️',
                  color: item.metadata?.severity === 'URGENT' ? '#DC2626' : '#D97706',
                  source: item.metadata?.department || item.metadata?.issuedBy || item.source?.name || 'Government Notice',
                  location: item.location?.name,
                  actionLabel: 'View Notice',
                }
              }
              return {
                type: 'news' as const,
                title: item.title,
                detail: item.summary || item.title,
                badge: item.metadata?.category || item.location?.name || 'News',
                icon: '📰',
                color: '#1E2BB8',
                source: item.source?.name || 'Verified Feed',
                location: item.location?.name,
                distance: item.location?.distanceKm != null ? `${item.location.distanceKm} km` : undefined,
                actionLabel: 'Read Article',
              }
            })
          } else if (Array.isArray(data.answer?.highlights) && data.answer.highlights.length > 0) {
            cardsList = data.answer.highlights.map((h: any) => ({
              type: 'news' as const,
              title: h.title,
              detail: h.summary,
              badge: h.location || 'Local',
              icon: '📰',
              color: '#1E2BB8',
              source: h.sourceId || 'Verified Feed',
            }))
          }

          const latency = data.metadata?.latencyMs ?? 0
          const count = data.metadata?.resultCount ?? cardsList.length
          const confidence = data.answer.confidence || 'HIGH'
          const toolsInfo = count > 0
            ? `Retrieved ${count} verified source${count > 1 ? 's' : ''} in ${latency}ms · Confidence: ${confidence}`
            : undefined

          const aiResponse: Message = {
            id: getNextMessageId(),
            role: 'ai',
            text: data.answer.text,
            sources: sourcesList.length > 0 ? sourcesList : undefined,
            toolsInfo,
            updatedAt: 'Just now',
            cards: cardsList.length > 0 ? cardsList : undefined,
          }

          setMessages(prev => {
            const next = [...prev, aiResponse]
            setChatHistory(hPrev =>
              hPrev.map(item =>
                item.id === currentSessionId ? { ...item, messages: next } : item
              )
            )
            return next
          })
          setIsThinking(false)
          return
        }
        throw new Error('Fallback to local generator')
      })
      .catch(() => {
        const aiResponse = generateResponse(userQuery, currentAttach || undefined)
        setMessages(prev => {
          const next = [...prev, aiResponse]
          setChatHistory(hPrev =>
            hPrev.map(item =>
              item.id === currentSessionId ? { ...item, messages: next } : item
            )
          )
          return next
        })
        setIsThinking(false)
      })
  }

  const startNewChat = () => {
    setMessages([])
    setInput('')
    setAttachedFile(null)
    setShowAttachMenu(false)
    setActiveChatId(null)
    setShowSidebar(false)
  }

  const loadChatSession = (session: ChatHistoryItem) => {
    setActiveChatId(session.id)
    setMessages(session.messages)
    setInput('')
    setAttachedFile(null)
    setShowAttachMenu(false)
    setShowSidebar(false)
  }

  const deleteChatSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setChatHistory(prev => prev.filter(c => c.id !== id))
    if (activeChatId === id) {
      startNewChat()
    }
  }

  const togglePinChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setChatHistory(prev =>
      prev.map(c => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    )
  }

  const startRenameChat = (item: ChatHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setRenamingChatId(item.id)
    setRenameText(item.title)
  }

  const saveRenameChat = (id: string, e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (renameText.trim()) {
      setChatHistory(prev =>
        prev.map(c => (c.id === id ? { ...c, title: renameText.trim() } : c))
      )
    }
    setRenamingChatId(null)
    setRenameText('')
  }

  const cancelRenameChat = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRenamingChatId(null)
    setRenameText('')
  }

  const filteredHistory = chatHistory.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pinnedItems = filteredHistory.filter(item => item.isPinned)
  const unpinnedItems = filteredHistory.filter(item => !item.isPinned)

  const timeGroups: ('Today' | 'Yesterday' | 'Previous 7 Days')[] = [
    'Today',
    'Yesterday',
    'Previous 7 Days',
  ]

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col bg-[#F8FAFC] relative overflow-hidden">
      {/* Sidebar Drawer Menu (Chat History) */}
      {showSidebar && (
        <>
          {/* Backdrop overlay with blur */}
          <div
            className="fixed inset-0 bg-[#0B0F19]/45 z-50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setShowSidebar(false)}
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-[290px] max-w-[85vw] bg-white z-50 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.3)] flex flex-col border-r border-[#E2E8F0] rounded-r-3xl overflow-hidden animate-fade-in-right">
            {/* Drawer Header */}
            <div className="px-4 py-3.5 border-b border-[#F1F5F9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#1E2BB8] to-[#4357E6] flex items-center justify-center text-white shadow-xs">
                  <Sparkles size={14} />
                </div>
                <span className="font-display font-bold text-[15px] text-[#0F172A] tracking-tight">aaspaas</span>
              </div>

              <button
                type="button"
                onClick={() => setShowSidebar(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-all"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* + New Chat Action */}
            <div className="px-3 pt-3 pb-1">
              <button
                type="button"
                onClick={startNewChat}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#1E2BB8] text-white hover:bg-[#19239E] active:scale-[0.98] transition-all font-medium text-[13px] shadow-xs"
              >
                <Plus size={16} strokeWidth={2.2} />
                <span>New chat</span>
              </button>
            </div>

            {/* Search */}
            <div className="px-3 py-1.5">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] focus-within:bg-white focus-within:border-[#1E2BB8] transition-all">
                <Search size={13} className="text-[#94A3B8] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full bg-transparent outline-none text-[12px] placeholder:text-[#94A3B8]"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-[#94A3B8] hover:text-[#0F172A]">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Conversation List */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-2 py-1 space-y-3">
              {filteredHistory.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] text-[#94A3B8] flex items-center justify-center mx-auto mb-2">
                    <MessageSquare size={18} />
                  </div>
                  <p className="text-xs text-[#64748B]">No chats found</p>
                </div>
              ) : (
                <>
                  {/* Pinned Section */}
                  {pinnedItems.length > 0 && (
                    <div className="space-y-0.5">
                      <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-[#94A3B8]">
                        Pinned
                      </div>
                      {pinnedItems.map(item => (
                        <ChatHistoryRow
                          key={item.id}
                          item={item}
                          isActive={activeChatId === item.id}
                          isRenaming={renamingChatId === item.id}
                          renameText={renameText}
                          setRenameText={setRenameText}
                          onSelect={() => {
                            if (renamingChatId !== item.id) loadChatSession(item)
                          }}
                          onTogglePin={e => togglePinChat(item.id, e)}
                          onStartRename={e => startRenameChat(item, e)}
                          onSaveRename={e => saveRenameChat(item.id, e)}
                          onCancelRename={cancelRenameChat}
                          onDelete={e => deleteChatSession(item.id, e)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Timeline groups */}
                  {timeGroups.map(group => {
                    const groupItems = unpinnedItems.filter(i => i.timeGroup === group)
                    if (groupItems.length === 0) return null

                    return (
                      <div key={group} className="space-y-0.5">
                        <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-[#94A3B8]">
                          {group}
                        </div>
                        {groupItems.map(item => (
                          <ChatHistoryRow
                            key={item.id}
                            item={item}
                            isActive={activeChatId === item.id}
                            isRenaming={renamingChatId === item.id}
                            renameText={renameText}
                            setRenameText={setRenameText}
                            onSelect={() => {
                              if (renamingChatId !== item.id) loadChatSession(item)
                            }}
                            onTogglePin={e => togglePinChat(item.id, e)}
                            onStartRename={e => startRenameChat(item, e)}
                            onSaveRename={e => saveRenameChat(item.id, e)}
                            onCancelRename={cancelRenameChat}
                            onDelete={e => deleteChatSession(item.id, e)}
                          />
                        ))}
                      </div>
                    )
                  })}
                </>
              )}
            </div>

            {/* Bottom User Profile */}
            <div className="p-3 border-t border-[#F1F5F9] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#1E2BB8] to-[#4F46E5] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  D
                </div>
                <span className="text-xs font-semibold text-[#0F172A] truncate">Dilkhush Singh</span>
              </div>

              {chatHistory.length > 0 && (
                <div>
                  {showClearConfirm ? (
                    <div className="flex items-center gap-1.5 animate-fade-in">
                      <button
                        type="button"
                        onClick={() => {
                          setChatHistory([])
                          startNewChat()
                          setShowClearConfirm(false)
                        }}
                        className="px-2 py-1 rounded-md bg-[#DC2626] text-white text-[10.5px] font-semibold hover:bg-[#B91C1C]"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(false)}
                        className="px-1.5 py-1 rounded-md text-[#64748B] hover:bg-[#F1F5F9] text-[10.5px]"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(true)}
                      title="Clear history"
                      className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Top Header */}
      <div className="px-4 py-2.5 shrink-0 flex items-center justify-between z-10 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        {/* Left Hamburger Menu - Opens Chat History Sidebar */}
        <button
          onClick={() => setShowSidebar(true)}
          className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 flex items-center justify-center text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all"
          title="Open chat history sidebar"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#1E2BB8] to-[#4357E6] flex items-center justify-center text-white shadow-xs">
            <Sparkles size={12} strokeWidth={2.4} />
          </div>
          <span className="font-display font-bold text-[15px] text-slate-900 tracking-tight">aaspaas</span>
        </div>

        {/* Right New Chat Button */}
        <button
          onClick={startNewChat}
          className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 flex items-center justify-center text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all"
          title="New Chat"
        >
          <SquarePen size={17} />
        </button>
      </div>

      {/* Main Chat Canvas */}
      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-3 flex flex-col bg-[#F8FAFC]">
        {/* Messages Thread */}
        {messages.length > 0 && (
          <div className="space-y-6 max-w-2xl mx-auto w-full my-auto pb-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              >
                {msg.role === 'user' ? (
                  <div className="flex flex-col items-end gap-1.5 max-w-[85%] ml-auto">
                    {msg.attachment && (
                      <div className="bg-white text-slate-900 rounded-2xl p-3 border border-slate-200/90 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] flex flex-col gap-2 min-w-[170px] max-w-[240px]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            {msg.attachment.type === 'image' ? <Image size={16} /> : msg.attachment.type === 'location' ? <MapPin size={16} /> : <FileText size={16} />}
                          </div>
                          <p className="text-[13px] font-semibold text-slate-900 truncate">{msg.attachment.name}</p>
                        </div>
                        <span className="w-fit text-[9.5px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {msg.attachment.type === 'image' ? 'IMAGE' : msg.attachment.type === 'location' ? 'MAP' : 'DOCX'}
                        </span>
                      </div>
                    )}
                    {msg.text && (
                      <div className="px-5 py-3 bg-[#F0F2F6] hover:bg-[#EBEEF4] text-slate-900 rounded-3xl rounded-tr-md shadow-2xs max-w-xl border border-slate-200/60 transition-colors">
                        <p className="text-[14.5px] leading-relaxed font-normal text-slate-900">{msg.text}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-400 text-xs pr-1 mt-0.5">
                      <span className="text-[11px] font-medium text-slate-400">{msg.updatedAt || 'Sep 8'}</span>
                      <button
                        onClick={() => sendMessage(msg.text)}
                        className="p-1 hover:text-slate-700 transition-colors"
                        title="Resend"
                      >
                        <RotateCcw size={12} />
                      </button>
                      <button
                        onClick={() => {
                          setInput(msg.text)
                          inputRef.current?.focus()
                        }}
                        className="p-1 hover:text-slate-700 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                            navigator.clipboard.writeText(msg.text)
                          }
                        }}
                        className="p-1 hover:text-slate-700 transition-colors"
                        title="Copy"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full space-y-3.5 max-w-full">
                    {/* Optional tools / reasoning status bar (Image 1 style) */}
                    {msg.toolsInfo && (
                      <div className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-500 hover:text-slate-800 font-medium cursor-pointer transition-colors py-0.5">
                        <span>{msg.toolsInfo}</span>
                        <ChevronRight size={13} className="text-slate-400" />
                      </div>
                    )}

                    {/* AI Response Text - Completely Borderless directly on canvas */}
                    <div className="w-full">
                      <FormattedMessageText text={msg.text} />
                    </div>

                    {/* Document Attachment Card (Image 1 style adapted for harmonious light theme) */}
                    {msg.docAttachment && (
                      <div className="w-full max-w-lg bg-white text-slate-900 rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] hover:border-slate-300 flex items-center justify-between gap-3 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#1E2BB8] flex items-center justify-center shrink-0">
                            <FileText size={20} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-[13.5px] text-slate-900 truncate">
                              {msg.docAttachment.name}
                            </h4>
                            <p className="text-[11.5px] text-slate-500 font-medium mt-0.5">
                              Document · {msg.docAttachment.type.toUpperCase()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0">
                          <span>Download</span>
                          <span className="w-px h-3 bg-slate-700 mx-2" />
                          <ChevronDown size={14} className="text-slate-300" />
                        </div>
                      </div>
                    )}

                    {/* Rich Data Cards (Grid format with horizontal scrolling) */}
                    {msg.cards && msg.cards.length > 0 && (
                      <div className="w-full pt-1 pb-1">
                        <div className="grid grid-flow-col auto-cols-[330px] sm:auto-cols-[370px] gap-3.5 overflow-x-auto no-scrollbar snap-x snap-mandatory py-1 px-0.5">
                          {msg.cards.map((card, ci) => (
                            <div key={ci} className="snap-start h-full">
                              <AICard
                                card={card}
                                onClick={() => {
                                  if (card.type === 'news') navigate('news')
                                  if (card.type === 'price') navigate('prices')
                                  if (card.type === 'job') navigate('news')
                                  if (card.type === 'pg') navigate('student')
                                  if (card.type === 'alert') navigate('alerts')
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clean Minimalist Action Row (Image 1 style) - Borderless icons */}
                    <div className="pt-1 flex items-center gap-2.5 text-slate-400 text-xs">
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                            const utter = new SpeechSynthesisUtterance((msg.text || '').replace(/[*#•]/g, ''))
                            utter.lang = 'en-US'
                            window.speechSynthesis.speak(utter)
                          }
                        }}
                        className="p-1 hover:text-slate-700 transition-colors"
                        title="Read aloud"
                      >
                        <Volume2 size={15} />
                      </button>

                      <button
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                            navigator.clipboard.writeText(msg.text)
                            setCopiedId(msg.id)
                            setTimeout(() => setCopiedId(null), 2000)
                          }
                        }}
                        className="p-1 hover:text-slate-700 transition-colors"
                        title="Copy response"
                      >
                        {copiedId === msg.id ? (
                          <Check size={15} className="text-emerald-600" />
                        ) : (
                          <Copy size={15} />
                        )}
                      </button>

                      <button
                        className="p-1 hover:text-slate-700 transition-colors"
                        title="Good response"
                      >
                        <ThumbsUp size={15} />
                      </button>

                      <button
                        className="p-1 hover:text-slate-700 transition-colors"
                        title="Bad response"
                      >
                        <ThumbsDown size={15} />
                      </button>

                      <button
                        onClick={() => {
                          const msgIdx = messages.indexOf(msg)
                          const prevUserMsg = msgIdx > 0 ? messages[msgIdx - 1] : null
                          if (prevUserMsg) {
                            sendMessage(prevUserMsg.text)
                          }
                        }}
                        className="p-1 hover:text-slate-700 transition-colors"
                        title="Retry response"
                      >
                        <RotateCcw size={15} />
                      </button>

                      {msg.updatedAt && (
                        <span className="text-[11.5px] text-slate-400 font-medium ml-1">
                          {msg.updatedAt}
                        </span>
                      )}

                      {msg.sources && msg.sources.length > 0 && (
                        <div className="inline-flex items-center gap-1 text-slate-400 text-[11px] ml-auto">
                          <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[200px]">Source: {msg.sources.join(' · ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Thinking indicator */}
            {isThinking && (
              <div className="flex items-center gap-2.5 bg-white rounded-2xl border border-slate-200/90 px-4 py-2.5 max-w-xs shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] animate-fade-in-up">
                <div className="w-5 h-5 rounded-lg bg-indigo-50 flex items-center justify-center text-[#1E2BB8]">
                  <Sparkles size={12} className="animate-spin" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1E2BB8] pulse-dot" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1E2BB8] pulse-dot" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1E2BB8] pulse-dot" />
                </div>
                <span className="text-xs text-slate-500 font-medium ml-1">Searching verified sources…</span>
              </div>
            )}
          </div>
        )}

        {/* Clean & Beautiful Welcome State (2x2 Grid) */}
        {messages.length === 0 && (
          <div className="max-w-md w-full mx-auto my-auto flex flex-col items-center justify-center py-4 px-2 animate-fade-in-up">
            {/* Sparkle emblem */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1E2BB8] via-[#3548E0] to-[#596BFA] flex items-center justify-center text-white shadow-lg shadow-[#1E2BB8]/25 mb-3 ring-4 ring-indigo-50/80">
              <Sparkles size={22} strokeWidth={2.2} />
            </div>

            {/* Clean Title */}
            <h2 className="font-display font-800 text-2xl text-slate-900 text-center tracking-tight mb-1.5">
              aaspaas Local AI
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-500 text-center mb-6 max-w-xs leading-relaxed">
              Real-time verified information, mandi rates, news, and services across Ludhiana.
            </p>

            {/* 4 Clean Options (2x2 Grid, fully visible and responsive) */}
            <div className="w-full grid grid-cols-2 gap-2.5 sm:gap-3 mb-2">
              {QUICK_OPTIONS.map(opt => {
                const IconComponent = opt.icon
                return (
                  <button
                    key={opt.id}
                    onClick={() => sendMessage(opt.prompt)}
                    className="group bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-3.5 shadow-xs hover:border-[#1E2BB8] hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-between gap-2 text-left"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${opt.badgeBg} flex items-center justify-center shrink-0 shadow-2xs`}>
                        <IconComponent size={17} className={opt.badgeColor} />
                      </div>
                      <span className="font-display font-bold text-[13px] sm:text-[14px] text-slate-900 group-hover:text-[#1E2BB8] transition-colors leading-tight">
                        {opt.title}
                      </span>
                    </div>

                    <div className="w-6 h-6 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 group-hover:border-[#1E2BB8] group-hover:text-white group-hover:bg-[#1E2BB8] transition-all shrink-0">
                      <Plus size={13} strokeWidth={2.4} />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) {
            setAttachedFile({ name: file.name || 'Camera capture', type: 'image' })
            setShowAttachMenu(false)
          }
        }}
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) {
            setAttachedFile({ name: file.name, type: 'image' })
            setShowAttachMenu(false)
          }
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) {
            setAttachedFile({ name: file.name, type: 'file' })
            setShowAttachMenu(false)
          }
        }}
      />

      {/* Floating Attachment Menu (Exact ChatGPT Sheet from Screenshot 2) */}
      {showAttachMenu && (
        <>
          {/* Backdrop overlay for smooth outside tap dismiss */}
          <div
            className="fixed inset-0 z-40 bg-black/5"
            onClick={() => setShowAttachMenu(false)}
          />

          {/* Floating Sheet */}
          <div className="absolute bottom-16 left-3 sm:left-4 bg-white rounded-3xl p-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.14)] border border-slate-200/90 min-w-[215px] w-56 flex flex-col gap-0.5 z-50 animate-fade-in-up">
            {/* Photos */}
            <button
              type="button"
              onClick={() => {
                photoInputRef.current?.click()
                setShowAttachMenu(false)
              }}
              className="flex items-center gap-3.5 px-2.5 py-2 rounded-2xl hover:bg-slate-100 active:bg-slate-200 text-left transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-indigo-50 text-[#1E2BB8] flex items-center justify-center shrink-0">
                <Image size={18} strokeWidth={2} />
              </div>
              <span className="text-[14px] font-medium text-slate-800">Photos</span>
            </button>

            {/* Files */}
            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click()
                setShowAttachMenu(false)
              }}
              className="flex items-center gap-3.5 px-2.5 py-2 rounded-2xl hover:bg-slate-100 active:bg-slate-200 text-left transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Paperclip size={18} strokeWidth={2} />
              </div>
              <span className="text-[14px] font-medium text-slate-800">Files</span>
            </button>

            {/* Map */}
            <button
              type="button"
              onClick={() => {
                setAttachedFile({ name: 'Map: Ludhiana District', type: 'location' })
                setShowAttachMenu(false)
              }}
              className="flex items-center gap-3.5 px-2.5 py-2 rounded-2xl hover:bg-slate-100 active:bg-slate-200 text-left transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Map size={18} strokeWidth={2} />
              </div>
              <span className="text-[14px] font-medium text-slate-800">Location</span>
            </button>

            {/* Camera */}
            <button
              type="button"
              onClick={() => {
                cameraInputRef.current?.click()
                setShowAttachMenu(false)
              }}
              className="flex items-center gap-3.5 px-2.5 py-2 rounded-2xl hover:bg-slate-100 active:bg-slate-200 text-left transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Camera size={18} strokeWidth={2} />
              </div>
              <span className="text-[14px] font-medium text-slate-800">Camera</span>
            </button>
          </div>
        </>
      )}

      {/* Mobile Textbox Container */}
      <div className="bg-[#F8FAFC]/95 backdrop-blur-md px-3 pb-3.5 pt-2 shrink-0 relative z-30 border-t border-slate-200/60">
        <div className="max-w-xl mx-auto relative">
          {/* Active chips for attached file */}
          {attachedFile && (
            <div className="flex items-center gap-2 mb-2 flex-wrap animate-fade-in-up">
              <div className="flex items-center gap-1.5 bg-white text-slate-800 border border-slate-200 px-3 py-1 rounded-full text-xs font-medium shadow-2xs">
                {attachedFile.type === 'image' ? (
                  <Image size={13} className="text-[#1E2BB8]" />
                ) : attachedFile.type === 'location' ? (
                  <MapPin size={13} className="text-[#1E2BB8]" />
                ) : (
                  <FileText size={13} className="text-[#1E2BB8]" />
                )}
                <span className="truncate max-w-[150px]">{attachedFile.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="w-4 h-4 rounded-full hover:bg-slate-100 flex items-center justify-center ml-0.5 text-slate-400 hover:text-slate-700"
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          )}

          {/* Pill Shaped Input Bar */}
          <div className="bg-white border border-slate-200/90 rounded-full px-2 py-1.5 flex items-center gap-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] focus-within:border-[#1E2BB8] focus-within:ring-3 focus-within:ring-indigo-100/70 transition-all">
            {/* + Button */}
            <button
              type="button"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              title="Add photos, files, map or camera"
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-all shrink-0"
            >
              <Plus size={20} strokeWidth={2.2} />
            </button>

            {/* Input field with blue cursor */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onFocus={handleInputFocus}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent text-[14.5px] text-slate-900 placeholder:text-slate-400 outline-none caret-[#1E2BB8] min-w-0 px-1 py-1 font-normal"
            />

            {/* Right Action Icons: Microphone + (Audio Waveform or Send) */}
            <div className="flex items-center gap-1 shrink-0 pr-0.5">
              {/* Mic Icon */}
              <button
                type="button"
                onClick={triggerVoiceInput}
                title="Voice dictation"
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${voiceActive
                    ? 'text-[#DC2626] bg-[#FEE2E2]'
                    : 'text-slate-700 hover:bg-slate-100'
                  } active:scale-95`}
              >
                <Mic size={19} strokeWidth={2} className={voiceActive ? 'animate-pulse' : ''} />
              </button>

              {/* Right Button: Audio Waveform button (empty text) or ArrowUp button (typed text) */}
              {input.trim() || attachedFile ? (
                <button
                  type="button"
                  onClick={() => sendMessage(input)}
                  disabled={isThinking}
                  title="Send message"
                  className="w-9 h-9 rounded-full bg-[#1E2BB8] hover:bg-[#18239E] text-white flex items-center justify-center shadow-md shadow-[#1E2BB8]/20 active:scale-95 transition-all shrink-0"
                >
                  <ArrowUp size={18} strokeWidth={2.4} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={triggerVoiceInput}
                  title="Voice mode"
                  className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1E2BB8] to-[#4357E6] text-white flex items-center justify-center shadow-md shadow-[#1E2BB8]/20 active:scale-95 transition-all shrink-0"
                >
                  {/* ChatGPT Voice Waveform Bars */}
                  <div className="flex items-center justify-center gap-[2.5px] h-4">
                    <span className="w-[2.5px] h-2 bg-white rounded-full"></span>
                    <span className="w-[2.5px] h-4 bg-white rounded-full"></span>
                    <span className="w-[2.5px] h-3 bg-white rounded-full"></span>
                    <span className="w-[2.5px] h-2 bg-white rounded-full"></span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
