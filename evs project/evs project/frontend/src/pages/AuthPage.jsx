import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, KeyRound, Lock, Mail, MapPin, Sprout, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [locationText, setLocationText] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const loggedUser = await login(email, password);
        navigate(loggedUser.role === 'admin' && redirectTo === '/dashboard' ? '/admin' : redirectTo);
      } else {
        await register({ name, email, password, location: locationText || null });
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (demoEmail, demoPassword) => {
    setMode('login');
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 grid lg:grid-cols-12 gap-8 items-start">
      {/* Left Auth Card */}
      <div className="lg:col-span-7 ecosort-card p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-6">
          <span className="w-10 h-10 rounded-xl bg-[#1B4332] text-white flex items-center justify-center">
            <Sprout className="w-5 h-5 text-[#74C69D]" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-[#14231B]">
              {mode === 'login' ? 'Sign In to EcoSort' : 'Create Your EcoSort Account'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Track your responsible disposals, Eco Score, and challenges.
            </p>
          </div>
        </div>

        {/* Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#F1F5F2] mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              mode === 'login' ? 'bg-white text-[#1B4332] shadow-xs' : 'text-slate-600'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              mode === 'register' ? 'bg-white text-[#1B4332] shadow-xs' : 'text-slate-600'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Aarav Sharma"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D4E0D5] focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D4E0D5] focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Minimum 6 characters' : 'Enter your password'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D4E0D5] focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Campus / Neighbourhood <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="e.g., Pune Campus"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D4E0D5] focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#1B4332] hover:bg-[#143326] text-white font-semibold text-sm transition disabled:opacity-60 cursor-pointer"
          >
            {submitting
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>
      </div>

      {/* Right Demo Credentials Card for College Evaluators */}
      <div className="lg:col-span-5 space-y-4">
        <div className="ecosort-card p-6 bg-[#F2F7F3] border-emerald-200 space-y-4">
          <div className="flex items-center gap-2 text-[#1B4332]">
            <KeyRound className="w-5 h-5" />
            <h2 className="font-bold text-base">College Demo Accounts</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Seeded demo credentials are provided below for classroom demonstration. Passwords are stored securely with bcrypt hashing on the backend.
          </p>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white border border-[#DCE7DD] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Student User Demo
                </span>
                <button
                  type="button"
                  onClick={() => fillDemo('student@ecosort.demo', 'EcoSort@123')}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-[#1B4332] hover:bg-emerald-100 cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>
              <p className="text-xs text-slate-700 font-mono">Email: student@ecosort.demo</p>
              <p className="text-xs text-slate-700 font-mono">Pass: EcoSort@123</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Admin Evaluator Demo
                </span>
                <button
                  type="button"
                  onClick={() => fillDemo('admin@ecosort.demo', 'AdminEco@123')}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 hover:bg-amber-100 cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>
              <p className="text-xs text-slate-700 font-mono">Email: admin@ecosort.demo</p>
              <p className="text-xs text-slate-700 font-mono">Pass: AdminEco@123</p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-slate-600 pt-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              In production deployments, set <code>SEED_DEMO_DATA=false</code> in <code>.env</code> to disable demo accounts.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
