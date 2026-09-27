import {
  MapPin, Bell, ChevronRight, Moon, Globe, Lock, Shield,
  Bookmark, Building2, GraduationCap, Newspaper, Calendar,
  BadgeCheck, Settings, LogOut, Phone, Star
} from 'lucide-react'

interface Props {
  navigate: (screen: string) => void
}

const SAVED_ITEMS = [
  { label: 'Saved PGs', count: 4, icon: Building2, screen: 'student' },
  { label: 'Saved Colleges', count: 2, icon: GraduationCap, screen: 'student' },
  { label: 'Saved News', count: 11, icon: Newspaper, screen: 'news' },
  { label: 'Saved Events', count: 3, icon: Calendar, screen: 'news' },
]

const INTERESTS = [
  'Education', 'Startups', 'Technology', 'Local News', 'Prices', 'Jobs'
]

const MY_AREAS = [
  { name: 'Ludhiana', label: 'Primary', color: '#1E2BB8' },
  { name: 'Chandigarh', label: 'Work', color: '#16A34A' },
]

const SETTINGS_GROUPS = [
  {
    title: 'Preferences',
    items: [
      { icon: Globe, label: 'Language', value: 'English', action: true },
      { icon: Bell, label: 'Notifications', value: 'Customized', action: true },
      { icon: Moon, label: 'Dark mode', value: 'Auto', action: true },
      { icon: MapPin, label: 'Location access', value: 'Always', action: true },
    ]
  },
  {
    title: 'Privacy & Data',
    items: [
      { icon: Lock, label: 'Privacy settings', value: '', action: true },
      { icon: Shield, label: 'Data permissions', value: '', action: true },
    ]
  },
]

export default function ProfileScreen({ navigate }: Props) {
  return (
    <div className="min-h-full bg-[#F9F8F5]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E6E1] px-4 pt-4 pb-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E2BB8] to-[#4357E6] flex items-center justify-center shrink-0">
            <span className="font-display font-700 text-2xl text-white">D</span>
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="font-display font-700 text-xl text-[#0D1117]">Dilkhush Singh</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">dilkhush@example.com</p>
            <div className="flex items-center gap-1.5 mt-2">
              <BadgeCheck size={14} className="text-[#1E2BB8]" />
              <span className="text-xs font-500 text-[#1E2BB8]">Verified account</span>
            </div>
          </div>
          <button className="p-2 rounded-xl hover:bg-[#F4F2ED] transition-colors">
            <Settings size={20} className="text-[#6B7280]" />
          </button>
        </div>

        {/* Stats row */}
        <div className="flex gap-4 mt-5 pt-4 border-t border-[#E8E6E1]">
          <div className="text-center flex-1">
            <p className="font-display font-700 text-lg text-[#0D1117]">47</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Saved</p>
          </div>
          <div className="w-px bg-[#E8E6E1]" />
          <div className="text-center flex-1">
            <p className="font-display font-700 text-lg text-[#0D1117]">3</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Areas</p>
          </div>
          <div className="w-px bg-[#E8E6E1]" />
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-0.5">
              <Star size={14} className="text-[#F59E0B] fill-[#F59E0B]" />
              <p className="font-display font-700 text-lg text-[#0D1117]">4.8</p>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Contributor</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-8 space-y-5 mt-4">
        {/* My Areas */}
        <section className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E8E6E1] flex items-center justify-between">
            <h2 className="font-display font-600 text-[15px] text-[#0D1117]">My Areas</h2>
            <button className="text-xs font-500 text-[#1E2BB8]">+ Add area</button>
          </div>
          <div className="divide-y divide-[#E8E6E1]">
            {MY_AREAS.map(area => (
              <div key={area.name} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: area.color + '18' }}>
                  <MapPin size={16} style={{ color: area.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-500 text-[#0D1117]">{area.name}</p>
                  <p className="text-xs text-[#9CA3AF]">{area.label}</p>
                </div>
                <ChevronRight size={16} className="text-[#D1D5DB]" />
              </div>
            ))}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-xl bg-[#F4F2ED] flex items-center justify-center">
                <GraduationCap size={16} className="text-[#9CA3AF]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-500 text-[#0D1117]">PTU Campus</p>
                <p className="text-xs text-[#9CA3AF]">College</p>
              </div>
              <ChevronRight size={16} className="text-[#D1D5DB]" />
            </div>
          </div>
        </section>

        {/* Interests */}
        <section className="bg-white rounded-2xl border border-[#E8E6E1] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-600 text-[15px] text-[#0D1117]">Interests</h2>
            <button className="text-xs font-500 text-[#1E2BB8]">Edit</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(interest => (
              <span
                key={interest}
                className="px-3 py-1.5 bg-[#EEF1FF] text-[#1E2BB8] text-xs font-500 rounded-full"
              >
                {interest}
              </span>
            ))}
          </div>
        </section>

        {/* Saved Items */}
        <section className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E8E6E1]">
            <h2 className="font-display font-600 text-[15px] text-[#0D1117]">Saved</h2>
          </div>
          <div className="divide-y divide-[#E8E6E1]">
            {SAVED_ITEMS.map(item => (
              <button
                key={item.label}
                onClick={() => navigate(item.screen)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F9F8F5] transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-[#F4F2ED] flex items-center justify-center">
                  <item.icon size={16} className="text-[#6B7280]" />
                </div>
                <span className="flex-1 text-sm font-500 text-[#0D1117] text-left">{item.label}</span>
                <span className="text-sm font-mono-data text-[#6B7280]">{item.count}</span>
                <ChevronRight size={16} className="text-[#D1D5DB]" />
              </button>
            ))}
          </div>
        </section>

        {/* Settings Groups */}
        {SETTINGS_GROUPS.map(group => (
          <section key={group.title} className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E8E6E1]">
              <h2 className="font-display font-600 text-[15px] text-[#0D1117]">{group.title}</h2>
            </div>
            <div className="divide-y divide-[#E8E6E1]">
              {group.items.map(item => (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F9F8F5] transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#F4F2ED] flex items-center justify-center">
                    <item.icon size={16} className="text-[#6B7280]" />
                  </div>
                  <span className="flex-1 text-sm font-500 text-[#0D1117] text-left">{item.label}</span>
                  {item.value && (
                    <span className="text-sm text-[#9CA3AF]">{item.value}</span>
                  )}
                  {item.action && <ChevronRight size={16} className="text-[#D1D5DB]" />}
                </button>
              ))}
            </div>
          </section>
        ))}

        {/* Support */}
        <section className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden">
          <div className="divide-y divide-[#E8E6E1]">
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F9F8F5] transition-colors">
              <div className="w-8 h-8 rounded-xl bg-[#F4F2ED] flex items-center justify-center">
                <Phone size={16} className="text-[#6B7280]" />
              </div>
              <span className="flex-1 text-sm font-500 text-[#0D1117] text-left">Help & Support</span>
              <ChevronRight size={16} className="text-[#D1D5DB]" />
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F9F8F5] transition-colors">
              <div className="w-8 h-8 rounded-xl bg-[#FEE2E2] flex items-center justify-center">
                <LogOut size={16} className="text-[#DC2626]" />
              </div>
              <span className="text-sm font-500 text-[#DC2626] text-left">Sign out</span>
            </button>
          </div>
        </section>

        <p className="text-center text-xs text-[#9CA3AF]">Aaspaas v1.0.0 · Made with care in India 🇮🇳</p>
      </div>
    </div>
  )
}
