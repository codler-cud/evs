import { useEffect, useState } from 'react';
import {
  Award,
  BarChart3,
  BookOpen,
  Cpu,
  Edit3,
  MapPin,
  Plus,
  Recycle,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import CategoryBadge from '../components/CategoryBadge';
import { api } from '../services/api';

const PIE_COLORS = ['#15803D', '#0284C7', '#D97706', '#DC2626'];

const TABS = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'waste', label: 'Waste Items', icon: Recycle },
  { id: 'centres', label: 'Collection Centres', icon: MapPin },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'content', label: 'Awareness & Challenges', icon: BookOpen },
];

export default function AdminDashboardPage() {
  const [tab, setTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [categories, setCategories] = useState([]);
  const [wasteItems, setWasteItems] = useState([]);
  const [centres, setCentres] = useState([]);
  const [users, setUsers] = useState([]);
  const [articles, setArticles] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Form states for Waste Item CRUD
  const [editingWasteId, setEditingWasteId] = useState(null);
  const [wasteForm, setWasteForm] = useState({
    name: '',
    keywords: '',
    description: '',
    category_id: '',
    bin_type: 'Blue Bin — Dry / Recyclable',
    recyclable: true,
    disposal_method_text: 'Recycling / Dry Waste Collection',
    instructions: '',
    environmental_tip: '',
  });

  // Form states for Centre CRUD
  const [editingCentreId, setEditingCentreId] = useState(null);
  const [centreForm, setCentreForm] = useState({
    name: '',
    address: '',
    city: 'Pune',
    waste_types: 'E-waste,Plastic,Paper',
    contact_phone: '',
    contact_email: '',
    operating_hours: 'Mon–Sat: 9:00 AM – 6:00 PM',
    latitude: '18.5204',
    longitude: '73.8567',
  });

  // Form states for Article & Challenge
  const [articleForm, setArticleForm] = useState({
    title: '',
    summary: '',
    content: '',
    category_tag: 'Segregation Basics',
    reading_time_mins: 3,
  });
  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    challenge_type: 'count',
    target_count: 5,
    unit_label: 'items',
    points_reward: 50,
    category_tag: 'Recycling',
  });

  const refreshAll = async () => {
    setError('');
    try {
      const [an, cats, items, ctr, usr, art, ch] = await Promise.all([
        api.adminGetAnalytics(),
        api.getCategories(),
        api.searchWaste(),
        api.adminGetCentres(),
        api.adminGetUsers(),
        api.getAwarenessArticles(),
        api.adminGetChallenges(),
      ]);
      setAnalytics(an);
      setCategories(cats);
      setWasteItems(items);
      setCentres(ctr);
      setUsers(usr);
      setArticles(art);
      setChallenges(ch);
      if (!wasteForm.category_id && cats.length > 0) {
        setWasteForm((f) => ({ ...f, category_id: String(cats[0].id) }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load admin data.');
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // --- Waste CRUD ---
  const submitWaste = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...wasteForm, category_id: Number(wasteForm.category_id) };
      if (editingWasteId) {
        await api.adminUpdateWasteItem(editingWasteId, payload);
        notify('Waste item updated.');
      } else {
        await api.adminCreateWasteItem(payload);
        notify('Waste item added to catalog.');
      }
      setEditingWasteId(null);
      setWasteForm({
        name: '',
        keywords: '',
        description: '',
        category_id: String(categories[0]?.id || ''),
        bin_type: 'Blue Bin — Dry / Recyclable',
        recyclable: true,
        disposal_method_text: 'Recycling / Dry Waste Collection',
        instructions: '',
        environmental_tip: '',
      });
      await refreshAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const editWaste = (item) => {
    setEditingWasteId(item.id);
    setWasteForm({
      name: item.name,
      keywords: item.keywords,
      description: item.description,
      category_id: String(item.category_id),
      bin_type: item.bin_type,
      recyclable: item.recyclable,
      disposal_method_text: item.disposal_method_text,
      instructions: item.instructions,
      environmental_tip: item.environmental_tip,
    });
  };

  const deleteWaste = async (id) => {
    try {
      await api.adminDeleteWasteItem(id);
      notify('Waste item deleted.');
      await refreshAll();
    } catch (err) {
      setError(err.message);
    }
  };

  // --- Centre CRUD ---
  const submitCentre = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...centreForm,
        latitude: Number(centreForm.latitude),
        longitude: Number(centreForm.longitude),
      };
      if (editingCentreId) {
        await api.adminUpdateCentre(editingCentreId, payload);
        notify('Collection centre updated.');
      } else {
        await api.adminCreateCentre(payload);
        notify('Collection centre added.');
      }
      setEditingCentreId(null);
      setCentreForm({
        name: '',
        address: '',
        city: 'Pune',
        waste_types: 'E-waste,Plastic,Paper',
        contact_phone: '',
        contact_email: '',
        operating_hours: 'Mon–Sat: 9:00 AM – 6:00 PM',
        latitude: '18.5204',
        longitude: '73.8567',
      });
      await refreshAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const editCentre = (c) => {
    setEditingCentreId(c.id);
    setCentreForm({
      name: c.name,
      address: c.address,
      city: c.city,
      waste_types: c.waste_types,
      contact_phone: c.contact_phone,
      contact_email: c.contact_email || '',
      operating_hours: c.operating_hours,
      latitude: String(c.latitude),
      longitude: String(c.longitude),
    });
  };

  const deleteCentre = async (id) => {
    try {
      await api.adminDeleteCentre(id);
      notify('Collection centre deleted.');
      await refreshAll();
    } catch (err) {
      setError(err.message);
    }
  };

  // --- User Status ---
  const toggleUserActive = async (u) => {
    try {
      await api.adminUpdateUserStatus(u.id, !u.is_active);
      notify(`User ${u.name} ${!u.is_active ? 'activated' : 'deactivated'}.`);
      await refreshAll();
    } catch (err) {
      setError(err.message);
    }
  };

  // --- Articles & Challenges ---
  const submitArticle = async (e) => {
    e.preventDefault();
    try {
      await api.adminCreateArticle({
        ...articleForm,
        reading_time_mins: Number(articleForm.reading_time_mins),
      });
      setArticleForm({
        title: '',
        summary: '',
        content: '',
        category_tag: 'Segregation Basics',
        reading_time_mins: 3,
      });
      notify('Awareness article published.');
      await refreshAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const submitChallenge = async (e) => {
    e.preventDefault();
    try {
      await api.adminCreateChallenge({
        ...challengeForm,
        target_count: Number(challengeForm.target_count),
        points_reward: Number(challengeForm.points_reward),
      });
      setChallengeForm({
        title: '',
        description: '',
        challenge_type: 'count',
        target_count: 5,
        unit_label: 'items',
        points_reward: 50,
        category_tag: 'Recycling',
      });
      notify('Challenge created.');
      await refreshAll();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Protected Admin Console</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#14231B]">EcoSort Admin Dashboard</h1>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E2EAE3] pb-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                tab === t.id
                  ? 'bg-[#1B4332] text-white'
                  : 'bg-white text-slate-700 border border-[#E2EAE3] hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold">
          {toast}
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      {/* TAB 1: ANALYTICS */}
      {tab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="ecosort-card p-5">
              <p className="text-xs font-semibold text-slate-500">Total Users</p>
              <p className="text-3xl font-extrabold text-[#14231B] mt-1">{analytics.total_users}</p>
              <p className="text-xs text-emerald-700 mt-1">{analytics.active_users} active</p>
            </div>
            <div className="ecosort-card p-5">
              <p className="text-xs font-semibold text-slate-500">Total Waste Records</p>
              <p className="text-3xl font-extrabold text-[#14231B] mt-1">
                {analytics.total_waste_records}
              </p>
              <p className="text-xs text-slate-500 mt-1">Logged user disposals</p>
            </div>
            <div className="ecosort-card p-5">
              <p className="text-xs font-semibold text-slate-500">Total Recycling Actions</p>
              <p className="text-3xl font-extrabold text-sky-700 mt-1">
                {analytics.total_recycling_actions}
              </p>
              <p className="text-xs text-slate-500 mt-1">Dry recycling logs</p>
            </div>
            <div className="ecosort-card p-5">
              <p className="text-xs font-semibold text-slate-500">Total E-Waste Records</p>
              <p className="text-3xl font-extrabold text-amber-700 mt-1">
                {analytics.total_ewaste_records}
              </p>
              <p className="text-xs text-slate-500 mt-1">Safe e-waste disposals</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Most Searched Waste Items */}
            <div className="ecosort-card p-6 space-y-4">
              <h2 className="font-bold text-base text-[#14231B]">Most Searched Waste Items</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.most_searched_items} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5ECE6" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1B4332" radius={[6, 6, 0, 0]} name="Searches" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Distribution Pie */}
            <div className="ecosort-card p-6 space-y-4">
              <h2 className="font-bold text-base text-[#14231B]">Recorded Actions by Waste Category</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.category_distribution}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={82}
                      label={({ label, value }) => `${label.split(' ')[0]} (${value})`}
                    >
                      {analytics.category_distribution.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Disposal Actions */}
            <div className="ecosort-card p-6 space-y-4">
              <h2 className="font-bold text-base text-[#14231B]">Most Frequent Disposal Actions</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.top_disposal_actions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5ECE6" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2D6A4F" radius={[6, 6, 0, 0]} name="Records" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Challenge Participation */}
            <div className="ecosort-card p-6 space-y-4">
              <h2 className="font-bold text-base text-[#14231B]">Challenge Participation</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.challenge_participation} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5ECE6" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="label" type="category" width={140} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#D97706" radius={[0, 6, 6, 0]} name="Participants" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WASTE MANAGEMENT */}
      {tab === 'waste' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={submitWaste} className="lg:col-span-5 ecosort-card p-6 space-y-3.5">
            <h2 className="font-bold text-lg text-[#14231B]">
              {editingWasteId ? 'Edit Waste Item' : 'Add New Waste Item'}
            </h2>
            <input
              type="text"
              required
              placeholder="Item Name (e.g., Milk Packet)"
              value={wasteForm.name}
              onChange={(e) => setWasteForm({ ...wasteForm, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm"
            />
            <input
              type="text"
              placeholder="Search Keywords (comma or space separated)"
              value={wasteForm.keywords}
              onChange={(e) => setWasteForm({ ...wasteForm, keywords: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm"
            />
            <select
              value={wasteForm.category_id}
              onChange={(e) => setWasteForm({ ...wasteForm, category_id: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              placeholder="Bin Type (e.g., Blue Bin — Dry / Recyclable)"
              value={wasteForm.bin_type}
              onChange={(e) => setWasteForm({ ...wasteForm, bin_type: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm"
            />
            <input
              type="text"
              required
              placeholder="Disposal Method (e.g., Dry Recycling)"
              value={wasteForm.disposal_method_text}
              onChange={(e) => setWasteForm({ ...wasteForm, disposal_method_text: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm"
            />
            <textarea
              required
              rows={2}
              placeholder="Short item description"
              value={wasteForm.description}
              onChange={(e) => setWasteForm({ ...wasteForm, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm"
            />
            <textarea
              required
              rows={3}
              placeholder="Instructions (one step per line)"
              value={wasteForm.instructions}
              onChange={(e) => setWasteForm({ ...wasteForm, instructions: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm"
            />
            <input
              type="text"
              required
              placeholder="Environmental Tip"
              value={wasteForm.environmental_tip}
              onChange={(e) => setWasteForm({ ...wasteForm, environmental_tip: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={wasteForm.recyclable}
                onChange={(e) => setWasteForm({ ...wasteForm, recyclable: e.target.checked })}
              />
              <span>Recyclable / Recoverable</span>
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#1B4332] text-white font-semibold text-sm cursor-pointer"
              >
                {editingWasteId ? 'Save Changes' : 'Add Waste Item'}
              </button>
              {editingWasteId && (
                <button
                  type="button"
                  onClick={() => setEditingWasteId(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-7 ecosort-card p-6 space-y-3 max-h-[680px] overflow-y-auto">
            <h2 className="font-bold text-lg text-[#14231B]">
              Waste Database ({wasteItems.length} items)
            </h2>
            <div className="divide-y divide-slate-100">
              {wasteItems.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-[#14231B]">{item.name}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <CategoryBadge
                        slug={item.category?.slug}
                        name={item.category?.name}
                        size="sm"
                      />
                      <span className="text-xs text-slate-500">Searches: {item.search_count}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => editWaste(item)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteWaste(item.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COLLECTION CENTRES */}
      {tab === 'centres' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={submitCentre} className="lg:col-span-5 ecosort-card p-6 space-y-3">
            <h2 className="font-bold text-lg text-[#14231B]">
              {editingCentreId ? 'Edit Collection Centre' : 'Add Collection Centre'}
            </h2>
            <input
              type="text"
              required
              placeholder="Centre Name"
              value={centreForm.name}
              onChange={(e) => setCentreForm({ ...centreForm, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm"
            />
            <input
              type="text"
              required
              placeholder="Address"
              value={centreForm.address}
              onChange={(e) => setCentreForm({ ...centreForm, address: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="City"
                value={centreForm.city}
                onChange={(e) => setCentreForm({ ...centreForm, city: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm"
              />
              <input
                type="text"
                required
                placeholder="Contact Phone"
                value={centreForm.contact_phone}
                onChange={(e) => setCentreForm({ ...centreForm, contact_phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm"
              />
            </div>
            <input
              type="text"
              required
              placeholder="Accepted Waste Types (comma-separated)"
              value={centreForm.waste_types}
              onChange={(e) => setCentreForm({ ...centreForm, waste_types: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm"
            />
            <input
              type="text"
              required
              placeholder="Operating Hours"
              value={centreForm.operating_hours}
              onChange={(e) => setCentreForm({ ...centreForm, operating_hours: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="any"
                required
                placeholder="Latitude"
                value={centreForm.latitude}
                onChange={(e) => setCentreForm({ ...centreForm, latitude: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm"
              />
              <input
                type="number"
                step="any"
                required
                placeholder="Longitude"
                value={centreForm.longitude}
                onChange={(e) => setCentreForm({ ...centreForm, longitude: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#1B4332] text-white font-semibold text-sm cursor-pointer"
            >
              {editingCentreId ? 'Update Centre' : 'Add Centre'}
            </button>
          </form>

          <div className="lg:col-span-7 ecosort-card p-6 space-y-3 max-h-[650px] overflow-y-auto">
            <h2 className="font-bold text-lg text-[#14231B]">
              Registered Centres ({centres.length})
            </h2>
            <div className="divide-y divide-slate-100">
              {centres.map((c) => (
                <div key={c.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm text-[#14231B]">{c.name}</p>
                    <p className="text-xs text-slate-600">{c.address}, {c.city}</p>
                    <p className="text-xs text-emerald-800 mt-0.5">{c.waste_types}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => editCentre(c)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCentre(c.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: USERS */}
      {tab === 'users' && (
        <div className="ecosort-card p-6 overflow-x-auto">
          <h2 className="font-bold text-lg text-[#14231B] mb-4">Registered Users ({users.length})</h2>
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 pr-4">User</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4">Records</th>
                <th className="py-3 pr-4">Eco Score</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-[#14231B]">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{u.records_count}</td>
                  <td className="py-3 pr-4 font-bold text-emerald-800">{u.eco_score}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        u.is_active
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => toggleUserActive(u)}
                      className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: AWARENESS & CHALLENGES */}
      {tab === 'content' && (
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* Articles */}
          <div className="ecosort-card p-6 space-y-4">
            <h2 className="font-bold text-lg text-[#14231B] flex items-center gap-2">
              <Plus className="w-4 h-4" /> Publish Awareness Article
            </h2>
            <form onSubmit={submitArticle} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Article Title"
                value={articleForm.title}
                onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm"
              />
              <input
                type="text"
                required
                placeholder="Category Tag (e.g., E-Waste, Composting)"
                value={articleForm.category_tag}
                onChange={(e) => setArticleForm({ ...articleForm, category_tag: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm"
              />
              <textarea
                required
                rows={2}
                placeholder="Short Summary"
                value={articleForm.summary}
                onChange={(e) => setArticleForm({ ...articleForm, summary: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm"
              />
              <textarea
                required
                rows={3}
                placeholder="Full Article Content"
                value={articleForm.content}
                onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#1B4332] text-white font-semibold text-sm cursor-pointer"
              >
                Add Article
              </button>
            </form>

            <div className="divide-y divide-slate-100 pt-2">
              {articles.map((a) => (
                <div key={a.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-[#14231B]">{a.title}</p>
                    <p className="text-xs text-slate-500">{a.category_tag}</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await api.adminDeleteArticle(a.id);
                      refreshAll();
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Challenges */}
          <div className="ecosort-card p-6 space-y-4">
            <h2 className="font-bold text-lg text-[#14231B] flex items-center gap-2">
              <Award className="w-4 h-4" /> Create Challenge
            </h2>
            <form onSubmit={submitChallenge} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Challenge Title"
                value={challengeForm.title}
                onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm"
              />
              <textarea
                required
                rows={2}
                placeholder="Challenge Description"
                value={challengeForm.description}
                onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D4E0D5] text-sm"
              />
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={challengeForm.challenge_type}
                  onChange={(e) =>
                    setChallengeForm({ ...challengeForm, challenge_type: e.target.value })
                  }
                  className="px-3 py-2 rounded-xl border border-[#D4E0D5] text-sm bg-white"
                >
                  <option value="count">Count</option>
                  <option value="daily">Daily</option>
                </select>
                <input
                  type="number"
                  min={1}
                  placeholder="Target"
                  value={challengeForm.target_count}
                  onChange={(e) =>
                    setChallengeForm({ ...challengeForm, target_count: e.target.value })
                  }
                  className="px-3 py-2 rounded-xl border border-[#D4E0D5] text-sm"
                />
                <input
                  type="number"
                  min={5}
                  placeholder="Points"
                  value={challengeForm.points_reward}
                  onChange={(e) =>
                    setChallengeForm({ ...challengeForm, points_reward: e.target.value })
                  }
                  className="px-3 py-2 rounded-xl border border-[#D4E0D5] text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#1B4332] text-white font-semibold text-sm cursor-pointer"
              >
                Create Challenge
              </button>
            </form>

            <div className="divide-y divide-slate-100 pt-2">
              {challenges.map((ch) => (
                <div key={ch.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-[#14231B]">{ch.title}</p>
                    <p className="text-xs text-slate-500">
                      {ch.participant_count} participant(s) • +{ch.points_reward} pts
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await api.adminDeleteChallenge(ch.id);
                      refreshAll();
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
