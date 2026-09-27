import { useState } from 'react'
import { Search, MapPin, Clock, Bookmark, Share2, BadgeCheck, ChevronRight, Filter, TrendingUp } from 'lucide-react'

interface Props {
  navigate: (screen: string) => void
}

const CATEGORIES = ['All', 'Breaking', 'Traffic', 'Education', 'Crime', 'Business', 'Weather', 'Events', 'Jobs', 'Government']

const VERIFICATION_CONFIG = {
  official: { label: 'Official update', color: '#16A34A', bg: '#DCFCE7', dot: '#16A34A' },
  verified: { label: 'Verified source', color: '#2563EB', bg: '#DBEAFE', dot: '#2563EB' },
  community: { label: 'Community report', color: '#D97706', bg: '#FEF3C7', dot: '#D97706' },
}

const NEWS = [
  {
    id: 1,
    category: 'Education',
    headline: 'Punjab Technical University adds 60 new BTech seats in Computer Science for 2026-27',
    summary: 'Punjab Technical University has approved additional seats following high demand from students across the state. The seats will be available from the upcoming academic session.',
    location: 'Ludhiana',
    time: '1 hr ago',
    source: 'Tribune India',
    verification: 'verified',
    trending: true,
    image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&h=300&fit=crop&auto=format',
    savedCount: 284,
  },
  {
    id: 2,
    category: 'Traffic',
    headline: 'Ferozepur Road diversion continues — flyover construction ahead of schedule',
    summary: 'Commuters should expect delays near the construction zone until January 2027. NHAI confirms the flyover will be ready 6 weeks ahead of schedule.',
    location: 'Ferozepur Road, Ludhiana',
    time: '3 hr ago',
    source: 'Hindustan Times',
    verification: 'verified',
    trending: false,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=300&fit=crop&auto=format',
    savedCount: 102,
  },
  {
    id: 3,
    category: 'Business',
    headline: 'New startup incubation centre inaugurated at Punjab Technical University',
    summary: 'The Atal Incubation Centre at PTU Ludhiana will support 50+ student startups with funding of up to ₹25 lakh, mentorship, and dedicated co-working infrastructure.',
    location: 'PTU Campus, Ludhiana',
    time: '5 hr ago',
    source: 'Economic Times',
    verification: 'verified',
    trending: true,
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=300&fit=crop&auto=format',
    savedCount: 178,
  },
  {
    id: 4,
    category: 'Weather',
    headline: 'IMD issues yellow alert for Ludhiana: heavy rain expected tonight after 7 PM',
    summary: 'The India Meteorological Department has issued a yellow alert for Ludhiana and surrounding areas. Residents advised to avoid waterlogged zones and carry umbrellas.',
    location: 'Ludhiana',
    time: '6 hr ago',
    source: 'IMD India',
    verification: 'official',
    trending: false,
    image: 'https://images.unsplash.com/photo-1504608524841-42584120d693?w=600&h=300&fit=crop&auto=format',
    savedCount: 221,
  },
  {
    id: 5,
    category: 'Crime',
    headline: 'Police arrest three in connection with stolen vehicles case in Model Town',
    summary: 'Ludhiana Police arrested three individuals and recovered seven stolen bikes and two cars from a garage in Model Town. Investigation ongoing.',
    location: 'Model Town, Ludhiana',
    time: '8 hr ago',
    source: 'Punjab Police',
    verification: 'official',
    trending: false,
    image: null,
    savedCount: 95,
  },
  {
    id: 6,
    category: 'Government',
    headline: 'Punjab government extends free bus pass scheme to all college students',
    summary: 'CM announces extension of the Mata Tripta Ji Free Travel Scheme to include all college-going students regardless of gender from November 1, 2026.',
    location: 'Punjab',
    time: '1 day ago',
    source: 'Punjab Government',
    verification: 'official',
    trending: true,
    image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&h=300&fit=crop&auto=format',
    savedCount: 456,
  },
  {
    id: 7,
    category: 'Jobs',
    headline: '850 vacancies open in Punjab Police: applications close October 20',
    summary: 'Punjab Police Recruitment Board has announced 850 vacancies for Constable (General Duty). Online applications close October 20, 2026. Age: 18-28 years.',
    location: 'Punjab',
    time: '1 day ago',
    source: 'PPSC',
    verification: 'official',
    trending: false,
    image: null,
    savedCount: 1203,
  },
]

function NewsCard({ item, onClick }: { item: typeof NEWS[0]; onClick: () => void }) {
  const [saved, setSaved] = useState(false)
  const verif = VERIFICATION_CONFIG[item.verification as keyof typeof VERIFICATION_CONFIG]

  return (
    <div className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden hover-lift" onClick={onClick}>
      {/* Image */}
      {item.image && (
        <div className="relative h-44 bg-[#F4F2ED] overflow-hidden">
          <img
            src={item.image}
            alt={item.headline}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          {item.trending && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-white/95 rounded-full">
              <TrendingUp size={11} className="text-[#DC2626]" />
              <span className="text-[11px] font-700 text-[#DC2626]">Trending</span>
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Category + verification */}
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <span className="px-2.5 py-0.5 bg-[#EEF1FF] text-[#1E2BB8] text-[11px] font-600 rounded-full">
            {item.category}
          </span>
          <div className="flex items-center gap-1" style={{ color: verif.color }}>
            <BadgeCheck size={12} />
            <span className="text-[11px] font-500">{verif.label}</span>
          </div>
          {!item.image && item.trending && (
            <div className="flex items-center gap-1 text-[#DC2626]">
              <TrendingUp size={11} />
              <span className="text-[11px] font-700">Trending</span>
            </div>
          )}
        </div>

        {/* Headline */}
        <h2 className="font-display font-600 text-[15px] text-[#0D1117] leading-snug mb-2">
          {item.headline}
        </h2>

        {/* Summary */}
        <p className="text-sm text-[#6B7280] leading-relaxed line-clamp-2">
          {item.summary}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <div className="flex items-center gap-1">
            <MapPin size={11} className="text-[#9CA3AF]" />
            <span className="text-xs text-[#9CA3AF]">{item.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={11} className="text-[#9CA3AF]" />
            <span className="text-xs text-[#9CA3AF]">{item.time}</span>
          </div>
          <span className="text-xs text-[#9CA3AF] font-500">{item.source}</span>
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F4F2ED]">
          <button
            onClick={(e) => { e.stopPropagation(); setSaved(!saved) }}
            className={`flex items-center gap-1.5 text-xs font-500 transition-colors ${
              saved ? 'text-[#1E2BB8]' : 'text-[#9CA3AF] hover:text-[#6B7280]'
            }`}
          >
            <Bookmark size={14} className={saved ? 'fill-[#1E2BB8]' : ''} />
            {saved ? 'Saved' : `Save (${item.savedCount})`}
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              <Share2 size={14} />
              Share
            </button>
            <button className="flex items-center gap-1 text-xs font-500 text-[#1E2BB8]">
              Read more
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NewsScreen({ navigate }: Props) {
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = activeCategory === 'All'
    ? NEWS
    : NEWS.filter(n => n.category === activeCategory)

  return (
    <div className="min-h-full bg-[#F9F8F5]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E6E1] sticky top-0 z-10">
        <div className="px-4 pt-3 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 flex items-center gap-2 bg-[#F4F2ED] rounded-xl px-3 py-2.5">
              <Search size={16} className="text-[#9CA3AF] shrink-0" />
              <input
                type="text"
                placeholder="Search local news…"
                className="flex-1 bg-transparent text-sm text-[#0D1117] placeholder:text-[#9CA3AF] outline-none"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2.5 bg-[#F4F2ED] rounded-xl text-sm text-[#6B7280]">
              <Filter size={14} />
              Filter
            </button>
          </div>

          {/* Location context */}
          <div className="flex items-center gap-1.5 mb-3">
            <MapPin size={13} className="text-[#1E2BB8]" />
            <span className="text-sm font-500 text-[#0D1117]">Ludhiana, Punjab</span>
            <span className="text-xs text-[#9CA3AF] ml-1">{NEWS.length} stories today</span>
          </div>

          {/* Category chips */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 -mx-4 px-4 pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-500 transition-colors ${
                  activeCategory === cat
                    ? 'bg-[#1E2BB8] text-white'
                    : 'bg-[#F4F2ED] text-[#6B7280] hover:bg-[#EBE8E0]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* News feed */}
      <div className="px-4 py-4 space-y-4">
        {/* Today's briefing */}
        <div className="bg-[#EEF1FF] rounded-2xl border border-[#C4CEFF] p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-lg bg-[#1E2BB8] flex items-center justify-center">
              <TrendingUp size={11} className="text-white" />
            </div>
            <span className="font-display font-600 text-sm text-[#1E2BB8]">Today&apos;s briefing</span>
          </div>
          <p className="text-xs text-[#4357E6] leading-relaxed">
            {NEWS.filter(n => n.verification === 'official').length} official updates ·{' '}
            {NEWS.filter(n => n.trending).length} trending stories ·{' '}
            Last verified: 18 min ago
          </p>
        </div>

        {/* News cards */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F4F2ED] flex items-center justify-center mb-4">
              <Search size={28} className="text-[#D1D5DB]" />
            </div>
            <p className="font-display font-600 text-[#0D1117]">No stories yet</p>
            <p className="text-sm text-[#9CA3AF] mt-1">No local news in this category right now</p>
          </div>
        ) : (
          filtered.map((item, i) => (
            <div key={item.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <NewsCard item={item} onClick={() => {}} />
            </div>
          ))
        )}

        {/* Source transparency note */}
        <div className="p-4 bg-[#F4F2ED] rounded-xl mt-2">
          <p className="text-xs text-[#9CA3AF] leading-relaxed text-center">
            All news is sourced from verified publications and official sources.{' '}
            <button className="text-[#1E2BB8] underline">View source policy</button>
          </p>
        </div>
      </div>
    </div>
  )
}
