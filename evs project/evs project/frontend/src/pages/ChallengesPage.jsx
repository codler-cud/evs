import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Check, CheckCircle2, Flame, Plus, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

export default function ChallengesPage() {
  const { isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const list = await api.getChallenges();
      setChallenges(list);
    } catch (err) {
      setError(err.message || 'Could not load challenges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, [isAuthenticated]);

  const handleJoin = async (id) => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: '/challenges' } });
      return;
    }
    setBusyId(id);
    setError('');
    try {
      await api.joinChallenge(id);
      await loadChallenges();
    } catch (err) {
      setError(err.message || 'Failed to join challenge.');
    } finally {
      setBusyId(null);
    }
  };

  const handleStep = async (id, payload) => {
    setBusyId(id);
    setError('');
    try {
      await api.updateChallengeProgress(id, payload);
      await Promise.all([loadChallenges(), refreshUser()]);
    } catch (err) {
      setError(err.message || 'Failed to update progress.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
          Habit-Building Gamification
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#14231B]">
          Waste Segregation Challenges
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
          Build consistent segregation habits with 7-day trackers and targeted recycling goals. Completing challenges awards bonus Eco Score points.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="ecosort-card p-10 text-center text-sm text-slate-500">
          Loading active challenges...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {challenges.map((ch) => {
            const pct = Math.min(100, Math.round((ch.current_count / ch.target_count) * 100));
            const isCompleted = ch.status === 'completed';

            return (
              <div key={ch.id} className="ecosort-card p-6 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {ch.category_tag}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                      <Award className="w-3.5 h-3.5" />
                      +{ch.points_reward} Eco Score
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-[#14231B]">{ch.title}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{ch.description}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {ch.participant_count} participant(s)
                    </span>
                    <span>
                      Goal: {ch.target_count} {ch.unit_label}
                    </span>
                  </div>
                </div>

                {/* Progress / Interactive Tracker */}
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  {ch.joined ? (
                    <>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>
                            {ch.current_count} / {ch.target_count} {ch.unit_label}
                          </span>
                          <span className={isCompleted ? 'text-emerald-700' : ''}>
                            {isCompleted ? 'Completed!' : `${pct}%`}
                          </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isCompleted ? 'bg-emerald-600' : 'bg-[#2D6A4F]'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {ch.challenge_type === 'daily' ? (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-slate-500">
                            Click each day to mark complete:
                          </p>
                          <div className="grid grid-cols-7 gap-1.5">
                            {Array.from({ length: ch.target_count }, (_, i) => i + 1).map((day) => {
                              const done = ch.completed_steps.includes(day);
                              return (
                                <button
                                  key={day}
                                  type="button"
                                  disabled={busyId === ch.id}
                                  onClick={() => handleStep(ch.id, { step_number: day })}
                                  className={`py-2 rounded-lg text-xs font-bold border flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                                    done
                                      ? 'bg-[#1B4332] text-white border-[#1B4332]'
                                      : 'bg-[#F7F9F6] text-slate-700 border-[#DCE7DD] hover:border-emerald-500'
                                  }`}
                                >
                                  <span>D{day}</span>
                                  {done && <Check className="w-3 h-3" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                              <CheckCircle2 className="w-4 h-4" />
                              Reward Claimed (+{ch.points_reward} pts)
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={busyId === ch.id}
                              onClick={() => handleStep(ch.id, { increment: 1 })}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-semibold transition cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Log +1 Progress</span>
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === ch.id}
                      onClick={() => handleJoin(ch.id)}
                      className="w-full py-3 rounded-xl bg-[#1B4332] hover:bg-[#143326] text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Flame className="w-4 h-4 text-[#74C69D]" />
                      <span>Join Challenge</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
