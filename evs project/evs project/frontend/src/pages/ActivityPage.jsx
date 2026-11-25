import { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardCheck, PlusCircle, Trash2 } from 'lucide-react';
import CategoryBadge from '../components/CategoryBadge';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

const ACTION_TYPES = [
  'Recycled',
  'Composted',
  'E-Waste Disposal',
  'Hazardous Drop-off',
  'Reused',
];

export default function ActivityPage() {
  const { refreshUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [wasteItems, setWasteItems] = useState([]);
  const [records, setRecords] = useState([]);
  const [filterCat, setFilterCat] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemName, setItemName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [actionType, setActionType] = useState('Recycled');
  const [quantity, setQuantity] = useState(1);
  const [disposedDate, setDisposedDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const loadData = async (cat = filterCat) => {
    setLoading(true);
    try {
      const [cats, items, recs] = await Promise.all([
        api.getCategories(),
        api.searchWaste(),
        api.getWasteRecords(cat),
      ]);
      setCategories(cats);
      setWasteItems(items);
      setRecords(recs);
      if (!categoryId && cats.length > 0) {
        setCategoryId(String(cats[1]?.id || cats[0].id));
      }
    } catch (err) {
      setError(err.message || 'Could not load disposal records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(filterCat);
  }, [filterCat]);

  const handleQuickItemPick = (idStr) => {
    setSelectedItemId(idStr);
    if (!idStr) return;
    const item = wasteItems.find((w) => w.id === Number(idStr));
    if (item) {
      setItemName(item.name);
      setCategoryId(String(item.category_id));
      const slug = item.category?.slug;
      if (slug === 'wet-organic') setActionType('Composted');
      else if (slug === 'e-waste') setActionType('E-Waste Disposal');
      else if (slug === 'hazardous-special') setActionType('Hazardous Drop-off');
      else setActionType('Recycled');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const created = await api.createWasteRecord({
        waste_item_id: selectedItemId ? Number(selectedItemId) : null,
        item_name: itemName,
        category_id: Number(categoryId),
        action_type: actionType,
        quantity: Number(quantity),
        disposed_date: disposedDate,
        notes: notes || null,
      });
      setSuccess(`Logged "${created.item_name}" (+${created.points_earned} Eco Score)!`);
      setItemName('');
      setSelectedItemId('');
      setNotes('');
      setQuantity(1);
      await Promise.all([loadData(filterCat), refreshUser()]);
    } catch (err) {
      setError(err.message || 'Failed to record disposal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      await api.deleteWasteRecord(id);
      await Promise.all([loadData(filterCat), refreshUser()]);
    } catch (err) {
      setError(err.message || 'Could not delete record.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
          Waste Disposal Tracker
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#14231B]">My Activity</h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
          Record every item you recycle, compost, reuse, or take to an authorized e-waste / hazardous centre to track your personal Eco Score.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Log New Activity Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 ecosort-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <PlusCircle className="w-5 h-5 text-[#1B4332]" />
            <h2 className="font-bold text-lg text-[#14231B]">Record Responsible Disposal</h2>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quick-Fill from Catalog <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => handleQuickItemPick(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#D4E0D5] bg-white text-sm"
            >
              <option value="">-- Choose a catalog item or enter custom below --</option>
              {wasteItems.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.category?.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name</label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g., Old Mobile Phone, Plastic Bottle..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4E0D5] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D4E0D5] bg-white text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Action</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D4E0D5] bg-white text-sm"
              >
                {ACTION_TYPES.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                max={100}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4E0D5] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={disposedDate}
                onChange={(e) => setDisposedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4E0D5] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Dropped at Sahyadri E-Waste Hub"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4E0D5] text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#1B4332] hover:bg-[#143326] text-white font-semibold text-sm transition cursor-pointer"
          >
            {submitting ? 'Saving Record...' : 'Save Disposal Activity'}
          </button>
        </form>

        {/* Activity History */}
        <div className="lg:col-span-7 ecosort-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-[#1B4332]" />
              <h2 className="font-bold text-lg text-[#14231B]">Disposal History</h2>
            </div>

            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500 py-8 text-center">Loading history...</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              No records in this category yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {records.map((rec) => (
                <div key={rec.id} className="py-4 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-[#14231B]">{rec.item_name}</span>
                      <span className="text-xs font-semibold text-emerald-800">
                        • {rec.action_type}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CategoryBadge
                        slug={rec.category?.slug}
                        name={rec.category?.name}
                        size="sm"
                      />
                      <span className="text-xs text-slate-500">
                        Qty: {rec.quantity} • {rec.disposed_date}
                      </span>
                    </div>
                    {rec.notes && <p className="text-xs text-slate-500 pt-0.5">{rec.notes}</p>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900">
                      +{rec.points_earned}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(rec.id)}
                      title="Delete record"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
