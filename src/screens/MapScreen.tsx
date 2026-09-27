import { useState } from 'react'
import { Search, MapPin, Navigation, Filter, ChevronUp, ChevronDown, Building2, GraduationCap, Star } from 'lucide-react'

interface Props {
  navigate: (screen: string) => void
}

const FILTER_CHIPS = [
  { id: 'pg', label: 'PG / Hostels', color: '#16A34A', bg: '#DCFCE7', count: 12 },
  { id: 'college', label: 'Colleges', color: '#2563EB', bg: '#DBEAFE', count: 4 },
  { id: 'news', label: 'Breaking News', color: '#DC2626', bg: '#FEE2E2', count: 2 },
  { id: 'events', label: 'Events', color: '#D97706', bg: '#FEF3C7', count: 7 },
  { id: 'market', label: 'Markets', color: '#7C3AED', bg: '#EDE9FE', count: 5 },
]

const MAP_MARKERS = [
  { id: 1, type: 'pg', label: 'Green View PG', x: '52%', y: '38%', color: '#16A34A' },
  { id: 2, type: 'pg', label: 'Sharma PG', x: '44%', y: '55%', color: '#16A34A' },
  { id: 3, type: 'pg', label: 'Student Home', x: '62%', y: '48%', color: '#16A34A' },
  { id: 4, type: 'college', label: 'PTU', x: '38%', y: '44%', color: '#2563EB' },
  { id: 5, type: 'college', label: 'CT Univ', x: '68%', y: '32%', color: '#2563EB' },
  { id: 6, type: 'news', label: 'Road closure', x: '48%', y: '62%', color: '#DC2626' },
  { id: 7, type: 'events', label: 'Startup Summit', x: '35%', y: '55%', color: '#D97706' },
  { id: 8, type: 'market', label: 'Ludhiana Mandi', x: '58%', y: '68%', color: '#7C3AED' },
]

const MAP_ROADS = [
  { x1: '10%', y1: '50%', x2: '90%', y2: '50%', label: 'Ferozepur Road' },
  { x1: '45%', y1: '10%', x2: '45%', y2: '90%', label: 'GT Road' },
  { x1: '20%', y1: '30%', x2: '80%', y2: '70%', label: 'Miller Ganj' },
]

const NEARBY_STATS = [
  { icon: Building2, label: 'PGs within 2 km', count: 12, color: '#16A34A', bg: '#DCFCE7', screen: 'student' },
  { icon: GraduationCap, label: 'Colleges within 5 km', count: 4, color: '#2563EB', bg: '#DBEAFE', screen: 'student' },
  { icon: Star, label: 'Events this weekend', count: 7, color: '#D97706', bg: '#FEF3C7', screen: 'news' },
]

const NEARBY_LIST = [
  { name: 'Green View PG', type: 'PG', distance: '0.7 km', detail: '₹8,000/month · ⭐ 4.6', color: '#16A34A' },
  { name: 'Sharma PG', type: 'PG', distance: '1.1 km', detail: '₹7,200/month · ⭐ 4.4', color: '#16A34A' },
  { name: 'Punjab Technical University', type: 'College', distance: '4.8 km', detail: 'BTech · ₹1.2L/year', color: '#2563EB' },
  { name: 'Road closure: Miller Ganj', type: 'Alert', distance: '0.4 km', detail: 'Ongoing · Traffic police', color: '#DC2626' },
  { name: 'Punjab Startup Summit', type: 'Event', distance: '3.1 km', detail: 'Oct 5 · Free entry', color: '#D97706' },
]

export default function MapScreen({ navigate }: Props) {
  const [activeFilters, setActiveFilters] = useState<string[]>(['pg', 'college'])
  const [sheetExpanded, setSheetExpanded] = useState(false)
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null)
  const [view, setView] = useState<'map' | 'list'>('map')

  const toggleFilter = (id: string) => {
    setActiveFilters(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  const visibleMarkers = MAP_MARKERS.filter(m => activeFilters.includes(m.type))

  return (
    <div className="flex-1 flex flex-col bg-[#F9F8F5] relative min-h-0">
      {/* Map area */}
      {view === 'map' && (
        <div className="flex-1 relative overflow-hidden">
          {/* Stylized map background */}
          <div className="absolute inset-0 bg-[#E8E6E0] map-grid">
            {/* Simulated roads */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Main roads */}
              <line x1="0" y1="50" x2="100" y2="50" stroke="#D4D0C9" strokeWidth="1.2" />
              <line x1="45" y1="0" x2="45" y2="100" stroke="#D4D0C9" strokeWidth="1.2" />
              <line x1="0" y1="30" x2="100" y2="30" stroke="#D4D0C9" strokeWidth="0.6" />
              <line x1="0" y1="70" x2="100" y2="70" stroke="#D4D0C9" strokeWidth="0.6" />
              <line x1="65" y1="0" x2="65" y2="100" stroke="#D4D0C9" strokeWidth="0.6" />
              <line x1="25" y1="0" x2="25" y2="100" stroke="#D4D0C9" strokeWidth="0.6" />

              {/* Diagonal roads */}
              <line x1="0" y1="20" x2="60" y2="80" stroke="#D4D0C9" strokeWidth="0.8" />
              <line x1="40" y1="0" x2="100" y2="60" stroke="#D4D0C9" strokeWidth="0.8" />

              {/* Road labels */}
              <text x="45" y="48" fontSize="2" fill="#9A9389" textAnchor="middle" fontFamily="Inter, sans-serif">
                Ferozepur Rd
              </text>
              <text x="42" y="25" fontSize="2" fill="#9A9389" textAnchor="middle" fontFamily="Inter, sans-serif" transform="rotate(-90 42 25)">
                GT Rd
              </text>

              {/* Park / green areas */}
              <rect x="70" y="55" width="18" height="12" rx="2" fill="#D1FAE5" opacity="0.6" />
              <text x="79" y="63" fontSize="1.8" fill="#16A34A" textAnchor="middle" fontFamily="Inter, sans-serif">Rose Garden</text>

              <rect x="10" y="15" width="12" height="10" rx="2" fill="#DBEAFE" opacity="0.6" />
              <text x="16" y="22" fontSize="1.6" fill="#2563EB" textAnchor="middle" fontFamily="Inter, sans-serif">PTU</text>
            </svg>

            {/* Map markers */}
            {visibleMarkers.map(marker => (
              <button
                key={marker.id}
                className="absolute transform -translate-x-1/2 -translate-y-full transition-all"
                style={{ left: marker.x, top: marker.y }}
                onClick={() => setSelectedMarker(selectedMarker === marker.id ? null : marker.id)}
              >
                <div className={`flex flex-col items-center transition-transform ${selectedMarker === marker.id ? 'scale-125' : 'hover:scale-110'}`}>
                  <div
                    className="px-2 py-1 rounded-lg text-white text-[10px] font-600 shadow-md whitespace-nowrap"
                    style={{ backgroundColor: marker.color }}
                  >
                    {marker.label}
                  </div>
                  <div
                    className="w-0 h-0"
                    style={{
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: `7px solid ${marker.color}`,
                    }}
                  />
                </div>
              </button>
            ))}

            {/* Current location indicator */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: '50%', top: '50%' }}
            >
              <div className="relative">
                <div className="w-4 h-4 bg-[#1E2BB8] rounded-full border-2 border-white shadow-md" />
                <div className="absolute inset-0 w-4 h-4 bg-[#1E2BB8]/30 rounded-full animate-ping" />
              </div>
            </div>
          </div>

          {/* Overlay: search + filters */}
          <div className="absolute top-0 left-0 right-0 p-4 z-20">
            {/* Search bar */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1 flex items-center gap-2 bg-white rounded-xl shadow-md px-3 py-2.5 border border-[#E8E6E1]">
                <Search size={16} className="text-[#9CA3AF] shrink-0" />
                <span className="text-sm text-[#9CA3AF] flex-1">Search on map…</span>
                <Filter size={14} className="text-[#9CA3AF]" />
              </div>
              <button className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center border border-[#E8E6E1]">
                <Navigation size={18} className="text-[#1E2BB8]" />
              </button>
            </div>

            {/* Filter chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {FILTER_CHIPS.map(chip => {
                const isActive = activeFilters.includes(chip.id)
                return (
                  <button
                    key={chip.id}
                    onClick={() => toggleFilter(chip.id)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-600 shadow-sm border transition-colors"
                    style={{
                      backgroundColor: isActive ? chip.color : 'white',
                      color: isActive ? 'white' : chip.color,
                      borderColor: isActive ? chip.color : '#E8E6E1',
                    }}
                  >
                    <span>{chip.label}</span>
                    <span className={`px-1 py-0.5 rounded-full text-[10px] font-700 ${
                      isActive ? 'bg-white/20' : ''
                    }`} style={{ color: isActive ? 'white' : chip.color }}>
                      {chip.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Map/List toggle */}
          <div className="absolute top-4 right-16 z-30 hidden">
            <button
              onClick={() => setView(view === 'map' ? 'list' : 'map')}
              className="bg-white border border-[#E8E6E1] rounded-xl px-3 py-1.5 text-xs font-600 text-[#1E2BB8] shadow"
            >
              {view === 'map' ? 'List view' : 'Map view'}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Sheet */}
      <div
        className={`bg-white rounded-t-3xl border-t border-[#E8E6E1] shadow-xl transition-all duration-300 ${
          sheetExpanded ? 'h-[65%]' : 'h-[220px]'
        } flex flex-col`}
      >
        {/* Handle + header */}
        <button
          className="w-full pt-3 pb-2 flex flex-col items-center gap-2"
          onClick={() => setSheetExpanded(!sheetExpanded)}
        >
          <div className="w-10 h-1 bg-[#D9D5CA] rounded-full" />
          <div className="w-full flex items-center justify-between px-4">
            <div>
              <h2 className="font-display font-700 text-[17px] text-[#0D1117] text-left">Near you</h2>
              <p className="text-xs text-[#9CA3AF] text-left">Ludhiana, Punjab</p>
            </div>
            {sheetExpanded ? (
              <ChevronDown size={18} className="text-[#9CA3AF]" />
            ) : (
              <ChevronUp size={18} className="text-[#9CA3AF]" />
            )}
          </div>
        </button>

        {/* Stats row */}
        <div className="flex gap-2 px-4 mb-3 overflow-x-auto no-scrollbar">
          {NEARBY_STATS.map(stat => (
            <button
              key={stat.label}
              onClick={() => navigate(stat.screen)}
              className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E8E6E1] hover-lift"
              style={{ backgroundColor: stat.bg }}
            >
              <stat.icon size={14} style={{ color: stat.color }} />
              <div className="text-left">
                <p className="font-mono-data font-700 text-base leading-none" style={{ color: stat.color }}>
                  {stat.count}
                </p>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5 whitespace-nowrap">{stat.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Nearby list */}
        <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-[#F4F2ED] px-4">
          {NEARBY_LIST.map(item => (
            <button
              key={item.name}
              className="w-full flex items-center gap-3 py-3 hover:bg-[#F9F8F5] transition-colors"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: item.color + '18' }}
              >
                <MapPin size={16} style={{ color: item.color }} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-500 text-[#0D1117] truncate">{item.name}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{item.detail}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-500 text-[#6B7280]">{item.distance}</span>
                <div className="mt-0.5">
                  <span
                    className="text-[10px] font-600 px-1.5 py-0.5 rounded-full"
                    style={{ color: item.color, backgroundColor: item.color + '18' }}
                  >
                    {item.type}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
