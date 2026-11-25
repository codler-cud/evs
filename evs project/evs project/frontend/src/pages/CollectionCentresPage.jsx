import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Clock, ExternalLink, Mail, MapPin, Navigation, Phone, Search } from 'lucide-react';
import { api } from '../services/api';

// Fix Leaflet default marker assets under Vite bundling
const customPinIcon = L.divIcon({
  className: 'ecosort-map-pin',
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#1B4332;border:3px solid #ffffff;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(0,0,0,0.28);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;border-radius:50%;background:#74C69D;transform:rotate(45deg);"></div></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const FILTER_OPTIONS = [
  'all',
  'E-waste',
  'Plastic',
  'Paper',
  'Glass',
  'Metal',
  'General recycling',
  'Hazardous',
];

function MapFlyController({ targetCentre, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    if (!targetCentre) return;
    map.flyTo([targetCentre.latitude, targetCentre.longitude], 14, { duration: 0.7 });
    const marker = markerRefs.current[targetCentre.id];
    if (marker) {
      setTimeout(() => marker.openPopup(), 450);
    }
  }, [targetCentre, map, markerRefs]);

  return null;
}

export default function CollectionCentresPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'all';

  const [wasteType, setWasteType] = useState(
    FILTER_OPTIONS.includes(initialType) ? initialType : 'all'
  );
  const [searchText, setSearchText] = useState('');
  const [centres, setCentres] = useState([]);
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const markerRefs = useRef({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const timer = setTimeout(async () => {
      try {
        const list = await api.getCollectionCentres(wasteType, searchText);
        if (!active) return;
        setCentres(list);
        if (list.length > 0 && (!selectedCentre || !list.some((c) => c.id === selectedCentre.id))) {
          setSelectedCentre(list[0]);
        }
      } catch (err) {
        if (active) setError(err.message || 'Could not load collection centres.');
      } finally {
        if (active) setLoading(false);
      }
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [wasteType, searchText]);

  const handleFilterClick = (type) => {
    setWasteType(type);
    if (type === 'all') {
      searchParams.delete('type');
    } else {
      searchParams.set('type', type);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const defaultCenter = selectedCentre
    ? [selectedCentre.latitude, selectedCentre.longitude]
    : [18.5284, 73.8567];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
          Recycling & E-Waste Drop-off Network
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#14231B]">
          Find a Collection Centre
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
          Filter registered campus and municipal collection points by accepted material type, view their locations on OpenStreetMap, and launch directions.
        </p>
      </div>

      {/* Filters */}
      <div className="ecosort-card p-4 sm:p-5 space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by centre name, locality, or city..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-[#D4E0D5] focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleFilterClick(type)}
              className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition cursor-pointer ${
                wasteType === type
                  ? 'bg-[#1B4332] text-white border-[#1B4332]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {type === 'all' ? 'All Centres' : type}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      {/* Map + List Layout */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Centre Cards */}
        <div className="lg:col-span-5 space-y-3 max-h-[620px] overflow-y-auto pr-1">
          {loading ? (
            <div className="ecosort-card p-8 text-center text-sm text-slate-500">
              Loading collection centres...
            </div>
          ) : centres.length === 0 ? (
            <div className="ecosort-card p-8 text-center space-y-2">
              <p className="font-semibold text-slate-800">No collection centres matched your filters.</p>
              <button
                type="button"
                onClick={() => {
                  handleFilterClick('all');
                  setSearchText('');
                }}
                className="text-xs font-semibold text-[#1B4332] underline cursor-pointer"
              >
                Show all registered centres
              </button>
            </div>
          ) : (
            centres.map((centre) => {
              const isSelected = selectedCentre?.id === centre.id;
              const tags = centre.waste_types.split(',').map((t) => t.trim()).filter(Boolean);
              const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${centre.latitude},${centre.longitude}`;

              return (
                <div
                  key={centre.id}
                  className={`ecosort-card p-5 space-y-3 transition ${
                    isSelected ? 'border-[#1B4332] ring-2 ring-emerald-600/20' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <h2 className="font-bold text-base text-[#14231B]">{centre.name}</h2>
                    <p className="text-xs sm:text-sm text-slate-600 flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span>
                        {centre.address}, {centre.city}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pt-1">
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{centre.operating_hours}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{centre.contact_phone}</span>
                    </p>
                    {centre.contact_email && (
                      <p className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{centre.contact_email}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedCentre(centre)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-semibold transition cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>View on Map</span>
                    </button>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#CBD9CD] bg-white hover:bg-slate-50 text-[#1B4332] text-xs font-semibold transition"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Get Directions</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* OpenStreetMap + Leaflet Map */}
        <div className="lg:col-span-7 ecosort-card overflow-hidden">
          <div className="h-[460px] sm:h-[620px] w-full relative">
            <MapContainer
              center={defaultCenter}
              zoom={12}
              scrollWheelZoom={true}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapFlyController targetCentre={selectedCentre} markerRefs={markerRefs} />
              {centres.map((centre) => (
                <Marker
                  key={centre.id}
                  position={[centre.latitude, centre.longitude]}
                  icon={customPinIcon}
                  ref={(ref) => {
                    if (ref) markerRefs.current[centre.id] = ref;
                  }}
                >
                  <Popup>
                    <div className="space-y-1.5 min-w-[200px]">
                      <p className="font-bold text-sm text-[#14231B]">{centre.name}</p>
                      <p className="text-xs text-slate-600">{centre.address}</p>
                      <p className="text-xs font-medium text-emerald-800">
                        Accepts: {centre.waste_types}
                      </p>
                      <p className="text-xs text-slate-500">{centre.operating_hours}</p>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${centre.latitude},${centre.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-xs font-semibold text-[#1B4332] underline pt-1"
                      >
                        Get Directions →
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          <div className="px-4 py-2.5 bg-[#F7F9F6] border-t border-[#E2EAE3] text-xs text-slate-600">
            Note: Locations use registered prototype/demo collection centre coordinates for academic demonstration.
          </div>
        </div>
      </div>
    </div>
  );
}
