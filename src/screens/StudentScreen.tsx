import { useState } from 'react'
import { MapPin, Star, Wifi, Utensils, Shield, DoorOpen, Wind, ChevronRight, BadgeCheck, BookOpen, GraduationCap, IndianRupee, Filter, Clock, ExternalLink } from 'lucide-react'

interface Props {
  navigate: (screen: string) => void
  goBack: () => void
}

const TABS = ['PG / Hostels', 'Colleges', 'Scholarships', 'Exams']

const PGS = [
  {
    id: 1,
    name: 'Green View PG',
    location: '2nd Floor, Model Town Extension',
    distance: 0.7,
    price: 8000,
    rating: 4.6,
    reviews: 82,
    food: true, wifi: true, ac: true, attached: true, security: true,
    gender: 'Co-ed',
    highlight: 'Best match',
    matchReasons: ['Under budget', '0.7 km from PTU', 'Wi-Fi included', 'AC rooms'],
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=200&fit=crop&auto=format',
  },
  {
    id: 2,
    name: 'Sharma PG',
    location: 'Near PTU Gate 2, Ferozepur Road',
    distance: 1.1,
    price: 7200,
    rating: 4.4,
    reviews: 54,
    food: true, wifi: true, ac: false, attached: false, security: true,
    gender: 'Boys',
    highlight: null,
    matchReasons: ['Under ₹8,000', '1.1 km from college', 'Food included'],
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=200&fit=crop&auto=format',
  },
  {
    id: 3,
    name: 'Malhotra Girls Hostel',
    location: 'Sector 32-A, Near Bus Stand',
    distance: 1.8,
    price: 6800,
    rating: 4.2,
    reviews: 37,
    food: true, wifi: true, ac: false, attached: true, security: true,
    gender: 'Girls',
    highlight: null,
    matchReasons: ['Best value', 'Safe locality', 'Food included'],
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=200&fit=crop&auto=format',
  },
  {
    id: 4,
    name: 'Student Home PG',
    location: 'Gurdev Nagar, Near Clock Tower',
    distance: 2.4,
    price: 5500,
    rating: 3.9,
    reviews: 21,
    food: false, wifi: true, ac: false, attached: false, security: false,
    gender: 'Boys',
    highlight: null,
    matchReasons: ['Cheapest option', 'Wi-Fi available', '2.4 km from campus'],
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=200&fit=crop&auto=format',
  },
]

const COLLEGES = [
  {
    id: 1,
    name: 'Punjab Technical University (PTU)',
    location: 'Kapurthala Road, Ludhiana',
    distance: 4.8,
    course: 'BTech CSE',
    fees: 120000,
    placement: 780000,
    rating: 4.1,
    type: 'Government',
    seats: 'Available',
    hostel: true, entrance: 'JEE / LPUNEST',
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=200&fit=crop&auto=format',
  },
  {
    id: 2,
    name: 'Lovely Professional University (LPU)',
    location: 'Phagwara Road, Jalandhar',
    distance: 28,
    course: 'BTech CSE',
    fees: 185000,
    placement: 820000,
    rating: 4.5,
    type: 'Private',
    seats: 'Available',
    hostel: true, entrance: 'LPUNEST / JEE',
    image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&h=200&fit=crop&auto=format',
  },
  {
    id: 3,
    name: 'CT University',
    location: 'Ferozepur Road, Ludhiana',
    distance: 12,
    course: 'BTech',
    fees: 90000,
    placement: 560000,
    rating: 3.8,
    type: 'Private',
    seats: 'Limited',
    hostel: true, entrance: 'Direct',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=200&fit=crop&auto=format',
  },
]

const SCHOLARSHIPS = [
  {
    name: 'Post Matric Scholarship (SC/ST/OBC)',
    amount: 'Full tuition + ₹8,000/month',
    deadline: '15 Nov 2026',
    status: 'Open',
    source: 'Punjab Welfare Dept',
  },
  {
    name: 'INSPIRE Scholarship — Science',
    amount: '₹80,000/year',
    deadline: '31 Oct 2026',
    status: 'Open',
    source: 'DST India',
  },
  {
    name: 'PM CARES Scholarship',
    amount: '₹1,00,000/year',
    deadline: '30 Sep 2026',
    status: 'Closing soon',
    source: 'PM CARES Fund',
  },
]

const EXAMS = [
  { name: 'JEE Main 2027 (Session 1)', date: 'Jan 2027', status: 'Upcoming', type: 'Engineering' },
  { name: 'NEET UG 2027', date: 'May 2027', status: 'Upcoming', type: 'Medical' },
  { name: 'CUET UG 2027', date: 'May 2027', status: 'Upcoming', type: 'University' },
  { name: 'GATE 2027', date: 'Feb 2027', status: 'Registration open', type: 'Postgrad' },
]

function AmenityChip({ icon: Icon, label, active }: { icon: any; label: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-500 ${
      active ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#F4F2ED] text-[#C4C9D4] line-through'
    }`}>
      <Icon size={11} />
      {label}
    </div>
  )
}

export default function StudentScreen({ navigate, goBack }: Props) {
  const [activeTab, setActiveTab] = useState('PG / Hostels')
  const [compareList, setCompareList] = useState<number[]>([])
  const [budget, setBudget] = useState(8000)

  const toggleCompare = (id: number) => {
    setCompareList(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : prev
    )
  }

  return (
    <div className="min-h-full bg-[#F9F8F5]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E6E1] sticky top-0 z-10">
        <div className="px-4 pt-3 pb-3">
          <div className="flex items-center justify-between mb-0.5">
            <h1 className="font-display font-700 text-[22px] text-[#0D1117]">Student Hub</h1>
            <div className="flex items-center gap-1.5 text-sm text-[#6B7280]">
              <MapPin size={13} />
              <span>Ludhiana</span>
            </div>
          </div>
          <p className="text-sm text-[#9CA3AF]">Find PGs, colleges, scholarships & more</p>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto no-scrollbar px-4 pb-3 gap-2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-500 transition-colors ${
                activeTab === tab
                  ? 'bg-[#1E2BB8] text-white'
                  : 'bg-[#F4F2ED] text-[#6B7280] hover:bg-[#EBE8E0]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* PG Tab */}
      {activeTab === 'PG / Hostels' && (
        <div className="px-4 py-4">
          {/* Search context */}
          <div className="flex items-center justify-between mb-4">
            <div className="bg-[#EEF1FF] px-3 py-2 rounded-xl flex items-center gap-2 flex-1 mr-3">
              <BookOpen size={14} className="text-[#1E2BB8] shrink-0" />
              <p className="text-sm text-[#1E2BB8] font-500 truncate">14 PGs under ₹8,000 near PTU</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E8E6E1] rounded-xl text-sm text-[#6B7280]">
              <Filter size={14} />
              Filter
            </button>
          </div>

          {/* AI summary */}
          <div className="bg-white rounded-2xl border border-[#E8E6E1] p-4 mb-4">
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Found <span className="font-600 text-[#0D1117]">14 options</span> within 3 km of PTU.{' '}
              <span className="font-600 text-[#16A34A]">6 are below ₹8,000/month</span> with food included.
              Showing best matches first.
            </p>
          </div>

          {/* Compare bar */}
          {compareList.length > 0 && (
            <div className="bg-[#1E2BB8] text-white rounded-2xl p-3 mb-4 flex items-center justify-between animate-fade-in-up">
              <span className="text-sm font-500">{compareList.length} PG{compareList.length > 1 ? 's' : ''} selected</span>
              <button
                disabled={compareList.length < 2}
                className="px-3 py-1.5 bg-white text-[#1E2BB8] text-sm font-600 rounded-lg disabled:opacity-50"
              >
                Compare
              </button>
            </div>
          )}

          {/* PG Cards */}
          <div className="space-y-4">
            {PGS.map((pg, i) => (
              <div
                key={pg.id}
                className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden hover-lift animate-fade-in-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                {/* Image */}
                <div className="relative h-36 bg-[#F4F2ED] overflow-hidden">
                  <img src={pg.image} alt={pg.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {pg.highlight && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#1E2BB8] text-white text-[11px] font-700 rounded-full">
                      ⭐ {pg.highlight}
                    </span>
                  )}
                  <span className="absolute top-3 right-3 px-2.5 py-1 bg-black/50 text-white text-[11px] font-500 rounded-full">
                    {pg.gender}
                  </span>
                  <div className="absolute bottom-3 left-3 flex items-center gap-1">
                    <Star size={12} className="text-[#F59E0B] fill-[#F59E0B]" />
                    <span className="text-white text-xs font-600">{pg.rating}</span>
                    <span className="text-white/70 text-[11px]">({pg.reviews})</span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-600 text-[16px] text-[#0D1117]">{pg.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-[#9CA3AF] shrink-0" />
                        <p className="text-xs text-[#9CA3AF] truncate">{pg.location}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono-data font-600 text-[18px] text-[#0D1117]">
                        ₹{pg.price.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[11px] text-[#9CA3AF]">/month</p>
                    </div>
                  </div>

                  {/* Distance + match */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className="flex items-center gap-1 px-2 py-1 bg-[#F4F2ED] rounded-lg text-[11px] text-[#6B7280] font-500">
                      <MapPin size={10} />
                      {pg.distance} km
                    </span>
                    {pg.matchReasons.map(r => (
                      <span key={r} className="flex items-center gap-1 px-2 py-1 bg-[#DCFCE7] rounded-lg text-[11px] text-[#16A34A] font-500">
                        ✓ {r}
                      </span>
                    ))}
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <AmenityChip icon={Utensils} label="Food" active={pg.food} />
                    <AmenityChip icon={Wifi} label="Wi-Fi" active={pg.wifi} />
                    <AmenityChip icon={Wind} label="AC" active={pg.ac} />
                    <AmenityChip icon={DoorOpen} label="Attached" active={pg.attached} />
                    <AmenityChip icon={Shield} label="Security" active={pg.security} />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 py-2.5 bg-[#1E2BB8] text-white text-sm font-600 rounded-xl">
                      Contact PG
                    </button>
                    <button
                      onClick={() => toggleCompare(pg.id)}
                      className={`px-4 py-2.5 text-sm font-600 rounded-xl border transition-colors ${
                        compareList.includes(pg.id)
                          ? 'bg-[#EEF1FF] border-[#1E2BB8] text-[#1E2BB8]'
                          : 'bg-white border-[#E8E6E1] text-[#6B7280]'
                      }`}
                    >
                      {compareList.includes(pg.id) ? '✓ Added' : 'Compare'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Colleges Tab */}
      {activeTab === 'Colleges' && (
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-[#6B7280]">BTech colleges near Ludhiana</p>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E8E6E1] rounded-xl text-sm text-[#6B7280]">
              <Filter size={14} />
              Filter
            </button>
          </div>

          <div className="space-y-4">
            {COLLEGES.map((college, i) => (
              <div
                key={college.id}
                className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden hover-lift animate-fade-in-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="relative h-32 bg-[#F4F2ED] overflow-hidden">
                  <img src={college.image} alt={college.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className={`absolute top-3 left-3 px-2.5 py-1 text-[11px] font-600 rounded-full ${
                    college.type === 'Government' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#DBEAFE] text-[#2563EB]'
                  }`}>
                    {college.type}
                  </span>
                  <span className={`absolute top-3 right-3 px-2.5 py-1 text-[11px] font-600 rounded-full ${
                    college.seats === 'Available' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEF3C7] text-[#D97706]'
                  }`}>
                    {college.seats}
                  </span>
                  <div className="absolute bottom-3 left-3 flex items-center gap-1">
                    <Star size={12} className="text-[#F59E0B] fill-[#F59E0B]" />
                    <span className="text-white text-xs font-600">{college.rating}</span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-display font-600 text-[15px] text-[#0D1117] leading-snug">{college.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={12} className="text-[#9CA3AF]" />
                    <p className="text-xs text-[#9CA3AF]">{college.location} · {college.distance} km</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-3 py-3 border-t border-b border-[#F4F2ED]">
                    <div className="text-center">
                      <p className="font-mono-data font-600 text-base text-[#0D1117]">₹{(college.fees/100000).toFixed(1)}L</p>
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5">Fees/year</p>
                    </div>
                    <div className="text-center border-x border-[#F4F2ED]">
                      <p className="font-mono-data font-600 text-base text-[#16A34A]">₹{(college.placement/100000).toFixed(1)}L</p>
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5">Avg pkg</p>
                    </div>
                    <div className="text-center">
                      <p className="font-display font-600 text-base text-[#0D1117]">{college.course}</p>
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5">Course</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 text-xs text-[#9CA3AF]">
                    <GraduationCap size={12} />
                    <span>{college.entrance}</span>
                    {college.hostel && (
                      <>
                        <span className="mx-1">·</span>
                        <span className="text-[#16A34A]">Hostel available</span>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 py-2.5 bg-[#1E2BB8] text-white text-sm font-600 rounded-xl">
                      View college
                    </button>
                    <button className="px-4 py-2.5 bg-white border border-[#E8E6E1] text-sm font-600 text-[#6B7280] rounded-xl">
                      Compare
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scholarships Tab */}
      {activeTab === 'Scholarships' && (
        <div className="px-4 py-4 space-y-3">
          <p className="text-sm text-[#9CA3AF] mb-2">Active scholarships for Punjab students</p>
          {SCHOLARSHIPS.map((s, i) => (
            <div key={s.name} className="bg-white rounded-2xl border border-[#E8E6E1] p-4 hover-lift animate-fade-in-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-display font-600 text-[14px] text-[#0D1117] leading-snug">{s.name}</h3>
                  <p className="font-mono-data font-500 text-sm text-[#16A34A] mt-1.5">{s.amount}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Clock size={11} className="text-[#9CA3AF]" />
                      <span className="text-xs text-[#9CA3AF]">Deadline: {s.deadline}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ExternalLink size={11} className="text-[#9CA3AF]" />
                      <span className="text-xs text-[#9CA3AF]">{s.source}</span>
                    </div>
                  </div>
                </div>
                <span className={`shrink-0 px-2.5 py-1 text-[11px] font-600 rounded-full ${
                  s.status === 'Open' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEF3C7] text-[#D97706]'
                }`}>
                  {s.status}
                </span>
              </div>
              <button className="mt-3 w-full py-2 bg-[#EEF1FF] text-[#1E2BB8] text-sm font-600 rounded-xl flex items-center justify-center gap-1">
                Apply now <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Exams Tab */}
      {activeTab === 'Exams' && (
        <div className="px-4 py-4 space-y-3">
          <p className="text-sm text-[#9CA3AF] mb-2">Upcoming entrance exams</p>
          {EXAMS.map((exam, i) => (
            <div key={exam.name} className="bg-white rounded-2xl border border-[#E8E6E1] p-4 hover-lift animate-fade-in-up flex items-center gap-4" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="w-12 h-12 rounded-xl bg-[#EEF1FF] flex items-center justify-center shrink-0">
                <GraduationCap size={22} className="text-[#1E2BB8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-600 text-[14px] text-[#0D1117] leading-snug">{exam.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[#9CA3AF]">{exam.date}</span>
                  <span className="text-[#D9D5CA]">·</span>
                  <span className="text-xs text-[#6B7280] font-500">{exam.type}</span>
                </div>
              </div>
              <span className={`shrink-0 px-2.5 py-1 text-[11px] font-600 rounded-full ${
                exam.status === 'Registration open' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#F4F2ED] text-[#9CA3AF]'
              }`}>
                {exam.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
