import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Camera,
  CheckCircle2,
  Cpu,
  Info,
  Leaf,
  MapPin,
  PlusCircle,
  Recycle,
  Search,
  Sparkles,
} from 'lucide-react';
import CategoryBadge from '../components/CategoryBadge';
import { api } from '../services/api';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showScoringInfo, setShowScoringInfo] = useState(false);

  useEffect(() => {
    api
      .getDashboard()
      .then(setData)
      .catch((err) => setError(err.message || 'Could not load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center text-slate-600 text-sm">
        Loading your EcoSort dashboard...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="ecosort-card p-6 bg-rose-50 border-rose-200 text-rose-800 text-sm">
          {error || 'Dashboard unavailable.'}
        </div>
      </div>
    );
  }

  const level = data.eco_level;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-7">
      {/* Welcome Banner + Eco Score */}
      <div className="ecosort-card p-6 sm:p-8 bg-gradient-to-br from-[#1B4332] to-[#265A43] text-white border-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#95D5B2]">
              Personal Environmental Dashboard
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              Welcome, {data.user_name}
            </h1>
            <p className="text-sm text-emerald-100/85 max-w-xl">
              {data.estimated_diversion_note}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/10 border border-white/15 min-w-[260px] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
                Eco Score
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#74C69D] text-[#102A1E] text-xs font-bold">
                {level.level_name}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold">{data.eco_score}</span>
              {level.next_level_threshold && (
                <span className="text-xs text-emerald-100/80">
                  / {level.next_level_threshold} pts to {level.next_level_name}
                </span>
              )}
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#74C69D] transition-all"
                style={{ width: `${level.progress_percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="ecosort-card p-5 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Recycle className="w-5 h-5" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#14231B]">
            {data.recyclable_items}
          </p>
          <p className="text-xs sm:text-sm font-medium text-slate-600">Recyclable Items</p>
        </div>

        <div className="ecosort-card p-5 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#14231B]">
            {data.ewaste_items}
          </p>
          <p className="text-xs sm:text-sm font-medium text-slate-600">E-Waste Items</p>
        </div>

        <div className="ecosort-card p-5 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Leaf className="w-5 h-5" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#14231B]">
            {data.wet_composted_items}
          </p>
          <p className="text-xs sm:text-sm font-medium text-slate-600">Organic Composted</p>
        </div>

        <div className="ecosort-card p-5 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#EEF5EF] text-[#1B4332] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#14231B]">
            {data.total_items_disposed}
          </p>
          <p className="text-xs sm:text-sm font-medium text-slate-600">Total Items Logged</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link
          to="/identify"
          className="ecosort-card ecosort-card-hover p-4 flex items-center gap-3 font-semibold text-sm text-[#1B4332]"
        >
          <span className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5" />
          </span>
          <span>Identify Waste</span>
        </Link>

        <Link
          to="/scan"
          className="ecosort-card ecosort-card-hover p-4 flex items-center gap-3 font-semibold text-sm text-[#1B4332]"
        >
          <span className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5" />
          </span>
          <span>Scan Waste Photo</span>
        </Link>

        <Link
          to="/centres"
          className="ecosort-card ecosort-card-hover p-4 flex items-center gap-3 font-semibold text-sm text-[#1B4332]"
        >
          <span className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </span>
          <span>Find Collection Centre</span>
        </Link>

        <Link
          to="/activity"
          className="ecosort-card ecosort-card-hover p-4 flex items-center gap-3 font-semibold text-sm text-white bg-[#1B4332] border-[#1B4332]"
        >
          <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <PlusCircle className="w-5 h-5" />
          </span>
          <span>Record Disposal</span>
        </Link>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Recent Activities */}
        <div className="lg:col-span-7 ecosort-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#14231B]">Recent Activities</h2>
            <Link to="/activity" className="text-xs font-semibold text-[#1B4332] hover:underline">
              View full log →
            </Link>
          </div>

          {data.recent_activities.length === 0 ? (
            <div className="p-6 rounded-xl bg-[#F7F9F6] text-center text-sm text-slate-600">
              No activities logged yet. Record your first disposal to start earning Eco Score!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recent_activities.map((rec) => (
                <div key={rec.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-[#14231B]">
                        {rec.item_name} — <span className="text-emerald-800">{rec.action_type}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <CategoryBadge
                          slug={rec.category?.slug}
                          name={rec.category?.name}
                          size="sm"
                        />
                        <span className="text-xs text-slate-500">
                          Qty: {rec.quantity} • {rec.disposed_date}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 shrink-0">
                    +{rec.points_earned} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Challenge & Scoring Transparency */}
        <div className="lg:col-span-5 space-y-5">
          <div className="ecosort-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-700" />
                <h2 className="text-lg font-bold text-[#14231B]">Current Challenge</h2>
              </div>
              <Link to="/challenges" className="text-xs font-semibold text-[#1B4332] hover:underline">
                All challenges →
              </Link>
            </div>

            {data.current_challenge ? (
              <div className="p-4 rounded-xl bg-[#F4F8F4] border border-[#DCE7DD] space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-[#14231B]">
                    {data.current_challenge.title}
                  </h3>
                  <span className="text-xs font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                    +{data.current_challenge.points_reward} pts
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>
                      Progress: {data.current_challenge.current_count} /{' '}
                      {data.current_challenge.target_count} {data.current_challenge.unit_label}
                    </span>
                    <span>
                      {Math.round(
                        (data.current_challenge.current_count /
                          data.current_challenge.target_count) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white border border-emerald-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#2D6A4F]"
                      style={{
                        width: `${Math.min(
                          100,
                          (data.current_challenge.current_count /
                            data.current_challenge.target_count) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 text-sm text-slate-600">
                You haven&apos;t joined a challenge yet.{' '}
                <Link to="/challenges" className="font-semibold text-[#1B4332] underline">
                  Join a 7-day challenge
                </Link>
              </div>
            )}
          </div>

          {/* Transparent Eco Score Rules */}
          <div className="ecosort-card p-6 space-y-3">
            <button
              type="button"
              onClick={() => setShowScoringInfo((v) => !v)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <span className="flex items-center gap-2 font-bold text-sm text-[#14231B]">
                <Info className="w-4 h-4 text-emerald-700" />
                <span>How Eco Score Is Calculated</span>
              </span>
              <span className="text-xs font-semibold text-emerald-700">
                {showScoringInfo ? 'Hide' : 'Show rules'}
              </span>
            </button>
            <p className="text-xs text-slate-500 leading-relaxed">{level.impact_disclaimer}</p>
            {showScoringInfo && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                {level.scoring_rules.map((rule) => (
                  <div
                    key={rule.action}
                    className="flex items-start justify-between gap-2 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{rule.action}</p>
                      <p className="text-slate-500">{rule.note}</p>
                    </div>
                    <span className="font-bold text-emerald-800 shrink-0">+{rule.points}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
