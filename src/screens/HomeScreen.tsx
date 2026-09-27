import { useState, useEffect, useRef } from 'react'
import { MapPin, Bell, Search, Mic, Camera, ChevronRight, BadgeCheck, Shield, Clock, ExternalLink, Sparkles, TrendingDown, BookOpen, IndianRupee, Calendar, AlertTriangle, Briefcase, Star, Bookmark, Share2, TrendingUp } from 'lucide-react'

interface Props {
  navigate: (screen: string) => void
}

const HOUR = new Date().getHours()
const GREETING =
  HOUR < 5 ? 'Good night' :
  HOUR < 12 ? 'Good morning' :
  HOUR < 17 ? 'Good afternoon' : 'Good evening'

const EXAMPLE_QUERIES = [
  '"What happened near me today?"',
  '"Find PGs under ₹8,000 near PTU"',
  '"Vegetable prices today in Ludhiana"',
  '"Best BTech colleges near me"',
  '"Why is traffic blocked near Ferozepur Road?"',
  '"Events happening this weekend"',
]

const AREA_CARDS = [
  {
    id: 'traffic',
    category: 'Traffic',
    emoji: '🚧',
    urgency: 'urgent' as const,
    title: 'Ferozepur Road diversion',
    description: 'Flyover construction causing 20-min delays. Use Pakhowal Road.',
    time: '2 min ago',
    source: 'Punjab Traffic Police',
    location: 'Ferozepur Road',
  },
  {
    id: 'weather',
    category: 'Weather',
    emoji: '⛈️',
    urgency: 'important' as const,
    title: 'Rain expected after 7 PM',
    description: 'Yellow alert issued by IMD. Low-lying areas may flood.',
    time: 'Today',
    source: 'IMD India',
    location: 'Ludhiana',
  },
  {
    id: 'education',
    category: 'Education',
    emoji: '📚',
    urgency: 'useful' as const,
    title: 'PTU adds 60 new BTech seats',
    description: 'CSE department seats increased for 2026-27 session.',
    time: '1 hr ago',
    source: 'Tribune India',
    location: 'PTU, Ludhiana',
  },
  {
    id: 'prices',
    category: 'Prices',
    emoji: '🥬',
    urgency: 'useful' as const,
    title: 'Tomato prices ↓ 8% today',
    description: 'Now ₹42/kg at Ludhiana mandi. Higher arrivals from HP.',
    time: '9:30 AM',
    source: 'AGMARKNET',
    location: 'Ludhiana Mandi',
  },
  {
    id: 'crime',
    category: 'Safety',
    emoji: '🚨',
    urgency: 'important' as const,
    title: 'Stolen vehicle gang busted',
    description: 'Police arrest 3, recover 7 bikes, 2 cars from Model Town garage.',
    time: '3 hr ago',
    source: 'Punjab Police',
    location: 'Model Town',
  },
]

const URGENCY_STYLE = {
  urgent: { color: '#DC2626', bg: '#FEE2E2', border: '#FECACA', label: 'Urgent' },
  important: { color: '#D97706', bg: '#FEF3C7', border: '#FDE68A', label: 'Important' },
  useful: { color: '#2563EB', bg: '#DBEAFE', border: '#BFDBFE', label: 'Info' },
}

const AI_BRIEF_POINTS = [
  { text: 'Ferozepur Road still has diversions — avoid 8–10 AM peak', urgency: 'urgent' },
  { text: 'Tomato at ₹42/kg — prices down 8%, good time to stock up', urgency: 'useful' },
  { text: 'Yellow rain alert tonight after 7 PM; carry umbrella', urgency: 'important' },
  { text: 'PTU admissions open: 60 new CSE seats added for 2026-27', urgency: 'useful' },
  { text: 'Weekly market at Rose Garden: tomorrow, 6 AM–2 PM', urgency: 'useful' },
]

const NEWS_PREVIEW = [
  {
    id: 1,
    category: 'Business',
    headline: 'New startup incubation centre inaugurated at PTU Ludhiana',
    source: 'Economic Times',
    time: '5 hr ago',
    location: 'PTU Campus',
    verified: true,
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=300&fit=crop&auto=format',
    trending: true,
  },
  {
    id: 2,
    category: 'Government',
    headline: 'Punjab govt extends free bus pass to all college students from Nov 1',
    source: 'Punjab Government',
    time: '1 day ago',
    location: 'Punjab',
    verified: true,
    image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&h=300&fit=crop&auto=format',
    trending: true,
  },
]

const QUICK_ACTIONS = [
  { label: 'Student Hub', emoji: '🎓', screen: 'student', color: '#1E2BB8', bg: '#EEF1FF' },
  { label: 'Prices', emoji: '🥬', screen: 'prices', color: '#16A34A', bg: '#DCFCE7' },
  { label: 'Events', emoji: '📅', screen: 'news', color: '#D97706', bg: '#FEF3C7' },
  { label: 'Alerts', emoji: '🔔', screen: 'alerts', color: '#DC2626', bg: '#FEE2E2' },
  { label: 'Jobs', emoji: '💼', screen: 'news', color: '#7C3AED', bg: '#EDE9FE' },
]

export default function HomeScreen({ navigate }: Props) {
  const [queryIdx, setQueryIdx] = useState(0)
  const [queryVisible, setQueryVisible] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [aiExpanded, setAiExpanded] = useState(false)
  const [savedNews, setSavedNews] = useState<number[]>([])

  // Rotate example queries
  useEffect(() => {
    const interval = setInterval(() => {
      setQueryVisible(false)
      setTimeout(() => {
        setQueryIdx(i => (i + 1) % EXAMPLE_QUERIES.length)
        setQueryVisible(true)
      }, 350)
    }, 3200)
    return () => clearInterval(interval)
  }, [])

  const handleSearch = () => {
    if (searchValue.trim()) navigate('ai')
  }

  const urgentCount = AREA_CARDS.filter(c => c.urgency === 'urgent').length
  const importantCount = AREA_CARDS.filter(c => c.urgency === 'important').length
  const usefulCount = AREA_CARDS.filter(c => c.urgency === 'useful').length

  return (
    <div className="min-h-full bg-[#F9F8F5]">
      {/* Fixed Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-[#E8E6E1]">
        <div className="flex items-center justify-between px-4 pt-3 pb-3">
          {/* Location selector */}
          <button className="flex items-center gap-1.5 group">
            <div className="w-5 h-5 rounded-full bg-[#EEF1FF] flex items-center justify-center">
              <MapPin size={11} className="text-[#1E2BB8]" />
            </div>
            <span className="font-display font-600 text-[15px] text-[#0D1117]">Ludhiana, Punjab</span>
            <ChevronRight size={14} className="text-[#9CA3AF] group-hover:text-[#1E2BB8] transition-colors" />
          </button>

          {/* Right: notifications + avatar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('alerts')}
              className="relative w-9 h-9 rounded-xl bg-[#F4F2ED] flex items-center justify-center hover:bg-[#EBE8E0] transition-colors"
            >
              <Bell size={17} className="text-[#6B7280]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DC2626] rounded-full ring-1 ring-white" />
            </button>
            <button className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1E2BB8] to-[#4357E6] flex items-center justify-center">
              <span className="font-display font-700 text-sm text-white">D</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="px-4 pb-8">
        {/* Greeting */}
        <div className="mt-5 mb-4">
          <p className="text-sm text-[#9CA3AF] mb-0.5">27 September 2026 · Sunday</p>
          <h1 className="font-display font-800 text-[28px] text-[#0D1117] leading-tight">
            {GREETING},<br />
            <span className="text-[#1E2BB8]">Dilkhush</span>
          </h1>
        </div>

        {/* AI Search Box */}
        <div className="mb-2">
          <div
            className="search-focus flex items-center gap-3 bg-white border-[1.5px] border-[#E8E6E1] rounded-2xl px-4 py-3.5 shadow-sm transition-all"
          >
            <Search size={20} className="text-[#9CA3AF] shrink-0" />
            <input
              type="text"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Ask anything about your area…"
              className="flex-1 bg-transparent text-[15px] text-[#0D1117] placeholder:text-[#9CA3AF] outline-none font-400 min-w-0"
            />
            <div className="flex items-center gap-1 pl-2 border-l border-[#E8E6E1]">
              <button
                onClick={() => navigate('ai')}
                className="w-8 h-8 rounded-lg hover:bg-[#F4F2ED] flex items-center justify-center transition-colors"
              >
                <Mic size={16} className="text-[#6B7280]" />
              </button>
              <button className="w-8 h-8 rounded-lg hover:bg-[#F4F2ED] flex items-center justify-center transition-colors">
                <Camera size={16} className="text-[#6B7280]" />
              </button>
            </div>
          </div>

          {/* Rotating example */}
          <div className="flex items-center gap-2 mt-2.5 px-1">
            <Sparkles size={12} className="text-[#9AAEFF] shrink-0" />
            <span
              className="text-xs text-[#9CA3AF] transition-opacity duration-300 cursor-pointer hover:text-[#1E2BB8]"
              style={{ opacity: queryVisible ? 1 : 0 }}
              onClick={() => navigate('ai')}
            >
              Try: <span className="text-[#6B7280]">{EXAMPLE_QUERIES[queryIdx]}</span>
            </span>
          </div>
        </div>

        {/* Your Area Today */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display font-700 text-[17px] text-[#0D1117]">Your Area Today</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 text-[11px] font-600 text-[#DC2626]">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626] inline-block" />
                  {urgentCount} urgent
                </span>
                <span className="flex items-center gap-1 text-[11px] font-600 text-[#D97706]">
                  <span className="w-2 h-2 rounded-full bg-[#D97706] inline-block" />
                  {importantCount} important
                </span>
                <span className="flex items-center gap-1 text-[11px] font-600 text-[#2563EB]">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB] inline-block" />
                  {usefulCount} useful
                </span>
              </div>
            </div>
            <button className="text-sm font-500 text-[#1E2BB8] flex items-center gap-0.5">
              All <ChevronRight size={14} />
            </button>
          </div>

          {/* Horizontal scroll cards */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {AREA_CARDS.map((card, i) => {
              const style = URGENCY_STYLE[card.urgency]
              return (
                <div
                  key={card.id}
                  className="shrink-0 w-48 bg-white rounded-2xl border border-[#E8E6E1] p-3.5 hover-lift animate-fade-in-up flex flex-col"
                  style={{ animationDelay: `${i * 0.06}s`, borderLeftColor: style.color, borderLeftWidth: 3 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{card.emoji}</span>
                    <span
                      className="text-[10px] font-700 px-2 py-0.5 rounded-full"
                      style={{ color: style.color, backgroundColor: style.bg }}
                    >
                      {style.label}
                    </span>
                  </div>
                  <p className="font-display font-600 text-[13px] text-[#0D1117] leading-tight mb-1.5 flex-1">
                    {card.title}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF] leading-snug mb-3 line-clamp-2">
                    {card.description}
                  </p>
                  <div className="flex items-center gap-1 mt-auto">
                    <Clock size={10} className="text-[#C4C9D4] shrink-0" />
                    <span className="text-[10px] text-[#C4C9D4]">{card.time}</span>
                    <span className="ml-auto text-[10px] text-[#C4C9D4] truncate max-w-[80px]">{card.source}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* AI Local Brief */}
        <section className="mt-5">
          <div className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#F4F2ED]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1E2BB8] to-[#4357E6] flex items-center justify-center">
                  <Sparkles size={13} className="text-white" />
                </div>
                <div>
                  <p className="font-display font-700 text-[14px] text-[#0D1117]">AI Local Brief</p>
                  <p className="text-[10px] text-[#9CA3AF]">What changed around you</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                <span className="text-[10px] text-[#9CA3AF]">12 min ago</span>
              </div>
            </div>

            <div className="px-4 py-3.5">
              <p className="text-sm text-[#6B7280] mb-3">
                Here are the 5 most important things that changed in your area today:
              </p>

              <div className="space-y-2.5">
                {AI_BRIEF_POINTS.slice(0, aiExpanded ? undefined : 3).map((point, i) => {
                  const style = URGENCY_STYLE[point.urgency as keyof typeof URGENCY_STYLE]
                  return (
                    <div key={i} className="flex items-start gap-2.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: style.color }}
                      />
                      <p className="text-sm text-[#374151] leading-snug">{point.text}</p>
                    </div>
                  )
                })}
              </div>

              {!aiExpanded && (
                <button
                  onClick={() => setAiExpanded(true)}
                  className="mt-3 text-sm font-500 text-[#1E2BB8] hover:underline"
                >
                  + {AI_BRIEF_POINTS.length - 3} more
                </button>
              )}

              {/* Sources footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F4F2ED]">
                <div className="flex items-center gap-1.5">
                  <Shield size={12} className="text-[#9CA3AF]" />
                  <span className="text-xs text-[#9CA3AF]">4 verified sources</span>
                </div>
                <button className="text-xs font-600 text-[#1E2BB8] flex items-center gap-1">
                  View sources <ChevronRight size={12} />
                </button>
              </div>

              <div className="mt-2.5 flex items-start gap-1.5 p-2.5 bg-[#F9F8F5] rounded-xl">
                <Sparkles size={11} className="text-[#9AAEFF] mt-0.5 shrink-0" />
                <p className="text-[10px] text-[#9CA3AF] leading-relaxed">
                  AI-generated summary. Always verify critical information from official sources before acting.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mt-5">
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {QUICK_ACTIONS.map(action => (
              <button
                key={action.label}
                onClick={() => navigate(action.screen)}
                className="shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 bg-white rounded-2xl border border-[#E8E6E1] hover-lift min-w-[72px]"
              >
                <span className="text-2xl">{action.emoji}</span>
                <span className="text-[11px] font-600 text-[#374151] whitespace-nowrap">{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Latest News */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-700 text-[17px] text-[#0D1117]">Latest News</h2>
            <button
              onClick={() => navigate('news')}
              className="text-sm font-500 text-[#1E2BB8] flex items-center gap-0.5"
            >
              See all <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {NEWS_PREVIEW.map((article, i) => (
              <div
                key={article.id}
                className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden hover-lift animate-fade-in-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {article.image && (
                  <div className="relative h-40 bg-[#F4F2ED]">
                    <img
                      src={article.image}
                      alt={article.headline}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    {article.trending && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-white/95 rounded-full">
                        <TrendingUp size={11} className="text-[#DC2626]" />
                        <span className="text-[11px] font-700 text-[#DC2626]">Trending</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 bg-[#EEF1FF] text-[#1E2BB8] text-[11px] font-600 rounded-full">
                      {article.category}
                    </span>
                    {article.verified && (
                      <div className="flex items-center gap-1 text-[#16A34A]">
                        <BadgeCheck size={12} />
                        <span className="text-[11px] font-500">Verified source</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-display font-600 text-[14px] text-[#0D1117] leading-snug mb-2">
                    {article.headline}
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <MapPin size={11} className="text-[#9CA3AF]" />
                      <span className="text-xs text-[#9CA3AF]">{article.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={11} className="text-[#9CA3AF]" />
                      <span className="text-xs text-[#9CA3AF]">{article.time}</span>
                    </div>
                    <span className="text-xs text-[#9CA3AF] font-500 ml-auto">{article.source}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F4F2ED]">
                    <button
                      onClick={() => setSavedNews(prev =>
                        prev.includes(article.id) ? prev.filter(x => x !== article.id) : [...prev, article.id]
                      )}
                      className={`flex items-center gap-1.5 text-xs font-500 transition-colors ${
                        savedNews.includes(article.id) ? 'text-[#1E2BB8]' : 'text-[#9CA3AF]'
                      }`}
                    >
                      <Bookmark size={13} className={savedNews.includes(article.id) ? 'fill-[#1E2BB8]' : ''} />
                      Save
                    </button>
                    <button className="flex items-center gap-1 text-xs font-500 text-[#1E2BB8]">
                      Read more <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Price preview strip */}
        <section className="mt-5">
          <button
            onClick={() => navigate('prices')}
            className="w-full bg-white rounded-2xl border border-[#E8E6E1] p-4 hover-lift flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] flex items-center justify-center shrink-0">
              <span className="text-xl">🥬</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-display font-600 text-[14px] text-[#0D1117]">Mandi prices today</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Tomato ↓₹42 · Onion ↑₹38 · Potato ₹24 · Updated 9:30 AM
              </p>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-1 text-[#DC2626]">
                <TrendingDown size={12} />
                <span className="text-xs font-600">avg ↓2.5%</span>
              </div>
              <ChevronRight size={16} className="text-[#D1D5DB]" />
            </div>
          </button>
        </section>

        {/* Jobs strip */}
        <section className="mt-3">
          <button
            onClick={() => navigate('news')}
            className="w-full bg-white rounded-2xl border border-[#E8E6E1] p-4 hover-lift flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] flex items-center justify-center shrink-0">
              <Briefcase size={20} className="text-[#7C3AED]" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-display font-600 text-[14px] text-[#0D1117]">850 govt jobs open</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Punjab Police recruitment · Deadline: 20 Oct 2026
              </p>
            </div>
            <div className="flex items-center">
              <span className="text-[11px] font-600 px-2 py-0.5 bg-[#DCFCE7] text-[#16A34A] rounded-full mr-2">New</span>
              <ChevronRight size={16} className="text-[#D1D5DB]" />
            </div>
          </button>
        </section>
      </div>
    </div>
  )
}
