import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Instagram, Youtube, Share2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface MemoryPhoto {
  id: string;
  src: string;
  caption: string;
  event: string;
  month: string;
}

// Sample memories pool
const SAMPLE_MEMORIES: MemoryPhoto[] = [
  {
    id: 'm1',
    src: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?w=1000&q=80',
    caption: 'Intense Badminton Rally',
    event: 'Senja Cashew Sports Hall',
    month: 'Jan 2026',
  },
  {
    id: 'm2',
    src: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1000&q=80',
    caption: 'Community Sports Night',
    event: 'OCBC Arena',
    month: 'Feb 2026',
  },
  {
    id: 'm3',
    src: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1000&q=80',
    caption: 'Weekend Tennis Social',
    event: 'Kallang Tennis Centre',
    month: 'Jan 2026',
  },
  {
    id: 'm4',
    src: 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?w=1000&q=80',
    caption: 'Table Tennis Social',
    event: 'Demo Activity CCAB Sports Hall',
    month: 'Feb 2026',
  },
  {
    id: 'm5',
    src: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1000&q=80',
    caption: 'Social Football Game',
    event: 'The Cage @ Kallang',
    month: 'Feb 2026',
  },
];

interface Props {
  title?: string;
  subtitle?: string;
  photos?: MemoryPhoto[];
  showSocialLinks?: boolean;
  instagramUrl?: string;
  youtubeUrl?: string;
  compact?: boolean; // smaller height for EventDetails
}

export default function MemoriesCarousel({
  title = 'Community Memories',
  subtitle = 'Moments from our sports community',
  photos = SAMPLE_MEMORIES,
  showSocialLinks = true,
  instagramUrl,
  youtubeUrl,
  compact = false,
}: Props) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightbox, setLightbox] = useState<MemoryPhoto | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPaused || photos.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % photos.length);
    }, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, photos.length]);

  const prev = () => setCurrent(c => (c - 1 + photos.length) % photos.length);
  const next = () => setCurrent(c => (c + 1) % photos.length);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'Bookee Memories', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (photos.length === 0) return null;

  const bannerHeight = compact ? 'h-48 md:h-56' : 'h-56 md:h-72 lg:h-80';
  const photo = photos[current];

  return (
    <>
      <div
        className={`relative rounded-2xl overflow-hidden ${bannerHeight} bg-[#0d2d20] shadow-md`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Images */}
        {photos.map((p, i) => (
          <div
            key={p.id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
          >
            <img
              src={p.src}
              alt={p.caption}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1000&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
          </div>
        ))}

        {/* Click to expand */}
        <button
          className="absolute inset-0 z-10 cursor-zoom-in"
          onClick={() => setLightbox(photo)}
          aria-label="Expand photo"
        />

        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start">
          <div>
            {!compact && (
              <h3 className="font-bold text-white drop-shadow-md text-lg">{title}</h3>
            )}
            {subtitle && !compact && (
              <p className="text-white/70 text-xs drop-shadow">{subtitle}</p>
            )}
          </div>
          {showSocialLinks && (
            <div className="flex gap-2">
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {youtubeUrl && (
                <a href={youtubeUrl} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  <Youtube className="h-4 w-4" />
                </a>
              )}
              <button
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); handleShare(); }}
                aria-label="Share"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Caption overlay */}
        <div className="absolute bottom-4 left-4 right-16 z-20">
          <p className="text-white font-bold drop-shadow-md text-sm">{photo.caption}</p>
          <p className="text-white/70 text-xs drop-shadow">{photo.event}</p>
        </div>

        {/* Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-foreground transition-all active:scale-90"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-foreground transition-all active:scale-90"
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 right-4 z-20 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                className={`rounded-full transition-all ${i === current ? 'bg-[#1A7A4A] w-4 h-2' : 'bg-white/50 w-2 h-2'}`}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Count badge */}
        <div className="absolute top-4 left-4 z-20 mt-8">
          {compact && (
            <Badge className="bg-[#1A7A4A] border-none text-white text-[10px] font-bold">
              {current + 1}/{photos.length} photos
            </Badge>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white"
            onClick={() => setLightbox(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={lightbox.src}
              alt={lightbox.caption}
              className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
            <div className="mt-4 text-center">
              <p className="text-white font-bold text-lg">{lightbox.caption}</p>
              <p className="text-white/60 text-sm mt-1">{lightbox.event} · {lightbox.month}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}