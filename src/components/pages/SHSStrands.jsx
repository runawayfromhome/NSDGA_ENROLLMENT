// Public promotional page: Senior High School Strands / Tracks.
// Shows one showcase card per promo entry — an image carousel (scroll left/right)
// beside the strand name + description. Content is managed by Admin in
// SHS Courses → "Strand Promo", stored in site_content('strand_promo') and is
// intentionally separate from the Apply-form strand list.
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import MainLayout from '../../layouts/Mainlayouts';
import { getStrandPromo } from '../../lib/content';
import { LuChevronLeft, LuChevronRight, LuGraduationCap, LuSparkles } from 'react-icons/lu';

function Carousel({ images, alt }) {
  const [i, setI] = useState(0);
  const [failed, setFailed] = useState(() => new Set());
  // Drop any image that failed to load (deleted / moved / corrupt URL), so a
  // broken image never shows — it just isn't part of the carousel.
  const list = (Array.isArray(images) ? images : []).filter((src) => src && !failed.has(src));
  const n = list.length;

  if (n === 0) {
    return (
      <div className="relative h-72 md:h-80 rounded-2xl bg-gradient-to-br from-[#a33] to-[#800000] flex items-center justify-center">
        <LuGraduationCap className="w-24 h-24 text-white/90" strokeWidth={1.2} />
      </div>
    );
  }

  const active = ((i % n) + n) % n;
  const go = (d) => setI((x) => x + d);

  return (
    <div className="relative h-72 md:h-80 rounded-2xl overflow-hidden bg-gray-100 group">
      <img
        key={list[active]}
        src={list[active]}
        alt={`${alt} ${active + 1}`}
        onError={() => setFailed((f) => new Set(f).add(list[active]))}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {n > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Previous image"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[#800000] flex items-center justify-center shadow-md transition cursor-pointer">
            <LuChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => go(1)} aria-label="Next image"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[#800000] flex items-center justify-center shadow-md transition cursor-pointer">
            <LuChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {list.map((_, k) => (
              <button key={k} onClick={() => setI(k)} aria-label={`Go to image ${k + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${k === active ? 'w-6 bg-white' : 'w-2 bg-white/60 hover:bg-white/80'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StrandCard({ item, flip }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center">
      {/* Image carousel */}
      <div className={`relative ${flip ? 'md:order-2' : ''}`}>
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-[#800000]/10 rounded-lg -z-10" />
        <div className="bg-[#FFF4E5] rounded-2xl p-3 shadow-xl">
          <Carousel images={item.images} alt={item.name} />
        </div>
      </div>

      {/* Text */}
      <div className={flip ? 'md:order-1' : ''}>
        <h2 className="text-2xl md:text-3xl font-bold text-[#800000] leading-tight mb-5">{item.name}</h2>
        <p className="text-gray-600 text-[15px] leading-relaxed text-justify whitespace-pre-line">{item.description}</p>
        <div className="mt-7 flex items-center gap-4">
          <div className="h-[1px] w-12 bg-[#800000]" />
          <NavLink to="/StudentPortal/Apply" className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#800000] hover:underline">
            Apply for this strand →
          </NavLink>
        </div>
      </div>
    </div>
  );
}

const SHSStrands = () => {
  const [items, setItems] = useState(null);

  useEffect(() => { getStrandPromo().then(setItems); }, []);

  return (
    <MainLayout>
      {/* Hero */}
      <div className="w-screen -ml-[50vw] left-1/2 right-1/2 -mr-[50vw] relative bg-[#800000] text-white">
        <div className="max-w-5xl mx-auto px-6 md:px-16 py-16 text-center">
          <div className="mx-auto mb-5 px-4 py-1 border border-white/30 bg-white/10 rounded-full w-fit flex items-center gap-2">
            <LuSparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Senior High School</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-5">Our Strands &amp; Tracks</h1>
          <p className="text-white/80 text-[15px] md:text-base max-w-2xl mx-auto leading-relaxed">
            Explore the Senior High School strands offered by Nuestra Señora de Guia Academy —
            each one designed to prepare you for college and your future career.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
        {!items ? (
          <div className="space-y-16">
            {[0, 1].map((i) => <div key={i} className="h-72 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <LuGraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={1.2} />
            <p className="text-gray-500 font-medium">Strands will be announced soon. Please check back later!</p>
          </div>
        ) : (
          <div className="space-y-20 md:space-y-28">
            {items.map((item, idx) => (
              <StrandCard key={item.id || idx} item={item} flip={idx % 2 === 1} />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        {items && items.length > 0 && (
          <div className="mt-20 text-center bg-[#FFF4E5] rounded-2xl p-10">
            <h2 className="text-2xl font-bold text-[#800000] mb-3">Ready to enroll?</h2>
            <p className="text-gray-600 text-sm mb-6 max-w-xl mx-auto">
              Start your application online, or visit the Registrar’s Office for help choosing the right strand.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <NavLink to="/StudentPortal/Apply" className="bg-[#800000] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#600000] transition-colors shadow-md">Apply Now</NavLink>
              <NavLink to="/SHSOnCampus" className="border border-[#800000] text-[#800000] px-8 py-3 rounded-lg font-bold hover:bg-[#800000]/5 transition-colors">Admission Procedure</NavLink>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SHSStrands;
