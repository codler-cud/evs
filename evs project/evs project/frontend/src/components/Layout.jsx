import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Award,
  BookOpen,
  Camera,
  ClipboardCheck,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Sprout,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const PRIMARY_NAV = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/identify', label: 'Identify Waste', icon: Search },
  { to: '/scan', label: 'Scan Waste', icon: Camera },
  { to: '/centres', label: 'Recycling Centres', icon: MapPin },
  { to: '/activity', label: 'My Activity', icon: ClipboardCheck },
  { to: '/challenges', label: 'Challenges', icon: Award },
  { to: '/learn', label: 'Learn', icon: BookOpen },
];

export default function Layout({ children }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9F6] text-[#14231B]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2EAE3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="w-9 h-9 rounded-xl bg-[#1B4332] text-white flex items-center justify-center shadow-sm">
              <Sprout className="w-5 h-5 text-[#74C69D]" />
            </span>
            <div className="leading-tight">
              <span className="font-extrabold text-lg tracking-tight text-[#1B4332] block">
                EcoSort
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-700 hidden sm:block">
                Smart Waste Segregation
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {PRIMARY_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-50 text-[#1B4332] font-semibold'
                      : 'text-slate-600 hover:text-[#1B4332] hover:bg-slate-50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Auth & Dashboard Actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#1B4332] bg-emerald-50 hover:bg-emerald-100 transition"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-amber-900 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#DCE6DD] bg-white hover:bg-slate-50 text-sm font-medium"
                >
                  <User className="w-4 h-4 text-[#1B4332]" />
                  <span className="hidden md:inline max-w-[110px] truncate">{user.name}</span>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900">
                    {user.eco_score}
                  </span>
                </Link>
              </>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B4332] hover:bg-[#143326] text-white text-sm font-semibold transition shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E2EAE3] bg-white px-4 py-4 space-y-1">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                      isActive ? 'bg-emerald-50 text-[#1B4332] font-semibold' : 'text-slate-700'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            {isAuthenticated && (
              <>
                <NavLink
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </NavLink>
                {isAdmin && (
                  <NavLink
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-amber-900 bg-amber-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </NavLink>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 lg:pb-10">{children}</main>

      {/* Footer */}
      <footer className="bg-[#142B20] text-emerald-100/80 border-t border-emerald-950 mb-14 lg:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid md:grid-cols-4 gap-8 text-sm">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <Sprout className="w-5 h-5 text-[#74C69D]" />
              <span>EcoSort</span>
            </div>
            <p className="text-emerald-100/75 max-w-md leading-relaxed">
              Sort Smart. Recycle Right. Protect Our Environment. An Environmental Science software platform helping students and communities make better waste segregation decisions at the point of disposal.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/identify" className="hover:text-white">Identify Waste</Link></li>
              <li><Link to="/scan" className="hover:text-white">AI Scan Waste</Link></li>
              <li><Link to="/centres" className="hover:text-white">Recycling Centres</Link></li>
              <li><Link to="/challenges" className="hover:text-white">Challenges</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Resources</h4>
            <ul className="space-y-2">
              <li><Link to="/learn" className="hover:text-white">3R Principle & Guides</Link></li>
              <li><Link to="/learn#limitations" className="hover:text-white">Scope & Limitations</Link></li>
              <li><Link to="/dashboard" className="hover:text-white">My Eco Dashboard</Link></li>
              <li><Link to="/admin" className="hover:text-white">Admin Console</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-emerald-900/60 py-4 px-4 sm:px-6 text-xs text-emerald-200/60 text-center">
          EcoSort — Environmental Science Project Prototype. Software guidance & awareness platform; impact scores are project-level estimates.
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2EAE3] grid grid-cols-5 h-16">
        {[
          { to: '/', label: 'Home', icon: Home },
          { to: '/identify', label: 'Identify', icon: Search },
          { to: '/scan', label: 'Scan', icon: Camera },
          { to: '/centres', label: 'Centres', icon: MapPin },
          { to: isAuthenticated ? '/dashboard' : '/auth', label: isAuthenticated ? 'Dashboard' : 'Sign In', icon: LayoutDashboard },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                  isActive ? 'text-[#1B4332] font-semibold' : 'text-slate-500'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
