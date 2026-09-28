import {
  BadgeCheck,
  Bell,
  GraduationCap,
  Home,
  IndianRupee,
  Map,
  MapPin,
  Newspaper,
  Shield,
  Sparkles,
  TrendingUp,
  User,
  MessageSquare
} from 'lucide-react'
import { useEffect, useState } from 'react'

import AIScreen from './screens/AIScreen'
import AlertsScreen from './screens/AlertsScreen'
import HomeScreen from './screens/HomeScreen'
import MapScreen from './screens/MapScreen'
import NewsScreen from './screens/NewsScreen'
import PricesScreen from './screens/PricesScreen'
import ProfileScreen from './screens/ProfileScreen'
import StudentScreen from './screens/StudentScreen'

export type Screen =
  | 'home' | 'news' | 'map' | 'ai' | 'profile'
  | 'student' | 'prices' | 'events' | 'alerts'

const MAIN_TABS: Screen[] = ['home', 'news', 'map', 'ai', 'profile']

const SIDEBAR_NAV = [
  { screen: 'home' as Screen, label: 'Home', icon: Home },
  { screen: 'news' as Screen, label: 'News', icon: Newspaper },
  { screen: 'map' as Screen, label: 'Map', icon: Map },
  { screen: 'ai' as Screen, label: 'AI Assistant', icon: Sparkles },
  { screen: 'prices' as Screen, label: 'Prices', icon: IndianRupee },
  { screen: 'student' as Screen, label: 'Student Hub', icon: GraduationCap },
  { screen: 'alerts' as Screen, label: 'Alerts', icon: Bell },
  { screen: 'profile' as Screen, label: 'Profile', icon: User },
]

const BOTTOM_NAV = [
  { screen: 'home' as Screen, label: 'Home', icon: Home },
  { screen: 'news' as Screen, label: 'Explore', icon: Newspaper },
  { screen: 'map' as Screen, label: 'Map', icon: Map },
  { screen: 'ai' as Screen, label: 'AI', icon: Sparkles },
  { screen: 'profile' as Screen, label: 'Profile', icon: User },
]

const RIGHT_PANEL_TRENDING = [
  { emoji: '📚', text: 'PTU BTech seats increased for 2026-27', time: '1 hr ago', category: 'Education' },
  { emoji: '🚧', text: 'Ferozepur Road diversion update', time: '2 hr ago', category: 'Traffic' },
  { emoji: '💼', text: '850 Punjab Police vacancies open', time: '1 day ago', category: 'Jobs' },
  { emoji: '🥬', text: 'Vegetable prices drop 8% today', time: 'Today', category: 'Prices' },
]

const RIGHT_PANEL_ALERTS = [
  { priority: 'urgent', text: 'Yellow rain alert after 7 PM', color: '#D97706' },
  { priority: 'urgent', text: 'Miller Ganj road closure', color: '#DC2626' },
  { priority: 'info', text: 'PTU deadline extended to Nov 15', color: '#2563EB' },
]

// Logo component
function AaspaasLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' }
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1E2BB8] to-[#4357E6] flex items-center justify-center shadow-sm">
        <MapPin size={15} className="text-white" strokeWidth={2.5} />
      </div>
      <span className={`font-display font-800 text-[#0D1117] ${sizes[size]} tracking-tight`}>
        aaspaas
      </span>
    </div>
  )
}

// Sidebar (desktop)
function Sidebar({ screen, navigate }: { screen: Screen; navigate: (s: Screen) => void }) {
  return (
    <div className="flex flex-col h-full py-5">
      {/* Brand */}
      <div className="px-5 mb-8">
        <AaspaasLogo size="md" />
        <p className="text-[11px] text-[#9CA3AF] mt-1 ml-10">Your area, understood by AI</p>
      </div>

      {/* Location context */}
      <div className="mx-4 mb-6 px-3 py-2.5 bg-[#F4F2ED] rounded-xl flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-[#EEF1FF] flex items-center justify-center">
          <MapPin size={11} className="text-[#1E2BB8]" />
        </div>
        <span className="text-sm font-500 text-[#374151]">Ludhiana, Punjab</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5">
        {SIDEBAR_NAV.map(item => {
          const isActive = screen === item.screen
          return (
            <button
              key={item.screen}
              onClick={() => navigate(item.screen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-500 transition-all ${isActive
                  ? 'bg-[#EEF1FF] text-[#1E2BB8] font-600'
                  : 'text-[#6B7280] hover:bg-[#F4F2ED] hover:text-[#374151]'
                }`}
            >
              <item.icon
                size={18}
                strokeWidth={isActive ? 2.5 : 1.75}
                className={item.screen === 'ai' && isActive ? 'text-[#1E2BB8]' : ''}
              />
              {item.label}
              {item.screen === 'alerts' && (
                <span className="ml-auto w-5 h-5 rounded-full bg-[#DC2626] text-white text-[10px] font-700 flex items-center justify-center">
                  2
                </span>
              )}
              {item.screen === 'ai' && (
                <span className="ml-auto px-1.5 py-0.5 text-[9px] font-700 bg-gradient-to-r from-[#1E2BB8] to-[#4357E6] text-white rounded-full uppercase tracking-wide">
                  AI
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Recent Chats in Sidebar */}
      <div className="mx-3 mt-4 pt-3 border-t border-[#E8E6E1]">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[11px] font-700 text-[#9CA3AF] uppercase tracking-wider">
            Chat History
          </span>
          <button
            onClick={() => navigate('ai')}
            className="text-[11px] text-[#1E2BB8] font-600 hover:underline"
          >
            + New
          </button>
        </div>

        <div className="space-y-0.5">
          {[
            { id: '1', title: 'Ludhiana Mandi tomato prices' },
            { id: '2', title: 'PTU CS seats 2026-27' },
            { id: '3', title: 'PGs near PTU under 8k' },
            { id: '4', title: 'PSPCL junior engineer vacancy' },
          ].map(chat => (
            <button
              key={chat.id}
              onClick={() => navigate('ai')}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#4B5563] hover:text-[#0D1117] hover:bg-[#F4F2ED] transition-colors text-left"
            >
              <MessageSquare size={13} className="text-[#9CA3AF] shrink-0" />
              <span className="truncate">{chat.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom: user */}
      <div className="mx-4 mt-4 pt-4 border-t border-[#E8E6E1]">
        <button
          onClick={() => navigate('profile')}
          className="flex items-center gap-3 w-full hover:bg-[#F4F2ED] rounded-xl px-2 py-2 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E2BB8] to-[#4357E6] flex items-center justify-center">
            <span className="font-display font-700 text-sm text-white">D</span>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-600 text-[#0D1117]">Dilkhush Singh</p>
            <div className="flex items-center gap-1">
              <BadgeCheck size={11} className="text-[#1E2BB8]" />
              <p className="text-[10px] text-[#9CA3AF]">Verified</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

// Bottom Nav (mobile)
function BottomNav({ activeTab, navigate }: { activeTab: Screen; navigate: (s: Screen) => void }) {
  return (
    <div className="flex items-center justify-around px-2 pt-1.5 pb-1.5">
      {BOTTOM_NAV.map(item => {
        const isActive = activeTab === item.screen
        const isAI = item.screen === 'ai'

        return (
          <button
            key={item.screen}
            onClick={() => navigate(item.screen)}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-xl transition-all ${isActive && !isAI ? 'text-[#1E2BB8]' : isAI ? '' : 'text-[#9CA3AF] active:text-[#1E2BB8]'
              }`}
          >
            {isAI ? (
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm transition-all ${isActive
                  ? 'bg-gradient-to-br from-[#1E2BB8] to-[#4357E6] shadow-md shadow-[#1E2BB8]/25'
                  : 'bg-[#F4F2ED]'
                }`}>
                <Sparkles size={17} className={isActive ? 'text-white' : 'text-[#1E2BB8]'} />
              </div>
            ) : (
              <item.icon size={21} strokeWidth={isActive ? 2.4 : 1.7} />
            )}
            {!isAI && (
              <span className={`text-[10px] ${isActive ? 'font-semibold text-[#1E2BB8]' : 'font-medium text-[#6B7280]'} leading-none tracking-tight`}>
                {item.label}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// Right panel (desktop XL)
function RightPanel({ navigate }: { navigate: (s: Screen) => void }) {
  return (
    <div className="py-5 px-4 space-y-5">
      {/* AI Brief */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#1E2BB8] to-[#4357E6] flex items-center justify-center">
            <Sparkles size={11} className="text-white" />
          </div>
          <span className="font-display font-700 text-[14px] text-[#0D1117]">AI Brief</span>
          <div className="ml-auto flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            <span className="text-[10px] text-[#9CA3AF]">Live</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E8E6E1] p-3 space-y-2">
          {['Ferozepur Road: 20 min delay, use Pakhowal Rd', 'Rain alert 7 PM — carry umbrella', 'Tomato ↓8% at Ludhiana mandi'].map((point, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-[#9CA3AF] mt-2 shrink-0" />
              <p className="text-xs text-[#374151] leading-snug">{point}</p>
            </div>
          ))}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F4F2ED]">
            <div className="flex items-center gap-1">
              <Shield size={10} className="text-[#9CA3AF]" />
              <span className="text-[10px] text-[#9CA3AF]">3 sources</span>
            </div>
            <button
              onClick={() => navigate('ai')}
              className="text-[10px] font-600 text-[#1E2BB8]"
            >
              Ask AI →
            </button>
          </div>
        </div>
      </div>

      {/* Active alerts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-display font-700 text-[14px] text-[#0D1117]">Active Alerts</span>
          <button
            onClick={() => navigate('alerts')}
            className="text-[11px] font-500 text-[#1E2BB8]"
          >
            All alerts →
          </button>
        </div>
        <div className="space-y-2">
          {RIGHT_PANEL_ALERTS.map((alert, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2.5 bg-white rounded-xl border border-[#E8E6E1]"
            >
              <div
                className="w-1 h-full rounded-full shrink-0 mt-1 self-stretch"
                style={{ backgroundColor: alert.color, minHeight: 32 }}
              />
              <p className="text-xs text-[#374151] leading-snug">{alert.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trending nearby */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-[#DC2626]" />
          <span className="font-display font-700 text-[14px] text-[#0D1117]">Trending nearby</span>
        </div>
        <div className="space-y-2">
          {RIGHT_PANEL_TRENDING.map((item, i) => (
            <button
              key={i}
              onClick={() => navigate('news')}
              className="w-full flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-[#E8E6E1] hover:border-[#C4CEFF] hover:bg-[#EEF1FF] transition-colors text-left"
            >
              <span className="text-lg shrink-0">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-500 text-[#0D1117] leading-snug line-clamp-2">{item.text}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-[#9CA3AF]">{item.time}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#F4F2ED] text-[#6B7280] rounded-full">{item.category}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Source note */}
      <div className="p-3 bg-[#F4F2ED] rounded-xl">
        <div className="flex items-center gap-1.5 mb-1">
          <Shield size={12} className="text-[#6B7280]" />
          <span className="text-xs font-600 text-[#6B7280]">Source transparency</span>
        </div>
        <p className="text-[10px] text-[#9CA3AF] leading-relaxed">
          All information is sourced from government portals, verified news publishers, and AGMARKNET.
          AI summaries are clearly labelled.
        </p>
      </div>
    </div>
  )
}

// Screen renderer
function renderScreen(screen: Screen, navigate: (s: Screen) => void, goBack: () => void) {
  const nav = (s: string) => navigate(s as Screen)
  switch (screen) {
    case 'home': return <HomeScreen navigate={nav} />
    case 'news': return <NewsScreen navigate={nav} />
    case 'map': return <MapScreen navigate={nav} />
    case 'ai': return <AIScreen navigate={nav} />
    case 'student': return <StudentScreen navigate={nav} goBack={goBack} />
    case 'prices': return <PricesScreen navigate={nav} goBack={goBack} />
    case 'alerts': return <AlertsScreen navigate={nav} goBack={goBack} />
    case 'profile': return <ProfileScreen navigate={nav} />
    default: return <HomeScreen navigate={nav} />
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [prevScreen, setPrevScreen] = useState<Screen>('home')

  const navigate = (target: Screen) => {
    setPrevScreen(screen)
    setScreen(target)
  }

  const goBack = () => {
    setScreen(prevScreen)
  }

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  // 1. React Native WebView bridge message listener (when running in Expo Go)
  useEffect(() => {
    const handleBridgeMessage = (event: any) => {
      try {
        const raw = event.data
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (data && data.type === 'KEYBOARD_STATUS') {
          setIsKeyboardOpen(Boolean(data.isOpen))
        }
      } catch {}
    }

    window.addEventListener('message', handleBridgeMessage)
    document.addEventListener('message', handleBridgeMessage as any)
    return () => {
      window.removeEventListener('message', handleBridgeMessage)
      document.removeEventListener('message', handleBridgeMessage as any)
    }
  }, [])

  // 2. Direct input focus/blur detection (instant, zero-lag on all mobile devices)
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        setIsKeyboardOpen(true)
      }
    }

    const handleFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement as HTMLElement
        if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA')) {
          setIsKeyboardOpen(false)
        }
      }, 100)
    }

    window.addEventListener('focusin', handleFocusIn)
    window.addEventListener('focusout', handleFocusOut)
    return () => {
      window.removeEventListener('focusin', handleFocusIn)
      window.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  // 3. VisualViewport height resize detection (for mobile browser viewport)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return

    const handleViewport = () => {
      if (!window.visualViewport) return
      const vh = window.visualViewport.height
      const isShrunk = window.innerHeight - vh > 80 || (window.screen?.height && window.screen.height - vh > 150)
      if (isShrunk) {
        setIsKeyboardOpen(true)
      }
    }

    window.visualViewport.addEventListener('resize', handleViewport)
    window.visualViewport.addEventListener('scroll', handleViewport)
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewport)
      window.visualViewport?.removeEventListener('scroll', handleViewport)
    }
  }, [])

  // Active tab for bottom nav (snap to nearest main tab)
  const activeTab = MAIN_TABS.includes(screen) ? screen : prevScreen

  return (
    <div
      className="h-full flex w-full overflow-hidden"
      style={{
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-[#E8E6E1] bg-white overflow-y-auto no-scrollbar">
        <Sidebar screen={screen} navigate={navigate} />
      </aside>

      {/* Main content area */}
      <div className="flex-1 min-h-0 flex flex-col min-w-0 overflow-hidden">
        {/* Screen content */}
        <main className={`flex-1 min-h-0 no-scrollbar ${screen === 'map' || screen === 'ai' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
          {renderScreen(screen, navigate, goBack)}
        </main>

        {/* Mobile bottom nav - hidden when keyboard is open so text box sits right on top */}
        {!isKeyboardOpen && (
          <nav className="lg:hidden shrink-0 bg-white border-t border-[#E8E6E1]">
            <BottomNav activeTab={activeTab} navigate={navigate} />
          </nav>
        )}
      </div>

      {/* Desktop right panel */}
      <aside className="hidden xl:flex flex-col w-72 shrink-0 border-l border-[#E8E6E1] bg-[#F9F8F5] overflow-y-auto no-scrollbar">
        <RightPanel navigate={navigate} />
      </aside>
    </div>
  )
}
