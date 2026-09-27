import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Clock, MapPin, ExternalLink, Sparkles, ChevronDown } from 'lucide-react'

interface Props {
  navigate: (screen: string) => void
  goBack: () => void
}

const CATEGORIES = ['Vegetables', 'Fruits', 'Fuel', 'Groceries', 'Mandi']

const PRICES = {
  Vegetables: [
    {
      name: 'Tomato', nameHi: 'Tamatar', price: 42, unit: 'kg', change: -8,
      prev: 46, source: 'AGMARKNET', updated: 'Today, 9:30 AM',
      trend: [46, 45, 48, 46, 44, 43, 42],
      aiNote: 'Prices fell due to higher arrivals from Himachal Pradesh. Expect prices to stabilise around ₹40-44 this week.',
    },
    {
      name: 'Onion', nameHi: 'Pyaaz', price: 38, unit: 'kg', change: 12,
      prev: 32, source: 'AGMARKNET', updated: 'Today, 9:30 AM',
      trend: [32, 32, 34, 35, 36, 37, 38],
      aiNote: 'Supply disruption from Maharashtra. Prices may rise further by 5-8% in the coming week.',
    },
    {
      name: 'Potato', nameHi: 'Aloo', price: 24, unit: 'kg', change: 2,
      prev: 22, source: 'AGMARKNET', updated: 'Today, 9:30 AM',
      trend: [22, 22, 23, 23, 24, 24, 24],
      aiNote: 'Marginal price increase due to seasonal shift. Local arrivals stable.',
    },
    {
      name: 'Spinach', nameHi: 'Palak', price: 28, unit: 'kg', change: 5,
      prev: 26, source: 'AGMARKNET', updated: 'Today, 9:30 AM',
      trend: [26, 26, 27, 27, 27, 28, 28],
      aiNote: 'Slight increase due to reduced winter supply from hill stations.',
    },
    {
      name: 'Cauliflower', nameHi: 'Gobhi', price: 32, unit: 'kg', change: -4,
      prev: 34, source: 'AGMARKNET', updated: 'Today, 9:30 AM',
      trend: [35, 34, 34, 33, 33, 32, 32],
      aiNote: 'Fresh arrivals from nearby farms brought prices down.',
    },
    {
      name: 'Capsicum', nameHi: 'Shimla Mirch', price: 80, unit: 'kg', change: 0,
      prev: 80, source: 'AGMARKNET', updated: 'Today, 9:30 AM',
      trend: [78, 80, 82, 80, 79, 80, 80],
      aiNote: 'Price stable this week. Imported supply balanced with demand.',
    },
  ],
  Fruits: [
    {
      name: 'Apple', nameHi: 'Seb', price: 140, unit: 'kg', change: -3,
      prev: 145, source: 'AGMARKNET', updated: 'Today, 9:30 AM',
      trend: [150, 148, 145, 144, 142, 141, 140],
      aiNote: 'Kashmir apple harvest in full swing. Prices likely to fall further.',
    },
    {
      name: 'Banana', nameHi: 'Kela', price: 52, unit: 'dozen', change: 0,
      prev: 52, source: 'AGMARKNET', updated: 'Today, 9:30 AM',
      trend: [50, 52, 54, 52, 52, 52, 52],
      aiNote: 'Prices stable from central India supply.',
    },
  ],
  Fuel: [
    {
      name: 'Petrol', nameHi: 'Petrol', price: 94.72, unit: 'L', change: 0.3,
      prev: 94.44, source: 'IOCL Punjab', updated: 'Today, 6:00 AM',
      trend: [93.8, 94.0, 94.2, 94.44, 94.44, 94.72, 94.72],
      aiNote: 'Minor price revision effective today. Crude oil prices remain stable globally.',
    },
    {
      name: 'Diesel', nameHi: 'Diesel', price: 87.62, unit: 'L', change: 0.3,
      prev: 87.35, source: 'IOCL Punjab', updated: 'Today, 6:00 AM',
      trend: [87.0, 87.0, 87.2, 87.35, 87.35, 87.62, 87.62],
      aiNote: 'Revised upward marginally. Transport costs may see minor impact.',
    },
    {
      name: 'LPG (14 kg)', nameHi: 'Gas Cylinder', price: 812, unit: 'cylinder', change: 0,
      prev: 812, source: 'IOCL Punjab', updated: '1 Oct 2026',
      trend: [812, 812, 812, 812, 812, 812, 812],
      aiNote: 'Prices unchanged for October 2026.',
    },
  ],
  Groceries: [
    {
      name: 'Rice (Basmati)', nameHi: 'Chawal', price: 85, unit: 'kg', change: 0,
      prev: 85, source: 'Local market survey', updated: 'Yesterday',
      trend: [84, 85, 85, 85, 85, 85, 85],
      aiNote: 'Basmati prices stable ahead of export season.',
    },
    {
      name: 'Atta (10 kg)', nameHi: 'Atta', price: 340, unit: '10 kg', change: -1.5,
      prev: 345, source: 'Local market survey', updated: 'Yesterday',
      trend: [350, 348, 345, 345, 342, 341, 340],
      aiNote: 'Wheat procurement rates supported by good rabi harvest.',
    },
    {
      name: 'Milk (packet)', nameHi: 'Doodh', price: 58, unit: 'L', change: 0,
      prev: 58, source: 'Verka Dairy', updated: 'Today',
      trend: [58, 58, 58, 58, 58, 58, 58],
      aiNote: 'Verka and Amul prices unchanged. Seasonal flush continues.',
    },
  ],
  Mandi: [
    {
      name: 'Wheat (Arrivals)', nameHi: 'Gehun', price: 2275, unit: 'quintal', change: 0.8,
      prev: 2257, source: 'Ludhiana Mandi', updated: 'Today, 10:00 AM',
      trend: [2240, 2250, 2260, 2257, 2260, 2270, 2275],
      aiNote: 'MSP remains ₹2,275. Market rates tracking MSP closely this season.',
    },
  ],
}

function Sparkline({ data, change }: { data: number[]; change: number }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 80, h = 28
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }))
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const color = change > 0 ? '#DC2626' : change < 0 ? '#16A34A' : '#9CA3AF'

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2" fill={color} />
    </svg>
  )
}

export default function PricesScreen({ navigate, goBack }: Props) {
  const [activeCategory, setActiveCategory] = useState('Vegetables')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const items = PRICES[activeCategory as keyof typeof PRICES] || []

  const avgChange = items.reduce((acc, i) => acc + i.change, 0) / items.length

  return (
    <div className="min-h-full bg-[#F9F8F5]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E6E1] sticky top-0 z-10">
        <div className="px-4 pt-3 pb-3">
          <div className="flex items-center justify-between mb-0.5">
            <h1 className="font-display font-700 text-[22px] text-[#0D1117]">Local Prices</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
              <span className="text-xs text-[#16A34A] font-500">Live</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-[#6B7280]">
            <MapPin size={13} className="shrink-0" />
            <span>Ludhiana, Punjab</span>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex overflow-x-auto no-scrollbar px-4 pb-3 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setExpandedItem(null) }}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-500 transition-colors ${
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

      <div className="px-4 py-4">
        {/* Summary stat bar */}
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl mb-4 ${
          avgChange > 1 ? 'bg-[#FEF3C7]' : avgChange < -1 ? 'bg-[#DCFCE7]' : 'bg-[#F4F2ED]'
        }`}>
          <div>
            <p className="text-xs text-[#6B7280] font-500">Average change today</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {avgChange > 0 ? (
                <TrendingUp size={16} className="text-[#DC2626]" />
              ) : avgChange < 0 ? (
                <TrendingDown size={16} className="text-[#16A34A]" />
              ) : (
                <Minus size={16} className="text-[#9CA3AF]" />
              )}
              <span className={`font-display font-700 text-lg ${
                avgChange > 0 ? 'text-[#DC2626]' : avgChange < 0 ? 'text-[#16A34A]' : 'text-[#6B7280]'
              }`}>
                {avgChange > 0 ? '+' : ''}{avgChange.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#9CA3AF]">{items.length} items tracked</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Updated 9:30 AM</p>
          </div>
        </div>

        {/* Price cards */}
        <div className="space-y-3">
          {items.map((item, i) => {
            const isExpanded = expandedItem === item.name
            const isUp = item.change > 0
            const isDown = item.change < 0

            return (
              <div
                key={item.name}
                className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden hover-lift animate-fade-in-up"
                style={{ animationDelay: `${i * 0.04}s` }}
                onClick={() => setExpandedItem(isExpanded ? null : item.name)}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <h3 className="font-display font-600 text-[15px] text-[#0D1117]">{item.name}</h3>
                        <span className="text-xs text-[#9CA3AF]">{item.nameHi}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1">
                          <Clock size={11} className="text-[#9CA3AF]" />
                          <span className="text-[11px] text-[#9CA3AF]">{item.updated}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ExternalLink size={11} className="text-[#9CA3AF]" />
                          <span className="text-[11px] text-[#9CA3AF]">{item.source}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sparkline */}
                    <Sparkline data={item.trend} change={item.change} />

                    {/* Price */}
                    <div className="text-right shrink-0">
                      <p className="font-mono-data font-500 text-[18px] text-[#0D1117]">
                        ₹{item.price.toLocaleString('en-IN')}
                        <span className="text-xs text-[#9CA3AF] font-400 ml-0.5">/{item.unit}</span>
                      </p>
                      <div className={`flex items-center justify-end gap-0.5 mt-0.5 ${
                        isUp ? 'text-[#DC2626]' : isDown ? 'text-[#16A34A]' : 'text-[#9CA3AF]'
                      }`}>
                        {isUp ? <TrendingUp size={12} /> : isDown ? <TrendingDown size={12} /> : <Minus size={12} />}
                        <span className="font-mono-data text-xs font-500">
                          {isUp ? '+' : ''}{item.change}%
                        </span>
                      </div>
                      <p className="text-[10px] text-[#C4C9D4] mt-0.5">
                        prev ₹{item.prev}/{item.unit}
                      </p>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-[#D1D5DB] transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>

                  {/* Expanded AI explanation */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#F4F2ED] animate-fade-in-up">
                      <div className="flex items-start gap-2 p-3 bg-[#EEF1FF] rounded-xl">
                        <Sparkles size={14} className="text-[#1E2BB8] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-600 text-[#1E2BB8] mb-1">AI analysis</p>
                          <p className="text-xs text-[#4357E6] leading-relaxed">{item.aiNote}</p>
                          <p className="text-[10px] text-[#9AAEFF] mt-1.5">Source: {item.source} · AI-generated summary</p>
                        </div>
                      </div>

                      {/* 7-day label */}
                      <div className="flex justify-between mt-3 px-1">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'].map((d, idx) => (
                          <div key={d} className="text-center">
                            <p className="text-[10px] text-[#9CA3AF]">{d}</p>
                            <p className="font-mono-data text-[11px] text-[#6B7280] mt-0.5">
                              {item.trend[idx]}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Source note */}
        <div className="mt-4 px-4 py-3 bg-[#F4F2ED] rounded-xl">
          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            Prices sourced from AGMARKNET, IOCL, local market surveys, and official mandi data.
            AI analysis is generated for informational purposes only.{' '}
            <button className="text-[#1E2BB8] underline">View sources</button>
          </p>
        </div>
      </div>
    </div>
  )
}
