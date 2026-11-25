import { AlertTriangle, Cpu, Leaf, Recycle } from 'lucide-react';

export const CATEGORY_STYLES = {
  'wet-organic': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-600',
    binHex: '#15803D',
    icon: Leaf,
  },
  'dry-recyclable': {
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    dot: 'bg-sky-600',
    binHex: '#0284C7',
    icon: Recycle,
  },
  'e-waste': {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-600',
    binHex: '#D97706',
    icon: Cpu,
  },
  'hazardous-special': {
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    dot: 'bg-rose-600',
    binHex: '#DC2626',
    icon: AlertTriangle,
  },
};

export function getCategoryStyle(slug) {
  return CATEGORY_STYLES[slug] || CATEGORY_STYLES['dry-recyclable'];
}

export default function CategoryBadge({ slug, name, size = 'md' }) {
  const style = getCategoryStyle(slug);
  const Icon = style.icon;
  const sizeClass =
    size === 'sm' ? 'px-2.5 py-0.5 text-xs gap-1' : 'px-3 py-1 text-xs sm:text-sm gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClass}`}
    >
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>{name}</span>
    </span>
  );
}
