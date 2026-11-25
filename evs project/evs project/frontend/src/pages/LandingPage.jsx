import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Camera,
  CheckCircle2,
  Cpu,
  Leaf,
  MapPin,
  Recycle,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Identify or Scan',
    desc: 'Search any household item or upload a waste photo to classify it with AI assistance.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Check Right Bin',
    desc: 'Instantly see whether it belongs in Wet, Dry/Recyclable, E-Waste, or Hazardous.',
    icon: Recycle,
  },
  {
    step: '03',
    title: 'Locate Centre',
    desc: 'Find nearby recycling & e-waste collection points on an interactive map.',
    icon: MapPin,
  },
  {
    step: '04',
    title: 'Track & Earn Score',
    desc: 'Log your responsible disposal, complete challenges, and grow your Eco Score.',
    icon: Award,
  },
];

const CATEGORIES_PREVIEW = [
  {
    title: 'Wet / Organic Waste',
    bin: 'Green Bin',
    color: 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
    badge: 'bg-emerald-700 text-white',
    icon: Leaf,
    examples: 'Food scraps, vegetable peels, fruit waste, tea leaves, garden trimmings',
    action: 'Composted or sent to municipal biogas / organic recovery',
  },
  {
    title: 'Dry / Recyclable Waste',
    bin: 'Blue Bin',
    color: 'border-sky-200 bg-sky-50/70 text-sky-900',
    badge: 'bg-sky-700 text-white',
    icon: Recycle,
    examples: 'Plastic bottles, newspapers, cardboard boxes, metal cans, glass jars',
    action: 'Emptied, rinsed, kept dry, and routed to recycling collection',
  },
  {
    title: 'E-Waste',
    bin: 'Amber Drop-Off',
    color: 'border-amber-200 bg-amber-50/70 text-amber-900',
    badge: 'bg-amber-600 text-white',
    icon: Cpu,
    examples: 'Mobile phones, chargers, USB cables, laptops, electronic accessories',
    action: 'Data wiped and delivered to authorized e-waste take-back centres',
  },
  {
    title: 'Hazardous / Special',
    bin: 'Red Special Handling',
    color: 'border-rose-200 bg-rose-50/70 text-rose-900',
    badge: 'bg-rose-600 text-white',
    icon: AlertTriangle,
    examples: 'Batteries, expired medicine strips, CFL bulbs, household chemicals',
    action: 'Isolated safely and handed to special hazardous or pharmacy drop-offs',
  },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#EDF5EE] via-[#F4F8F4] to-[#F7F9F6] border-b border-[#DCE7DD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-emerald-200 text-xs font-semibold text-[#1B4332] shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Environmental Science Platform • Mobile-First Web App</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#12261C] leading-[1.08]">
              Sort Smart.{' '}
              <span className="text-[#2D6A4F]">Recycle Right.</span>{' '}
              Protect Our Environment.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              Most recoverable waste ends up in landfills simply because people aren&apos;t sure which bin to use at the moment of disposal. EcoSort turns confusion into clear action—helping you identify items, follow proper disposal steps, locate recycling centres, and build lasting eco habits.
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5 pt-1">
              <Link
                to="/identify"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#1B4332] hover:bg-[#143326] text-white font-semibold text-base shadow-sm transition"
              >
                <Search className="w-5 h-5" />
                <span>Identify Waste</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/centres"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-emerald-50 border border-[#C6D8C9] text-[#1B4332] font-semibold text-base transition"
              >
                <MapPin className="w-5 h-5 text-emerald-700" />
                <span>Find Recycling Centre</span>
              </Link>
              <Link
                to="/scan"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-100/70 hover:bg-emerald-100 text-[#1B4332] font-semibold text-base transition"
              >
                <Camera className="w-5 h-5" />
                <span>Scan Photo</span>
              </Link>
            </div>
          </div>

          {/* Interactive Flow Preview Card */}
          <div className="lg:col-span-5">
            <div className="ecosort-card p-6 sm:p-7 space-y-5 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Core Segregation Flow
                  </p>
                  <h3 className="text-lg font-bold text-[#14231B]">From Doubt to Proper Action</h3>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  4 Categories
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Plastic Bottle', cat: 'Dry / Recyclable', bin: 'Blue Bin', color: 'bg-sky-50 border-sky-200 text-sky-900' },
                  { label: 'Banana Peel', cat: 'Wet / Organic', bin: 'Green Bin', color: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
                  { label: 'Old Mobile Phone', cat: 'E-Waste', bin: 'Authorized E-Waste Hub', color: 'bg-amber-50 border-amber-200 text-amber-900' },
                  { label: 'Expired Medicine Strip', cat: 'Hazardous / Special', bin: 'Pharmacy / Special Drop-Off', color: 'bg-rose-50 border-rose-200 text-rose-900' },
                ].map((ex) => (
                  <div
                    key={ex.label}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${ex.color}`}
                  >
                    <div>
                      <p className="font-semibold text-sm">{ex.label}</p>
                      <p className="text-xs opacity-80">{ex.cat}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/80 shadow-2xs shrink-0">
                      {ex.bin}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-[#F4F8F4] border border-[#DCE7DD] flex items-center justify-between text-xs text-slate-700">
                <span>AI Photo Scan + Manual Fallback + Disposal Log</span>
                <Link to="/scan" className="font-semibold text-[#1B4332] hover:underline">
                  Try Scan →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Environmental Problem & Context Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              The Environmental Problem
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#14231B]">
              Why Mixed Waste Breaks Recycling
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              When food scraps mix with paper or plastics at home or on campus, moisture and oil ruin recyclable batches. Worse, batteries and electronics tossed into regular trash leak toxic heavy metals and spark landfill fires.
            </p>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-3 gap-4">
            {[
              {
                stat: 'Source Sorting',
                title: 'Prevents Contamination',
                desc: 'Separating wet from dry waste keeps paper, cardboard, and plastics clean enough for MRF recovery.',
              },
              {
                stat: 'E-Waste Hazard',
                title: 'Toxic Metals Isolated',
                desc: 'Phones, chargers, and batteries contain lead & lithium that require certified e-waste handling.',
              },
              {
                stat: 'Habit Loop',
                title: 'Information at Disposal',
                desc: 'Accessible guidance at the moment of throwing something away bridges the awareness-to-action gap.',
              },
            ].map((card) => (
              <div key={card.title} className="ecosort-card p-5 space-y-2">
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                  {card.stat}
                </span>
                <h3 className="font-bold text-base text-[#14231B]">{card.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How EcoSort Works */}
      <section className="bg-white border-y border-[#E2EAE3] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
              How EcoSort Works
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#14231B]">
              One Simple Flow for Every Waste Item
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WORKFLOW_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="p-6 rounded-2xl bg-[#F7F9F6] border border-[#E2EAE3] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-xl bg-[#1B4332] text-white flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#74C69D]" />
                    </span>
                    <span className="text-xs font-extrabold text-emerald-700/70">{item.step}</span>
                  </div>
                  <h3 className="font-bold text-lg text-[#14231B]">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4 Waste Categories Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
              Classification System
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#14231B]">
              4 Core Waste Categories
            </h2>
          </div>
          <Link
            to="/identify"
            className="text-sm font-semibold text-[#1B4332] hover:underline inline-flex items-center gap-1"
          >
            <span>Browse all searchable items</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {CATEGORIES_PREVIEW.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.title} className={`p-6 rounded-2xl border ${cat.color} space-y-3`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-5 h-5" />
                    <h3 className="font-bold text-lg">{cat.title}</h3>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${cat.badge}`}>
                    {cat.bin}
                  </span>
                </div>
                <p className="text-sm opacity-90">
                  <strong>Examples:</strong> {cat.examples}
                </p>
                <p className="text-xs opacity-80 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{cat.action}</span>
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits & 3R Tie-in */}
      <section className="bg-[#1B4332] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#74C69D]">
              Measurable Student & Community Benefits
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Empowering Smarter Decisions — Without Overpromising
            </h2>
            <p className="text-emerald-100/85 text-sm sm:text-base leading-relaxed">
              Software alone does not physically recycle waste. EcoSort acts as a decision-support companion that makes segregation instructions effortless, connects citizens to authorized drop-off points, and reinforces the 3R hierarchy (Reduce, Reuse, Recycle).
            </p>
          </div>
          <div className="lg:col-span-6 grid sm:grid-cols-2 gap-4">
            {[
              { icon: ShieldCheck, title: 'Safer E-Waste & Hazardous Handling', text: 'Clear warnings prevent batteries and medicines from entering regular bins.' },
              { icon: TrendingUp, title: 'Habit-Building Eco Score', text: 'Transparent points reward consistent sorting, composting, and e-waste drop-offs.' },
              { icon: MapPin, title: 'Actionable Local Centres', text: 'Filter by material type and open map directions in one click.' },
              { icon: BookOpenLinkPlaceholder, title: 'Built-in 3R Learning', text: 'Concise guides help students reduce single-use plastic before recycling is even needed.' },
            ].map((b) => (
              <div key={b.title} className="p-4 rounded-xl bg-white/10 border border-white/15 space-y-1.5">
                <h4 className="font-bold text-sm text-white">{b.title}</h4>
                <p className="text-xs text-emerald-100/80 leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14 text-center">
        <div className="ecosort-card p-8 sm:p-12 bg-gradient-to-br from-white to-[#EEF6EF] space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#14231B]">
            Ready to Sort Smarter?
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
            Search any household item, scan a photo with our AI prototype, or explore demo accounts to test the full EcoSort dashboard and admin analytics.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/identify"
              className="px-6 py-3 rounded-xl bg-[#1B4332] hover:bg-[#143326] text-white font-semibold text-sm transition"
            >
              Start Identifying Waste
            </Link>
            <Link
              to="/auth"
              className="px-6 py-3 rounded-xl border border-[#CBD9CD] bg-white hover:bg-slate-50 text-[#1B4332] font-semibold text-sm transition"
            >
              Sign In / Demo Accounts
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function BookOpenLinkPlaceholder() {
  return null;
}
