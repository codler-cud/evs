import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Search, X } from 'lucide-react';
import CategoryBadge from '../components/CategoryBadge';
import WasteItemDetailCard from '../components/WasteItemDetailCard';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

const QUICK_SEARCHES = [
  'Plastic Bottle',
  'Banana Peel',
  'Newspaper',
  'Glass Bottle',
  'Aluminium Can',
  'Battery',
  'Mobile Phone',
  'Charger',
  'Old Clothes',
  'Food Waste',
  'Medicine Strip',
];

function inferActionForCategory(slug) {
  if (slug === 'wet-organic') return 'Composted';
  if (slug === 'e-waste') return 'E-Waste Disposal';
  if (slug === 'hazardous-special') return 'Hazardous Drop-off';
  return 'Recycled';
}

export default function IdentifyWastePage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const [toast, setToast] = useState('');

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    const timer = setTimeout(async () => {
      try {
        const res = await api.searchWaste(query, selectedCategory);
        if (!active) return;
        setItems(res);
        if (res.length > 0 && (!selectedItem || !res.some((i) => i.id === selectedItem.id))) {
          setSelectedItem(res[0]);
        } else if (res.length === 0) {
          setSelectedItem(null);
        }
      } catch (err) {
        if (active) setError(err.message || 'Could not load waste items.');
      } finally {
        if (active) setLoading(false);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, selectedCategory]);

  const handleSelectItem = async (item) => {
    setSelectedItem(item);
    try {
      const updated = await api.getWasteItem(item.id, true);
      setSelectedItem(updated);
    } catch {
      // Keep local item if tracking fails
    }
  };

  const handleRecordDisposal = async (item) => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: '/identify' } });
      return;
    }
    setRecording(true);
    setToast('');
    try {
      const res = await api.createWasteRecord({
        waste_item_id: item.id,
        item_name: item.name,
        category_id: item.category_id,
        action_type: inferActionForCategory(item.category?.slug),
        quantity: 1,
        notes: `Logged from Identify Waste (${item.bin_type})`,
      });
      setToast(`Recorded "${res.item_name}" (+${res.points_earned} Eco Score)!`);
    } catch (err) {
      setError(err.message || 'Failed to record disposal.');
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
          Waste Search & Identification
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#14231B]">
          What Should I Do With My Waste?
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
          Search any household item or filter by category to see its bin color, recyclability, step-by-step preparation, and disposal pathway.
        </p>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="ecosort-card p-4 sm:p-5 space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search an item (e.g., Plastic Bottle, Banana Peel, Battery, Mobile Phone...)"
            className="w-full pl-12 pr-10 py-3 rounded-xl border border-[#D4E0D5] focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm sm:text-base bg-[#FBFDFB]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#1B4332] text-white border-[#1B4332]'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition cursor-pointer ${
                selectedCategory === cat.slug
                  ? 'bg-[#1B4332] text-white border-[#1B4332]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Quick-pick common items */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs font-medium text-slate-500 mr-1">Popular items:</span>
          {QUICK_SEARCHES.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setQuery(label);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#F2F6F3] hover:bg-emerald-100/70 text-[#1B4332] text-xs font-medium transition cursor-pointer"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <span>{toast}</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-xs font-bold underline cursor-pointer"
          >
            View Dashboard
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Split View */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Item List */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-700">
              {loading ? 'Searching database...' : `${items.length} matching item(s)`}
            </h2>
          </div>

          {!loading && items.length === 0 ? (
            <div className="ecosort-card p-6 text-center space-y-3">
              <p className="font-semibold text-slate-800">No waste item matched &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-600">
                Try a simpler keyword like &ldquo;plastic&rdquo;, &ldquo;battery&rdquo;, or &ldquo;food&rdquo;, or try scanning a photo with AI.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 rounded-lg bg-emerald-50 text-[#1B4332] text-xs font-semibold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {items.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    className={`w-full text-left p-4 rounded-2xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[#1B4332] ring-2 ring-emerald-600/20 shadow-sm'
                        : 'bg-white border-[#E2EAE3] hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="font-bold text-base text-[#14231B]">{item.name}</h3>
                        <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                      </div>
                      <CategoryBadge
                        slug={item.category?.slug}
                        name={item.category?.name?.split(' / ')[0]}
                        size="sm"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Item Detail */}
        <div className="lg:col-span-7">
          {selectedItem ? (
            <WasteItemDetailCard
              item={selectedItem}
              onRecordDisposal={handleRecordDisposal}
              recording={recording}
            />
          ) : (
            <div className="ecosort-card p-10 text-center text-slate-500 text-sm">
              Select a waste item from the list to view full segregation and disposal instructions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
