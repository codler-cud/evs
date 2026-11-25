import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Clock,
  Compass,
  MinusCircle,
  Recycle,
  RefreshCw,
  X,
} from 'lucide-react';
import { api } from '../services/api';

const THREE_R_CARDS = [
  {
    title: 'Reduce',
    subtitle: 'Generate less waste at the source',
    icon: MinusCircle,
    color: 'border-emerald-200 bg-emerald-50/70 text-emerald-950',
    points: 'Priority #1',
    desc: 'Prevention has the highest environmental payoff. Avoid unnecessary single-use bottles, plastic cutlery, and excess packaging.',
    ecosortLink: '/challenges',
    ecosortCta: 'Try "Avoid Single-Use Plastic" Challenge',
  },
  {
    title: 'Reuse',
    subtitle: 'Use products again before discarding',
    icon: RefreshCw,
    color: 'border-sky-200 bg-sky-50/70 text-sky-950',
    points: 'Priority #2',
    desc: 'Refill glass jars, repair electronics when viable, donate wearable clothes, and repurpose sturdy cardboard boxes.',
    ecosortLink: '/activity',
    ecosortCta: 'Log a "Reused" Action in My Activity',
  },
  {
    title: 'Recycle',
    subtitle: 'Process sorted waste into new material',
    icon: Recycle,
    color: 'border-amber-200 bg-amber-50/70 text-amber-950',
    points: 'Priority #3',
    desc: 'When items reach end-of-life, keep dry recyclables clean, compost organics, and route e-waste to authorized collection centres.',
    ecosortLink: '/identify',
    ecosortCta: 'Look Up Proper Recycling Rules',
  },
];

export default function LearnPage() {
  const [articles, setArticles] = useState([]);
  const [selectedTag, setSelectedTag] = useState('all');
  const [activeArticle, setActiveArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getAwarenessArticles(selectedTag)
      .then(setArticles)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedTag]);

  const tags = ['all', 'Segregation Basics', 'Plastic & Recycling', 'E-Waste', 'Composting', '3R Principle'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-12">
      {/* Page Header */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
          Environmental Awareness & 3R Hub
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#14231B]">
          Learn Waste Segregation & the 3Rs
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
          Concise, student-friendly guides explaining why sorting matters, how recycling works, how to compost, and how EcoSort fits into the Reduce–Reuse–Recycle hierarchy.
        </p>
      </div>

      {/* Dedicated 3R Section */}
      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <Recycle className="w-5 h-5 text-[#1B4332]" />
          <h2 className="text-2xl font-bold text-[#14231B]">The 3R Principle Connected to EcoSort</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {THREE_R_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className={`p-6 rounded-2xl border ${card.color} flex flex-col justify-between space-y-4`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/80">
                      {card.points}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold">{card.title}</h3>
                    <p className="text-xs font-semibold opacity-80">{card.subtitle}</p>
                  </div>
                  <p className="text-sm opacity-90 leading-relaxed">{card.desc}</p>
                </div>

                <Link
                  to={card.ecosortLink}
                  className="inline-flex items-center gap-1.5 text-xs font-bold underline underline-offset-4 pt-2"
                >
                  <span>{card.ecosortCta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Awareness Articles Section */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#1B4332]" />
            <h2 className="text-2xl font-bold text-[#14231B]">Awareness Guides</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-[#1B4332] text-white border-[#1B4332]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tag === 'all' ? 'All Topics' : tag}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="ecosort-card p-8 text-center text-sm text-slate-500">
            Loading articles...
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((art) => (
              <article
                key={art.id}
                onClick={() => setActiveArticle(art)}
                className="ecosort-card ecosort-card-hover p-6 flex flex-col justify-between space-y-4 cursor-pointer"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {art.category_tag}
                    </span>
                    <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {art.reading_time_mins} min read
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-[#14231B] leading-snug">{art.title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                    {art.summary}
                  </p>
                </div>

                <span className="text-xs font-bold text-[#1B4332] inline-flex items-center gap-1">
                  Read full guide <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Honest Project Limitations & Future Scope */}
      <section id="limitations" className="grid md:grid-cols-2 gap-6 pt-4">
        <div className="ecosort-card p-6 space-y-3 border-amber-200 bg-amber-50/40">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-lg font-bold">Project Scope & Honest Limitations</h2>
          </div>
          <ul className="text-sm text-slate-700 space-y-2 list-disc pl-5">
            <li>AI photo classification is a lightweight computer-vision prototype and may not recognize every item accurately without a larger labeled dataset.</li>
            <li>Collection centre listings rely on registered sample/admin database records rather than live municipal feeds.</li>
            <li>Eco Score values are motivational project assumptions, not audited carbon-offset measurements.</li>
            <li>As a software platform, EcoSort improves disposal decisions and awareness; physical collection depends on users and municipal/recycling partners.</li>
          </ul>
        </div>

        <div className="ecosort-card p-6 space-y-3 bg-[#F4F8F4]">
          <div className="flex items-center gap-2 text-[#1B4332]">
            <Compass className="w-5 h-5" />
            <h2 className="text-lg font-bold">Future Enhancements</h2>
          </div>
          <ul className="text-sm text-slate-700 space-y-2 list-disc pl-5">
            <li>Fine-tuned deep learning waste dataset (TrashNet / TACO) replacing the modular AI classifier.</li>
            <li>Multilingual UI support and municipal waste-collection schedule APIs.</li>
            <li>QR-code verification at campus recycling bins and scheduled e-waste pickup requests.</li>
            <li>Community/hostel leaderboards and IoT smart-bin fill-level integration.</li>
          </ul>
        </div>
      </section>

      {/* Article Reader Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {activeArticle.category_tag}
              </span>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-2xl font-extrabold text-[#14231B]">{activeArticle.title}</h2>
            <p className="text-sm text-slate-500">{activeArticle.reading_time_mins} minute read</p>
            <div className="space-y-3 text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line border-t border-slate-100 pt-4">
              {activeArticle.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
