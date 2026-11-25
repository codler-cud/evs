import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, LogOut, MapPin, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function ProfilePage() {
  const { user, logout, updateProfile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [location, setLocation] = useState(user?.location || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await updateProfile({ name, location });
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Account Settings</p>
        <h1 className="text-3xl font-extrabold text-[#14231B]">My Profile</h1>
      </div>

      <div className="ecosort-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <span className="w-14 h-14 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center text-xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
            <div>
              <h2 className="text-xl font-bold text-[#14231B]">{user?.name}</h2>
              <p className="text-sm text-slate-600">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Eco Score: {user?.eco_score}
                </span>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Administrator
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-semibold transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {message && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D4E0D5] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Campus / Neighbourhood
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Pune Campus"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D4E0D5] text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#1B4332] hover:bg-[#143326] text-white font-semibold text-sm transition cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
