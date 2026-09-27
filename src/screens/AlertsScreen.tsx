import { useState } from 'react'
import { Bell, X, ChevronRight, Clock, MapPin, ExternalLink } from 'lucide-react'

interface Props {
  navigate: (screen: string) => void
  goBack: () => void
}

const TABS = ['All', 'Urgent', 'Traffic', 'Prices', 'Education', 'Events']

const ALERTS = [
  {
    id: 1,
    priority: 'urgent',
    category: 'Traffic',
    emoji: '🚧',
    title: 'Road closure: Miller Ganj Chowk',
    description: 'Emergency water main repair. Road completely closed. Divert via Pakhowal Road or Agar Nagar.',
    time: '15 min ago',
    location: 'Miller Ganj, Ludhiana',
    source: 'NHAI Punjab',
    actionLabel: 'See route',
    tab: 'Traffic',
  },
  {
    id: 2,
    priority: 'urgent',
    category: 'Weather',
    emoji: '⛈️',
    title: 'Yellow alert: Heavy rain tonight',
    description: 'IMD has issued a yellow alert for heavy rain after 7 PM. Avoid waterlogged areas and low-lying roads.',
    time: '1 hr ago',
    location: 'Ludhiana district',
    source: 'IMD India',
    actionLabel: 'Weather details',
    tab: 'Urgent',
  },
  {
    id: 3,
    priority: 'important',
    category: 'Prices',
    emoji: '🧅',
    title: 'Onion prices up 12% this week',
    description: 'Supply shortage from Maharashtra has pushed onion prices from ₹32 to ₹38/kg in the last 7 days.',
    time: '3 hr ago',
    location: 'Ludhiana Mandi',
    source: 'AGMARKNET',
    actionLabel: 'Price trends',
    tab: 'Prices',
  },
  {
    id: 4,
    priority: 'important',
    category: 'Education',
    emoji: '📚',
    title: 'PTU admission deadline extended to Nov 15',
    description: 'Punjab Technical University has extended the admission cutoff date for BTech 2026-27 by 3 weeks.',
    time: '5 hr ago',
    location: 'Punjab Technical University',
    source: 'PTU Official',
    actionLabel: 'Apply now',
    tab: 'Education',
  },
  {
    id: 5,
    priority: 'useful',
    category: 'Events',
    emoji: '🎪',
    title: 'Punjab Startup Summit: registration open',
    description: 'Annual startup event at CTU Ludhiana on Oct 5. Free entry for students with valid ID. 50+ startups participating.',
    time: '8 hr ago',
    location: 'CTU Campus, Ludhiana',
    source: 'Startup Punjab',
    actionLabel: 'Register',
    tab: 'Events',
  },
  {
    id: 6,
    priority: 'useful',
    category: 'Education',
    emoji: '🎓',
    title: 'NEET 2026 result announced',
    description: 'NEET UG 2026 results declared by NTA. Cut-off for Punjab government colleges raised to 620.',
    time: '10 hr ago',
    location: 'Punjab',
    source: 'NTA Official',
    actionLabel: 'Check result',
    tab: 'Education',
  },
  {
    id: 7,
    priority: 'useful',
    category: 'Traffic',
    emoji: '🚗',
    title: 'Ferozepur Road speed limit reduced',
    description: 'Speed limit on Ferozepur Road near construction zone reduced to 30 km/h. Challan enforcement active.',
    time: '1 day ago',
    location: 'Ferozepur Road',
    source: 'Punjab Traffic Police',
    actionLabel: null,
    tab: 'Traffic',
  },
]

const PRIORITY_CONFIG = {
  urgent: { color: '#DC2626', bg: '#FEE2E2', label: 'Urgent', dotClass: 'bg-red-600' },
  important: { color: '#D97706', bg: '#FEF3C7', label: 'Important', dotClass: 'bg-amber-600' },
  useful: { color: '#2563EB', bg: '#DBEAFE', label: 'Info', dotClass: 'bg-blue-600' },
}

export default function AlertsScreen({ navigate, goBack }: Props) {
  const [activeTab, setActiveTab] = useState('All')
  const [dismissed, setDismissed] = useState<number[]>([])

  const filtered = ALERTS.filter(a => {
    if (dismissed.includes(a.id)) return false
    if (activeTab === 'All') return true
    if (activeTab === 'Urgent') return a.priority === 'urgent'
    return a.tab === activeTab
  })

  const urgentCount = ALERTS.filter(a => a.priority === 'urgent' && !dismissed.includes(a.id)).length

  return (
    <div className="min-h-full bg-[#F9F8F5]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E6E1] sticky top-0 z-10">
        <div className="px-4 pt-3 pb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-700 text-[22px] text-[#0D1117]">Alert Centre</h1>
              {urgentCount > 0 && (
                <span className="px-2 py-0.5 bg-[#DC2626] text-white text-xs font-600 rounded-full font-display">
                  {urgentCount}
                </span>
              )}
            </div>
            <button className="text-sm font-500 text-[#1E2BB8]">Customize</button>
          </div>
          <p className="text-sm text-[#6B7280]">Ludhiana, Punjab</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 overflow-x-auto no-scrollbar px-4 pb-3">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-500 mr-2 transition-colors ${
                activeTab === tab
                  ? 'bg-[#1E2BB8] text-white'
                  : 'bg-[#F4F2ED] text-[#6B7280] hover:bg-[#EBE8E0]'
              }`}
            >
              {tab}
              {tab === 'Urgent' && urgentCount > 0 && (
                <span className="ml-1.5 w-4 h-4 inline-flex items-center justify-center bg-white text-[#DC2626] text-[10px] font-700 rounded-full">
                  {urgentCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Alert cards */}
      <div className="px-4 py-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F4F2ED] flex items-center justify-center mb-4">
              <Bell size={28} className="text-[#D1D5DB]" />
            </div>
            <p className="font-display font-600 text-[#0D1117] text-base">No alerts right now</p>
            <p className="text-sm text-[#9CA3AF] mt-1">You&apos;re all caught up for this category</p>
          </div>
        ) : (
          filtered.map((alert, i) => {
            const config = PRIORITY_CONFIG[alert.priority as keyof typeof PRIORITY_CONFIG]
            return (
              <div
                key={alert.id}
                className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden animate-fade-in-up hover-lift"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {/* Priority stripe */}
                <div className="h-1" style={{ backgroundColor: config.color }} />

                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 mt-0.5"
                      style={{ backgroundColor: config.bg }}
                    >
                      {alert.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-[10px] font-700 uppercase tracking-wide px-2 py-0.5 rounded-full"
                            style={{ color: config.color, backgroundColor: config.bg }}
                          >
                            {config.label}
                          </span>
                          <span className="text-[11px] text-[#9CA3AF] font-500">{alert.category}</span>
                        </div>
                        <button
                          onClick={() => setDismissed(d => [...d, alert.id])}
                          className="p-1 rounded-lg hover:bg-[#F4F2ED] transition-colors shrink-0"
                        >
                          <X size={14} className="text-[#9CA3AF]" />
                        </button>
                      </div>
                      <h3 className="font-display font-600 text-[15px] text-[#0D1117] mt-1.5 leading-snug">
                        {alert.title}
                      </h3>
                      <p className="text-sm text-[#6B7280] mt-1 leading-relaxed">{alert.description}</p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
                        <div className="flex items-center gap-1">
                          <Clock size={11} className="text-[#9CA3AF]" />
                          <span className="text-xs text-[#9CA3AF]">{alert.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={11} className="text-[#9CA3AF]" />
                          <span className="text-xs text-[#9CA3AF] truncate max-w-[160px]">{alert.location}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F4F2ED]">
                        <div className="flex items-center gap-1">
                          <ExternalLink size={11} className="text-[#9CA3AF]" />
                          <span className="text-xs text-[#9CA3AF]">{alert.source}</span>
                        </div>
                        {alert.actionLabel && (
                          <button className="text-xs font-600 text-[#1E2BB8] hover:underline flex items-center gap-1">
                            {alert.actionLabel}
                            <ChevronRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}

        {/* Alert preferences */}
        <div className="mt-2 p-4 bg-[#EEF1FF] rounded-2xl border border-[#C4CEFF]">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={16} className="text-[#1E2BB8]" />
            <span className="font-display font-600 text-sm text-[#1E2BB8]">Alert preferences</span>
          </div>
          <p className="text-xs text-[#4357E6] leading-relaxed">
            Customize which alerts you receive for traffic, prices, education, and events in your area.
          </p>
          <button className="mt-2 text-xs font-600 text-[#1E2BB8] underline">Manage alerts</button>
        </div>
      </div>
    </div>
  )
}
