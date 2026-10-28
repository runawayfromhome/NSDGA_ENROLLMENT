// Reusable image carousel with a broken-image guard. Any image that fails to
// load (deleted / moved / corrupt URL) is dropped, so a broken image never
// renders. If no image is left, a themed gradient + fallback node is shown.
// Controls stopPropagation so arrows/dots don't trigger a parent card's onClick.
import { useState } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

export default function ImageCarousel({
  images,
  alt = '',
  heightClass = 'h-44',
  rounded = 'rounded-lg',
  fallback = null,
  showDots = true,
}) {
  const [i, setI] = useState(0);
  const [failed, setFailed] = useState(() => new Set());
  const list = (Array.isArray(images) ? images : []).filter((s) => s && !failed.has(s));
  const n = list.length;

  if (n === 0) {
    return (
      <div className={`relative ${heightClass} ${rounded} overflow-hidden bg-gradient-to-br from-[#800000] to-[#b34747] flex items-center justify-center`}>
        {fallback}
      </div>
    );
  }

  const active = ((i % n) + n) % n;
  const go = (e, d) => { e.stopPropagation(); setI((x) => x + d); };

  return (
    <div className={`relative ${heightClass} ${rounded} overflow-hidden bg-gray-100 group`}>
      <img
        key={list[active]}
        src={list[active]}
        alt={`${alt} ${active + 1}`}
        onError={() => setFailed((f) => new Set(f).add(list[active]))}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {n > 1 && (
        <>
          <button type="button" onClick={(e) => go(e, -1)} aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#800000] flex items-center justify-center shadow-md transition cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100">
            <LuChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" onClick={(e) => go(e, 1)} aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#800000] flex items-center justify-center shadow-md transition cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100">
            <LuChevronRight className="w-4 h-4" />
          </button>
          {showDots && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {list.map((_, k) => (
                <button key={k} type="button" onClick={(e) => { e.stopPropagation(); setI(k); }} aria-label={`Go to image ${k + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${k === active ? 'w-5 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'}`} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
