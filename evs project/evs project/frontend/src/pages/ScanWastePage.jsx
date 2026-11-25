import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Cpu,
  ImagePlus,
  Loader2,
  MapPin,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import CategoryBadge from '../components/CategoryBadge';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

const SAMPLE_PHOTOS = [
  { label: 'Plastic Bottle', path: '/samples/plastic-bottle.png' },
  { label: 'Banana Peel', path: '/samples/banana-peel.png' },
  { label: 'Old Phone', path: '/samples/mobile-phone.png' },
  { label: 'Medicine Strip', path: '/samples/medicine-strip.png' },
];

function inferAction(slug) {
  if (slug === 'wet-organic') return 'Composted';
  if (slug === 'e-waste') return 'E-Waste Disposal';
  if (slug === 'hazardous-special') return 'Hazardous Drop-off';
  return 'Recycled';
}

export default function ScanWastePage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Manual fallback / override state
  const [categories, setCategories] = useState([]);
  const [manualCategorySlug, setManualCategorySlug] = useState('');
  const [manualItems, setManualItems] = useState([]);
  const [selectedManualItem, setSelectedManualItem] = useState(null);

  const [recording, setRecording] = useState(false);
  const [toast, setToast] = useState('');

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!manualCategorySlug) return;
    api
      .searchWaste('', manualCategorySlug)
      .then((list) => {
        setManualItems(list);
        setSelectedManualItem(list[0] || null);
      })
      .catch(() => {});
  }, [manualCategorySlug]);

  const handleFileChange = (file) => {
    setError('');
    setResult(null);
    setToast('');
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Unsupported file format. Please choose a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5 MB limit. Please upload a smaller image.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSamplePick = async (sample) => {
    setError('');
    setToast('');
    setResult(null);
    try {
      const resp = await fetch(sample.path);
      const blob = await resp.blob();
      const file = new File([blob], sample.path.split('/').pop(), { type: 'image/png' });
      handleFileChange(file);
    } catch {
      setError('Could not load sample image.');
    }
  };

  const handleClassify = async () => {
    if (!selectedFile) {
      setError('Please select or upload an image first.');
      return;
    }
    setAnalyzing(true);
    setError('');
    setToast('');
    try {
      const data = await api.classifyImage(selectedFile);
      setResult(data);
      setManualCategorySlug(data.predicted_category_slug);
      setSelectedManualItem(data.matched_item || null);
    } catch (err) {
      setError(err.message || 'Image classification failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const activeCategory =
    categories.find((c) => c.slug === manualCategorySlug) || result?.predicted_category;
  const activeItem = selectedManualItem || result?.matched_item;

  const handleLogDisposal = async () => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: '/scan' } });
      return;
    }
    if (!activeCategory) return;

    setRecording(true);
    setError('');
    try {
      const res = await api.createWasteRecord({
        waste_item_id: activeItem?.id || null,
        item_name: activeItem?.name || result?.predicted_label || 'Scanned Waste Item',
        category_id: activeCategory.id,
        action_type: inferAction(activeCategory.slug),
        quantity: 1,
        notes: `Logged via AI Scan (${result?.confidence_percent ?? 0}% confidence)`,
      });
      setToast(`Logged "${res.item_name}" (+${res.points_earned} Eco Score)!`);
    } catch (err) {
      setError(err.message || 'Could not log disposal.');
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          <Cpu className="w-3.5 h-3.5" />
          <span>AI-Assisted Prototype • Modular Vision Pipeline</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#14231B]">Scan Waste</h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
          Upload a waste photo to analyze visual color, texture, and specular cues via our FastAPI classification service, then confirm the recommended bin and disposal method.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Upload & Preview Column */}
        <div className="lg:col-span-5 ecosort-card p-6 space-y-5">
          <label className="block border-2 border-dashed border-[#BFD4C2] hover:border-[#1B4332] rounded-2xl p-6 text-center cursor-pointer transition bg-[#F9FBF9]">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              capture="environment"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
              className="hidden"
            />
            {previewUrl ? (
              <div className="space-y-3">
                <img
                  src={previewUrl}
                  alt="Waste preview"
                  className="w-full h-56 object-contain rounded-xl bg-white border border-slate-100 mx-auto"
                />
                <p className="text-xs text-slate-600 font-medium">
                  {selectedFile?.name} • Click to change image
                </p>
              </div>
            ) : (
              <div className="py-8 space-y-3">
                <span className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#1B4332] flex items-center justify-center mx-auto">
                  <ImagePlus className="w-6 h-6" />
                </span>
                <div>
                  <p className="font-semibold text-sm text-[#14231B]">
                    Click to upload or capture waste photo
                  </p>
                  <p className="text-xs text-slate-500 mt-1">JPG, PNG, or WEBP up to 5 MB</p>
                </div>
              </div>
            )}
          </label>

          {/* Sample Demo Buttons */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Try Sample Demo Photos
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_PHOTOS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => handleSamplePick(s)}
                  className="px-3 py-2 rounded-xl border border-[#DCE6DD] bg-white hover:bg-emerald-50 text-xs font-semibold text-[#1B4332] transition cursor-pointer text-left flex items-center gap-2"
                >
                  <Camera className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClassify}
            disabled={!selectedFile || analyzing}
            className="w-full py-3.5 rounded-xl bg-[#1B4332] hover:bg-[#143326] text-white font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Image...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Classify Waste Image</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Prediction & Manual Fallback Column */}
        <div className="lg:col-span-7 space-y-5">
          {!result ? (
            <div className="ecosort-card p-8 sm:p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF5EF] text-[#1B4332] flex items-center justify-center mx-auto">
                <Cpu className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[#14231B]">Ready for AI Analysis</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Upload a photo or select a sample waste image on the left. EcoSort will predict the waste category, report transparent confidence scores, and let you manually override if needed.
              </p>
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 max-w-md mx-auto">
                Pipeline: React UI → FastAPI → CV Feature Classifier → Waste Database → Disposal Recommendation
              </div>
            </div>
          ) : (
            <div className="ecosort-card p-6 sm:p-8 space-y-6">
              {result.needs_manual_confirmation && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-sm flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Low AI Confidence ({result.confidence_percent}%)</p>
                    <p className="text-xs mt-0.5">
                      Our prototype classifier is unsure about this image. Please review or manually select the correct waste category below before disposing.
                    </p>
                  </div>
                </div>
              )}

              {/* Predicted Output */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Detected Waste Prediction
                  </p>
                  <h2 className="text-2xl font-extrabold text-[#14231B]">
                    {activeItem?.name || result.predicted_label}
                  </h2>
                  {activeCategory && (
                    <CategoryBadge slug={activeCategory.slug} name={activeCategory.name} />
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-[#F4F8F4] border border-[#DCE7DD] text-center min-w-[130px]">
                  <p className="text-xs font-semibold text-slate-600">AI Confidence</p>
                  <p className="text-3xl font-extrabold text-[#1B4332]">
                    {result.confidence_percent}%
                  </p>
                </div>
              </div>

              {/* Recommended Action */}
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Recommended Action
                </p>
                <p className="text-sm sm:text-base font-semibold text-emerald-950">
                  {activeItem
                    ? `${activeItem.bin_type} — ${activeItem.disposal_method_text}`
                    : result.recommended_action}
                </p>
              </div>

              {/* Instructions from DB */}
              {activeItem && (
                <div>
                  <h3 className="text-sm font-bold text-[#14231B] mb-2">
                    Disposal Instructions ({activeItem.name})
                  </h3>
                  <ul className="space-y-1.5 text-sm text-slate-700 list-disc pl-5">
                    {activeItem.instructions
                      .split('\n')
                      .filter(Boolean)
                      .map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Category Probability Breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Category Probability Breakdown
                </p>
                <div className="space-y-2">
                  {result.top_candidates.map((cand) => {
                    const pct = Math.round(cand.confidence * 100);
                    return (
                      <div key={cand.category_slug} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium text-slate-700">
                          <span>{cand.category_name}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#2D6A4F]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Manual Fallback Selector */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Manual Confirmation / Category Override
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Category
                    </label>
                    <select
                      value={manualCategorySlug}
                      onChange={(e) => setManualCategorySlug(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.slug}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Specific Waste Item
                    </label>
                    <select
                      value={selectedManualItem?.id || ''}
                      onChange={(e) => {
                        const found = manualItems.find(
                          (item) => item.id === Number(e.target.value)
                        );
                        setSelectedManualItem(found || null);
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
                    >
                      {manualItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {toast && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    {toast}
                  </span>
                  <Link to="/dashboard" className="text-xs font-bold underline">
                    Dashboard →
                  </Link>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleLogDisposal}
                  disabled={recording}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1B4332] hover:bg-[#143326] text-white font-semibold text-sm transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{recording ? 'Logging...' : 'Record Proper Disposal'}</span>
                </button>
                <Link
                  to={`/centres?type=${
                    activeCategory?.slug === 'e-waste'
                      ? 'E-waste'
                      : activeCategory?.slug === 'hazardous-special'
                      ? 'Hazardous'
                      : 'all'
                  }`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#CBD9CD] bg-white hover:bg-slate-50 text-[#1B4332] font-semibold text-sm transition"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Find Nearest Drop-off</span>
                </Link>
              </div>

              <p className="text-[11px] text-slate-500">
                <strong>Model:</strong> {result.model_name} — {result.model_notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
