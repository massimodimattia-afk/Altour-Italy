// src/pages/Home.tsx
import { useEffect, useState, useCallback, useMemo, memo } from "react";
import {
  Clock,
  TrendingUp,
  Shield,
  Users,
  ArrowRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import ActivityDetailModal from "../components/ActivityDetailModal";
import { motion } from "framer-motion";
import { CourseCard, Corso } from "../components/CourseCard";
import Section from "../components/Section";
import FeedbackCarousel from "../components/FeedbackCarousel"; // <-- Aggiunto import

type Escursione = Database["public"]["Tables"]["escursioni"]["Row"] & {
  filosofia?: string | null;
  lunghezza?: number | null;
  is_italic?: boolean | null;
  _tipo: "escursione";
};

interface Campo {
  id: string;
  titolo: string;
  descrizione: string | null;
  immagine_url: string | null;
  prezzo?: number | null;
  durata?: string | null;
  slug?: string | null;
  min_partecipanti?: string | null;
  _tipo: "campo";
}
type FeaturedActivity = Escursione | Campo;

interface HomeProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string, mode?: "info" | "prenota") => void;
}

// ─── Skeleton ─────────────────────
const SkeletonCard = memo(() => (
  <div
    className="bg-white rounded-2xl overflow-hidden flex flex-col ios-gpu-fix"
    style={{
      boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
    }}
  >
    <div className="aspect-[3/2] bg-stone-100 animate-pulse" />
    <div className="p-4 flex flex-col gap-2.5">
      <div className="h-2 w-20 bg-stone-100 rounded animate-pulse" />
      <div className="h-4 w-3/4 bg-stone-200 rounded animate-pulse" />
      <div className="h-3 w-full bg-stone-50 rounded animate-pulse" />
      <div className="flex gap-2 mt-1">
        <div className="h-10 flex-1 bg-stone-100 rounded-xl animate-pulse" />
        <div className="h-10 flex-[1.5] bg-stone-100 rounded-xl animate-pulse" />
      </div>
    </div>
  </div>
));

const IMG_FALLBACK = "/altour-logo.png";

function formatMarkdown(text: string | null): string {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>");
}

const FILOSOFIA_COLORS: Record<string, string> = {
  "Avventura":             "#e94544",
  "Benessere":             "#a5d9c9",
  "Borghi più belli":      "#946a52",
  "Cammini":               "#e3c45d",
  "Educazione all'aperto": "#01aa9f",
  "Eventi":                "#ffc0cb",
  "Formazione":            "#002f59",
  "Immersi nel verde":     "#358756",
  "Luoghi dello spirito":  "#c8a3c9",
  "Novità":                "#75c43c",
  "Speciali":              "#b8163c",
  "Acqua e cielo":         "#7aaecd",
  "Trek urbano":           "#f39452",
  "Tracce sulla neve":     "#a8cce0",
  "Cielo stellato":        "#1e2855",
};

function getFilosofiaOpacity(color: string): string {
  const dark = ["#002f59", "#946a52", "#b8163c", "#358756", "#1e2855"];
  return dark.includes(color) ? `${color}aa` : `${color}cc`;
}

function FilosofiaBadge({ value }: { value: string | null | undefined }) {
  if (!value || !FILOSOFIA_COLORS[value]) return null;
  const color = FILOSOFIA_COLORS[value];
  const bg    = getFilosofiaOpacity(color);
  return (
    <div
      className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ios-gpu-fix"
      style={{
        backgroundColor: bg,
        color: "rgba(255,255,255,0.95)",
        textShadow: "0 1px 3px rgba(0,0,0,0.35)",
        boxShadow: `0 2px 12px ${color}55, inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 1px ${color}`,
      }}
    >
      {value}
    </div>
  );
}

function heroAnim(
  delay: number,
  name: "heroFadeUp" | "heroFadeIn" = "heroFadeUp",
  duration = 0.65
): React.CSSProperties {
  return {
    animation: `${name} ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s both`,
  };
}

export default function Home({ onNavigate, onBookingClick }: HomeProps) {
  const [featuredActivities, setFeaturedActivities] = useState<FeaturedActivity[]>([]);
  const [courses, setCourses]                       = useState<Corso[]>([]);
  const [loading, setLoading]                       = useState(true);
  const [selectedActivity, setSelectedActivity]     = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen]             = useState(false);
  const [bgAnimDone, setBgAnimDone]                 = useState(false);

  const [isMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [{ data: allHikes }, { data: allCampi }, { data: crs }] =
          await Promise.all([
            supabase.from("escursioni").select("*").eq("is_active", true).order("data", { ascending: true }),
            supabase.from("campi").select("id, titolo, descrizione, immagine_url, prezzo, durata, slug, servizi, descrizione_estesa, difficolta, lunghezza, min_partecipanti, lat, lng"),
            supabase.from("corsi").select("*").order("posizione", { ascending: true }),
          ]);

        const hikes = ((allHikes ?? []) as any[]).map((e) => ({ ...e, _tipo: "escursione" as const }));
        const campi = ((allCampi ?? []) as any[]).map((c) => ({ ...c, _tipo: "campo" as const }));
        const mixed = [...hikes, ...campi].sort(() => Math.random() - 0.5);
        
        setFeaturedActivities(mixed.slice(0, isMobile ? 2 : 3));
        
        if (crs) {
          const coursesWithTipo = (crs as any[]).map(c => ({ ...c, _tipo: "corso" as const }));
          setCourses(coursesWithTipo as Corso[]);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    loadData();
  }, [isMobile]);

  const openDetails = useCallback((activity: any) => {
    setSelectedActivity(activity);
    setIsDetailOpen(true);
  }, []);

  const memoizedActivities = useMemo(() => {
    return featuredActivities.map(activity => ({
      ...activity,
      descrizioneFormattata: formatMarkdown(activity.descrizione)
    }));
  }, [featuredActivities]);

  if (loading)
    return (
      <div className="min-h-[100dvh] bg-[#f5f2ed] overflow-x-hidden">
        <div className="h-[80dvh] md:h-screen bg-stone-200 animate-pulse" />
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-[100dvh] bg-[#f5f2ed] overflow-x-hidden">

      {/* ─── 1. HERO ───────────────────── */}
      <Section animate={false} fullHeight as="section" className="flex items-center justify-center overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          onAnimationComplete={() => setBgAnimDone(true)}
          style={{
            willChange: bgAnimDone ? "auto" : "transform",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "translateZ(0)",
            WebkitTransform: "translateZ(0)"
          }}
        >
          <img
            src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20220904_150458.webp"
            className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
            alt="Dolomiti Altour Italy"
            loading="eager"
            fetchpriority="high"
            decoding="sync"
            onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }}
          />
        </motion.div>

        <div className="absolute inset-0 bg-black/30 ios-gpu-fix" style={heroAnim(0, "heroFadeIn", 1.0)} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-[70%] to-[#f5f2ed] ios-gpu-fix" />

        <div className="relative z-10 text-center max-w-4xl w-full px-4 flex flex-col items-center">
          <div style={heroAnim(0.5)} className="mb-3">
            <h1 className="text-6xl md:text-7xl font-black text-white uppercase tracking-tighter drop-shadow-2xl leading-none ios-gpu-fix">
              Altour
            </h1>
            <p className="text-sm md:text-xl font-bold uppercase tracking-[0.4em] text-white/75 mt-2">
              Italy
            </p>
          </div>

          <p style={heroAnim(0.7, "heroFadeUp", 0.6)} className="text-white/65 text-sm md:text-base font-medium max-w-xs md:max-w-md mx-auto mb-8 leading-relaxed">
            Formazione ed attività outdoor
          </p>

          <div style={heroAnim(0.9, "heroFadeUp", 0.6)} className="flex flex-col sm:flex-row items-stretch gap-3 w-full max-w-sm mx-auto mb-10 md:mb-12">
            <button
              onClick={() => onNavigate("attivitapage")}
              className="flex-1 flex items-center justify-center gap-2 bg-white/12 hover:bg-white/22 text-white font-black uppercase text-[10px] tracking-widest py-4 px-5 rounded-2xl border border-white/25 active:scale-95 transition-colors ios-gpu-fix"
            >
              Esplora Attività <ArrowRight size={12} />
            </button>
            <button
              onClick={() => onNavigate("corsi")}
              className="flex-1 flex items-center justify-center gap-2 bg-white/12 hover:bg-white/22 text-white font-black uppercase text-[10px] tracking-widest py-4 px-5 rounded-2xl border border-white/25 active:scale-95 transition-colors ios-gpu-fix"
            >
              Vai all'Accademia <ArrowRight size={12} />
            </button>
          </div>

          <div style={heroAnim(1.1, "heroFadeUp", 0.6)} className="bg-white/15 py-4 px-4 md:px-8 rounded-[1.5rem] md:rounded-full border border-white/20 shadow-xl w-full max-w-md mx-auto ios-gpu-fix">
            <div className="grid grid-cols-3 gap-0 divide-x divide-white/15">
              {[
                { value: "10 anni", label: "Esperienza", icon: <TrendingUp size={13} /> },
                { value: "AIGAE",   label: "Guide",      icon: <Shield size={13} /> },
                { value: "850+",    label: "Tesserati",  icon: <Users size={13} /> },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center justify-center px-2">
                  <div className="text-brand-sky mb-1 md:hidden">{stat.icon}</div>
                  <p className="text-sm md:text-xl font-black text-white leading-none">{stat.value}</p>
                  <p className="text-[9px] uppercase tracking-wider text-white/50 font-bold mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ─── 2. ACCADEMIA ───────────────────── */}
      <Section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1 w-8 bg-brand-sky rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-sky">Accademia Altour</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9]">
              Formazione <br />
              <span className="text-brand-sky italic font-light tracking-normal">Professionale.</span>
            </h2>
          </div>
          <button onClick={() => onNavigate("corsi")} className="group flex items-center gap-3 text-stone-400 hover:text-brand-sky transition-colors">
            <span className="text-[10px] font-black uppercase tracking-widest">Vedi tutto</span>
            <div className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center group-hover:border-brand-sky group-hover:bg-brand-sky group-hover:text-white transition-all">
              <ArrowRight size={16} />
            </div>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.slice(0, 3).map((corso, index) => (
            <div key={corso.id} className={index > 0 ? "hidden md:block" : "block"}>
              <CourseCard corso={corso} onBookingClick={onBookingClick} openDetails={openDetails} />
            </div>
          ))}
        </div>
      </Section>

      {/* ─── 3. ATTIVITÀ OUTDOOR ───────────────────── */}
      <Section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1 w-8 bg-brand-sky rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-sky">Attività Outdoor</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9]">Prossime <br /><span className="text-brand-sky italic font-light tracking-normal">Avventure.</span></h2>
          </div>
          <button onClick={() => onNavigate("attivitapage")} className="group flex items-center gap-3 text-stone-400 hover:text-brand-sky transition-colors">
            <span className="text-[10px] font-black uppercase tracking-widest">Vedi tutte le attività</span>
            <div className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center group-hover:border-brand-sky group-hover:bg-brand-sky group-hover:text-white transition-all"><ArrowRight size={16} /></div>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {memoizedActivities.map((activity) => {
            const isEscursione = activity._tipo === "escursione";
            return (
              <div key={activity.id} className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 flex flex-col group hover:shadow-2xl transition-shadow duration-500 ios-gpu-fix">
                <div className="aspect-[16/9] md:h-56 md:aspect-auto bg-stone-200 relative overflow-hidden">
                  {activity.immagine_url && (
                    <img src={activity.immagine_url} alt={activity.titolo} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent ios-gpu-fix" />
                  {isEscursione && <FilosofiaBadge value={(activity as Escursione).filosofia} />}
                  {!isEscursione && (activity as Campo).slug && <FilosofiaBadge value={(activity as Campo).slug} />}
                </div>
                <div className="p-4 md:p-5 flex flex-col flex-grow">
                  <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                    {activity.durata && (
                      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-brand-sky"><Clock size={9} />{activity.durata}</span>
                    )}
                  </div>
                  <h3 className="text-sm md:text-base font-black text-brand-stone uppercase leading-tight line-clamp-2 mb-1.5">{activity.titolo}</h3>
                  <p className="text-[11px] md:text-xs text-stone-400 line-clamp-2 leading-relaxed mb-3 flex-grow font-medium" dangerouslySetInnerHTML={{ __html: activity.descrizioneFormattata }} />
                  <div className="flex gap-2 pt-3 border-t border-stone-50">
                    <button onClick={() => openDetails(activity)} className="flex-1 py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] tracking-widest border-2 border-stone-200 text-stone-600 hover:border-stone-400 transition-colors active:scale-95">Dettagli</button>
                    <button onClick={() => onBookingClick(activity.titolo, "info")} className="flex-[1.5] py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] tracking-widest bg-brand-sky text-white shadow-sm hover:bg-[#0284c7] transition-colors active:scale-95">Richiedi Info</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ─── 4. FEEDBACK CAROUSEL (Spostato qui) ───────────────────── */}
      <FeedbackCarousel />

      {/* ─── MODALE DETTAGLI ───────────────────── */}
      {selectedActivity && (
        <ActivityDetailModal activity={selectedActivity} isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} onBookingClick={onBookingClick} />
      )}
    </div>
  );
}