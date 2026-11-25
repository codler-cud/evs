import { CheckCircle2, Info, MapPin, PlusCircle, Sparkles, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import CategoryBadge, { getCategoryStyle } from './CategoryBadge';

function mapCategoryToCentreFilter(slug) {
  if (slug === 'e-waste') return 'E-waste';
  if (slug === 'hazardous-special') return 'Hazardous';
  if (slug === 'dry-recyclable') return 'General recycling';
  return 'all';
}

export default function WasteItemDetailCard({ item, onRecordDisposal, recording = false }) {
  if (!item) return null;

  const style = getCategoryStyle(item.category?.slug);
  const steps = (item.instructions || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="ecosort-card overflow-hidden">
      {/* Accent strip matching bin color */}
      <div className="h-2 w-full" style={{ backgroundColor: style.binHex }} />

      <div className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <CategoryBadge slug={item.category?.slug} name={item.category?.name} />
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  item.recyclable
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {item.recyclable ? 'Recyclable / Recoverable' : 'Non-Recyclable / Special Stream'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#14231B]">{item.name}</h2>
            <p className="text-slate-600 mt-1.5 text-sm sm:text-base">{item.description}</p>
          </div>
        </div>

        {/* Bin & Recommended Disposal Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl border ${style.bg} ${style.border}`}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              <Trash2 className="w-4 h-4" />
              <span>Recommended Bin</span>
            </div>
            <p className={`font-semibold text-base ${style.text}`}>{item.bin_type}</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              <Info className="w-4 h-4" />
              <span>Recommended Disposal Method</span>
            </div>
            <p className="font-semibold text-base text-slate-900">{item.disposal_method_text}</p>
          </div>
        </div>

        {/* Step-by-step Instructions */}
        <div>
          <h3 className="text-base font-bold text-[#14231B] mb-3">Step-by-Step Instructions</h3>
          <ol className="space-y-2.5">
            {steps.map((step, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-[#F7F9F6] border border-[#E2EAE3]"
              >
                <span className="w-6 h-6 rounded-full bg-[#1B4332] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-sm sm:text-base text-slate-800 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Environmental Tip */}
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-0.5">
              Environmental Tip (3R Principle)
            </p>
            <p className="text-sm text-emerald-950">{item.environmental_tip}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100">
          {onRecordDisposal && (
            <button
              type="button"
              onClick={() => onRecordDisposal(item)}
              disabled={recording}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1B4332] hover:bg-[#143326] text-white font-semibold text-sm transition disabled:opacity-60 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{recording ? 'Recording...' : 'Record Responsible Disposal'}</span>
            </button>
          )}

          <Link
            to={`/centres?type=${encodeURIComponent(mapCategoryToCentreFilter(item.category?.slug))}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#CBD9CD] bg-white hover:bg-[#F1F6F2] text-[#1B4332] font-semibold text-sm transition"
          >
            <MapPin className="w-4 h-4" />
            <span>Find Collection Centre</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
