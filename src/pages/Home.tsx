// pages/Home.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Clock, TrendingUp, Gift, Star, Send, Shield, Users, ArrowRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import ActivityDetailModal from "../components/ActivityDetailModal";
import { motion } from "framer-motion";
import { CourseCard, Corso } from "../components/CourseCard";
import Section from "../components/Section";
import { isIOS, motionSafe } from "../utils/motion";

// ─── Tipi ─────────────────────────────────────────────────────────────────────
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
  _tipo: "campo";
}
type FeaturedActivity = Escursione | Campo;

interface HomeProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string, mode?: "info" | "prenota") => void;
}

// ─── Costanti ─────────────────────────────────────────────────────────────────
const IMG_FALLBACK = "/altour-logo.png";

const FILOSOFIA_COLORS: Record<string, string> = {
  "Avventura": "#e94544", "Benessere": "#a5d9c9", "Borghi più belli": "#946a52",
  "Cammini": "#e3c45d", "Educazione all'aperto": "#01aa9f", "Eventi": "#ffc0cb",
  "Formazione": "#002f59", "Immersi nel verde": "#358756", "Luoghi dello spirito": "#c8a3c9",
  "Novità": "#75c43c", "Speciali": "#b8163c", "Tra mare e cielo": "#7aaecd",
  "Trek urbano": "#f39452", "Tracce sulla neve": "#a8cce0", "Cielo stellato": "#1e2855",
};

const PRESET_VOUCHERS = [
  { amount: 10,  tag: null,      highlight: false },
  { amount: 20,  tag: null,      highlight: false },
  { amount: 60,  tag: "Top",     highlight: true  },
  { amount: 100, tag: null,      highlight: false },
  { amount: 200, tag: "Premium", highlight: false },
  { amount: 300, tag: null,      highlight: false },
];

// ─── Hero keyframes ────────────────────────────────────────────────────────────
// Iniettati SOLO su non-iOS. Su iOS il contenuto è immediatamente visibile
// → zero CSS animation → zero compositing layer nell'hero.
const HERO_KEYFRAMES = `
  @keyframes heroFadeUp {
    from { opacity: 0; transform: translate3d(0, 16px, 0); }
    to   { opacity: 1; }
  }
  @keyframes heroFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`;

// Su iOS → {} (elemento visibile immediatamente, nessun layer)
// Su non-iOS → CSS animation con delay
function heroAnim(
  delay: number,
  name: "heroFadeUp" | "heroFadeIn" = "heroFadeUp",
  duration = 0.65
): React.CSSProperties {
  if (isIOS) return {};
  return { animation: `${name} ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s both` };
}

// ─── ScrollReveal ──────────────────────────────────────────────────────────────
// iOS     → <>{children}</> trasparente (Section gestisce il fade dell'intera sezione)
// Non-iOS → motion.div whileInView
// Risolto a livello di modulo → nessun hook condizionale, nessuna violazione React
const ScrollReveal = isIOS
  ? ({ children }: { children: React.ReactNode }) => <>{children}</>
  : ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, delay, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    );

// ─── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden flex flex-col"
    style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)" }}>
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
);

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatMarkdown(text: string | null): string {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>");
}

function getFilosofiaOpacity(color: string): string {
  const dark = ["#002f59", "#946a52", "#b8163c", "#358756", "#1e2855"];
  return dark.includes(color) ? `${color}aa` : `${color}cc`;
}

// ─── FilosofiaBadge ────────────────────────────────────────────────────────────
// Nessun backdrop-blur → nessun compositing layer aggiuntivo
function FilosofiaBadge({ value }: { value: string | null | undefined }) {
  if (!value || !FILOSOFIA_COLORS[value]) return null;
  const color = FILOSOFIA_COLORS[value];
  const bg = getFilosofiaOpacity(color);
  return (
    <div
      className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest"
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

// ─── ActivityCard (inline) ─────────────────────────────────────────────────────
// Estratta come componente per evitare JSX troppo annidato nel render principale.
// Su iOS: div statico, niente hover scale sulle immagini.
// Su non-iOS: hover:scale-110 sull'immagine è accettabile perché avviene
//             solo al mouse-over, non durante lo scroll.
function ActivityCard({
  activity,
  onDetails,
  onBooking,
}: {
  activity: FeaturedActivity;
  onDetails: () => void;
  onBooking: () => void;
}) {
  const isEscursione = activity._tipo === "escursione";

  return (
    <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 flex flex-col group hover:shadow-2xl transition-shadow duration-500">
      {/* Immagine */}
      <div className="aspect-[16/9] md:h-56 md:aspect-auto bg-stone-200 relative overflow-hidden">
        {activity.immagine_url && (
          <img
            src={activity.immagine_url}
            alt={activity.titolo}
            // FIX iOS: su iOS rimuoviamo group-hover:scale-110 perché
            // il CSS hover su touch non si attiva, ma il browser crea comunque
            // un compositing layer per gestire la transizione potenziale.
            // transition-none su iOS evita questo layer inutile.
            className={`absolute inset-0 w-full h-full object-cover ${
              isIOS
                ? ""
                : "group-hover:scale-110 transition-transform duration-700"
            }`}
            loading="lazy"
            decoding="async"
            onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        {isEscursione && <FilosofiaBadge value={(activity as Escursione).filosofia} />}
        {!isEscursione && (activity as Campo).slug && (
          <FilosofiaBadge value={(activity as Campo).slug} />
        )}
      </div>

      {/* Corpo */}
      <div className="p-5 md:p-7 flex flex-col flex-grow">
        <div className="flex items-center gap-3 mb-3">
          {isEscursione ? (
            <>
              <div className="w-1 h-1 rounded-full bg-stone-200" />
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-sky uppercase tracking-wider">
                <Clock size={12} className="text-brand-sky" />
                {activity.durata || "Giornata intera"}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-sky uppercase tracking-wider">
              <Clock size={12} />
              {activity.durata || "Campo"}
            </div>
          )}
        </div>

        <h3 className="text-lg md:text-xl font-black text-brand-stone uppercase leading-tight line-clamp-2 mb-3">
          {activity.titolo}
        </h3>
        <p
          className="text-stone-500 text-xs md:text-sm line-clamp-3 leading-relaxed mb-6 flex-grow font-medium"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(activity.descrizione) }}
        />

        <div className="flex gap-3 pt-5 border-t border-stone-100">
          <button
            onClick={onDetails}
            // FIX iOS: active:scale-95 usa transform → compositing layer al tap.
            // Su iOS sostituiamo con active:opacity-70 — stesso feedback visivo,
            // zero layer GPU.
            className={`flex-1 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest border-2 border-stone-200 text-stone-600 transition-colors ${
              isIOS ? "active:opacity-70" : "hover:border-stone-400 active:scale-95"
            }`}
          >
            Dettagli
          </button>
          <button
            onClick={onBooking}
            className={`flex-[1.5] py-3 rounded-xl font-black uppercase text-[9px] tracking-widest bg-brand-sky text-white shadow-lg transition-colors ${
              isIOS ? "active:opacity-70" : "hover:bg-[#0284c7] active:scale-95"
            }`}
          >
            Richiedi Info
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principale ─────────────────────────────────────────────────────
export default function Home({ onNavigate, onBookingClick }: HomeProps) {
  const [featuredActivities, setFeaturedActivities] = useState<FeaturedActivity[]>([]);
  const [courses, setCourses]   = useState<Corso[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen]         = useState(false);
  // Su iOS parte già "done" → will-change non viene mai impostato
  const [bgAnimDone, setBgAnimDone] = useState(isIOS);

  const isMobile = useRef(
    typeof window !== "undefined" && window.innerWidth < 768
  ).current;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [{ data: allHikes }, { data: allCampi }, { data: crs }] =
          await Promise.all([
            supabase.from("escursioni").select("*").eq("is_active", true).order("data", { ascending: true }),
            supabase.from("campi").select("id, titolo, descrizione, immagine_url, prezzo, durata, slug"),
            supabase.from("corsi").select("*").order("posizione", { ascending: true }),
          ]);

        const hikes = ((allHikes ?? []) as any[]).map(e => ({ ...e, _tipo: "escursione" as const }));
        const campi = ((allCampi ?? []) as any[]).map(c => ({ ...c, _tipo: "campo" as const }));
        const mixed = [...hikes, ...campi].sort(() => Math.random() - 0.5);
        setFeaturedActivities(mixed.slice(0, isMobile ? 2 : 3));
        if (crs) setCourses(crs as unknown as Corso[]);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const openDetails = useCallback((activity: any) => {
    setSelectedActivity(activity);
    setIsDetailOpen(true);
  }, []);

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="min-h-screen bg-[#f5f2ed] overflow-x-hidden">
        <div className="h-[80vh] md:h-screen bg-stone-200 animate-pulse" />
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3].map(n => <SkeletonCard key={n} />)}
          </div>
        </div>
      </div>
    );

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f2ed] overflow-x-hidden">

      {/* Keyframes solo su non-iOS */}
      {!isIOS && <style dangerouslySetInnerHTML={{ __html: HERO_KEYFRAMES }} />}

      {/* ── 1. HERO ──────────────────────────────────────────────────────────── */}
      {/*
        animate={false}: nessun IntersectionObserver, nessun fade CSS dalla Section.
        L'hero ha le proprie animazioni (heroAnim) o è statico su iOS.
      */}
      <Section animate={false} fullHeight as="section" className="flex items-center justify-center overflow-hidden">

        {/* Background ─────────────────────────────────────────────────────── */}
        {isIOS ? (
          /*
            iOS: div completamente statico.
            - Nessun motion.div → nessun rAF loop di FM
            - Nessun transform → nessun compositing layer
            - Nessun will-change → nessuna texture GPU preallocata
          */
          <div className="absolute inset-0">
            <img
              src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20220904_150458.webp"
              className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
              alt="Dolomiti Altour Italy"
              loading="eager"
              fetchpriority="high"
              decoding="sync"
              onError={e => { e.currentTarget.src = IMG_FALLBACK; }}
            />
          </div>
        ) : (
          /*
            Non-iOS: scale animato con Framer Motion.
            will-change rimosso via onAnimationComplete → il layer GPU
            viene liberato dopo 1.8s invece di restare attivo per sempre.
          */
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
            }}
          >
            <img
              src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20220904_150458.webp"
              className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
              alt="Dolomiti Altour Italy"
              loading="eager"
              fetchpriority="high"
              decoding="sync"
              onError={e => { e.currentTarget.src = IMG_FALLBACK; }}
            />
          </motion.div>
        )}

        {/* Overlay e gradiente — statici, nessuna animazione */}
        <div className="absolute inset-0 bg-black/30" style={heroAnim(0, "heroFadeIn", 1.0)} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-[70%] to-[#f5f2ed]" />

        {/* Contenuto ──────────────────────────────────────────────────────── */}
        <div className="relative z-10 text-center max-w-4xl w-full px-4 flex flex-col items-center">

          {/* Titolo */}
          <div style={heroAnim(0.5)} className="mb-3">
            <h1 className="text-6xl md:text-7xl font-black text-white uppercase tracking-tighter drop-shadow-2xl leading-none">
              Altour
            </h1>
            <p className="text-sm md:text-xl font-bold uppercase tracking-[0.4em] text-white/75 mt-2">
              Italy
            </p>
          </div>

          {/* Claim */}
          <p
            style={heroAnim(0.7, "heroFadeUp", 0.6)}
            className="text-white/65 text-sm md:text-base font-medium max-w-xs md:max-w-md mx-auto mb-8 leading-relaxed"
          >
            Formazione ed attività outdoor
          </p>

          {/* CTA */}
          <div
            style={heroAnim(0.9, "heroFadeUp", 0.6)}
            className="flex flex-col sm:flex-row items-stretch gap-3 w-full max-w-sm mx-auto mb-10 md:mb-12"
          >
            {/*
              FIX iOS: rimosso backdrop-blur dai bottoni CTA hero.
              Erano trasparenti (bg-white/12) con backdrop-blur implicito
              dalla composizione dei layer. Ora usiamo bg-white/20 su iOS
              che è visivamente equivalente senza blur.
            */}
            <button
              onClick={() => onNavigate("attivitapage")}
              className="flex-1 flex items-center justify-center gap-2 text-white font-black uppercase text-[10px] tracking-widest py-4 px-5 rounded-2xl border border-white/25 transition-colors"
              style={{ backgroundColor: isIOS ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.12)" }}
            >
              Esplora Attività <ArrowRight size={12} />
            </button>
            <button
              onClick={() => onNavigate("corsi")}
              className="flex-1 flex items-center justify-center gap-2 text-white font-black uppercase text-[10px] tracking-widest py-4 px-5 rounded-2xl border border-white/25 transition-colors"
              style={{ backgroundColor: isIOS ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.12)" }}
            >
              Vai all'Accademia <ArrowRight size={12} />
            </button>
          </div>

          {/* Stats bar — nessun backdrop-blur */}
          <div
            style={{
              backgroundColor: isIOS ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.15)",
              ...heroAnim(1.1, "heroFadeUp", 0.6),
            }}
            className="py-4 px-4 md:px-8 rounded-[1.5rem] md:rounded-full border border-white/20 shadow-xl w-full max-w-md mx-auto"
          >
            <div className="grid grid-cols-3 gap-0 divide-x divide-white/15">
              {[
                { value: "10 anni", label: "Esperienza", icon: <TrendingUp size={13} /> },
                { value: "AIGAE",   label: "Guide",       icon: <Shield size={13} /> },
                { value: "800+",    label: "Tesserati",   icon: <Users size={13} /> },
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

      {/* ── 2. ACCADEMIA ─────────────────────────────────────────────────────── */}
      {/*
        Section con animate default (true):
        - iOS      → CSS sectionFadeUp una volta sola al primo scroll
        - Non-iOS  → wrapper trasparente, il contenuto è già visibile
      */}
      <Section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1 w-8 bg-brand-sky rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-sky">
                Accademia Altour
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9]">
              Formazione <br />
              <span className="text-brand-sky italic font-light tracking-normal">Professionale.</span>
            </h2>
          </div>
          <button
            onClick={() => onNavigate("corsi")}
            className="group flex items-center gap-3 text-stone-400 hover:text-brand-sky transition-colors"
          >
            <span className="text-[10px] font-black uppercase tracking-widest">Vedi tutto</span>
            <div className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center group-hover:border-brand-sky group-hover:bg-brand-sky group-hover:text-white transition-colors">
              <ArrowRight size={16} />
            </div>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.slice(0, 3).map((corso, index) => (
            <div key={corso.id} className={index > 0 ? "hidden md:block" : "block"}>
              {/*
                CourseCard ha whileInView interno — su iOS il @supports
                in index.css neutralizza i backdrop-blur, ma le animazioni
                FM interne rimangono. Accettabile: whileInView si attiva
                una volta sola (once:true) e non causa flickering continuo.
              */}
              <CourseCard corso={corso} onBookingClick={onBookingClick} openDetails={openDetails} />
            </div>
          ))}
        </div>
      </Section>

      {/* ── 3. VOUCHER ───────────────────────────────────────────────────────── */}
      <Section className="max-w-4xl mx-auto px-4 py-12 md:py-20" delay={0.05}>
        <ScrollReveal>
          <div
            className="bg-white rounded-[2.5rem] overflow-hidden border border-stone-50"
            style={{ boxShadow: "0 0 80px -10px rgba(14,165,233,0.18), 0 0 40px -20px rgba(68,64,60,0.1), 0 25px 50px -12px rgba(0,0,0,0.1)" }}
          >
            <div className="flex flex-col md:flex-row min-h-[360px]">

              {/* Immagine */}
              <div className="w-full md:w-2/5 relative h-48 md:h-auto overflow-hidden">
                <img
                  src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20241231_144800.webp"
                  alt="Gift Experience Altour"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  onError={e => { e.currentTarget.src = IMG_FALLBACK; }}
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-brand-stone/70 to-transparent" />
                <div className="absolute bottom-6 left-8 text-white z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={14} className="text-brand-sky fill-brand-sky" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em]">Gift Experience</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase leading-none tracking-tighter italic">
                    Regala un'<br />avventura.
                  </h3>
                </div>
              </div>

              {/* Contenuto */}
              <div className="w-full md:w-3/5 p-8 md:p-14 flex flex-col justify-center bg-[#faf9f7]">
                <p className="text-stone-500 text-sm font-medium leading-relaxed mb-6">
                  Un'emozione da regalare a chi ami — utilizzabile per ogni tipo di esperienza Altour.
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-4">
                  Scegli l'importo
                </p>
                <div className="grid grid-cols-3 gap-2.5 mb-5">
                  {PRESET_VOUCHERS.map(({ amount, tag, highlight }) => (
                    <motion.button
                      key={amount}
                      {...motionSafe({ whileHover: { y: -2, scale: 1.04 }, whileTap: { scale: 0.95 } })}
                      onClick={() => onBookingClick(`Voucher Regalo da ${amount}€`)}
                      className={`relative flex flex-col items-center justify-center py-4 rounded-xl font-black transition-colors border-2 ${
                        highlight
                          ? "border-brand-sky bg-brand-sky text-white shadow-md shadow-sky-100"
                          : "border-stone-200 bg-white text-brand-stone hover:border-brand-sky hover:text-brand-sky"
                      }`}
                    >
                      <span className="text-base font-black leading-none">{amount}€</span>
                      {tag && (
                        <span className={`text-[7px] font-black uppercase tracking-wider mt-1 ${highlight ? "text-white/75" : "text-stone-400"}`}>
                          {tag}
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-stone-200" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-stone-300">oppure</span>
                  <div className="flex-1 h-px bg-stone-200" />
                </div>
                <motion.button
                  {...motionSafe({ whileHover: { scale: 1.01 }, whileTap: { scale: 0.98 } })}
                  onClick={() => onBookingClick("Richiesta Gift Voucher Personalizzato")}
                  className="w-full bg-brand-stone text-white py-4 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg hover:bg-brand-sky transition-colors flex items-center justify-center gap-2"
                >
                  <Gift size={12} /> Importo personalizzato
                </motion.button>
              </div>

            </div>
          </div>
        </ScrollReveal>
      </Section>

      {/* ── 4. ATTIVITÀ IN EVIDENZA ──────────────────────────────────────────── */}
      <Section className="max-w-6xl mx-auto px-4 py-20 md:py-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1 w-8 bg-brand-sky rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-sky">Attività Outdoor</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9]">
              Prossime <br />
              <span className="text-brand-sky italic font-light tracking-normal">Avventure.</span>
            </h2>
          </div>
          <button
            onClick={() => onNavigate("attivitapage")}
            className="group flex items-center gap-3 text-stone-400 hover:text-brand-sky transition-colors"
          >
            <span className="text-[10px] font-black uppercase tracking-widest">Vedi tutte le attività</span>
            <div className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center group-hover:border-brand-sky group-hover:bg-brand-sky group-hover:text-white transition-colors">
              <ArrowRight size={16} />
            </div>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredActivities.map(activity => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onDetails={() => openDetails(activity)}
              onBooking={() => onBookingClick(activity.titolo, "info")}
            />
          ))}
        </div>
      </Section>

      {/* ── 5. TAILOR-MADE ───────────────────────────────────────────────────── */}
      <Section className="max-w-4xl mx-auto px-4 py-8" delay={0.05}>
        <ScrollReveal>
          <div
            className="bg-white rounded-[2.5rem] overflow-hidden border border-stone-50"
            style={{ boxShadow: "0 0 80px -10px rgba(14,165,233,0.18), 0 0 40px -20px rgba(68,64,60,0.1), 0 25px 50px -12px rgba(0,0,0,0.1)" }}
          >
            <div className="flex flex-col md:flex-row min-h-[280px]">
              <div className="w-full md:w-2/5 relative h-48 md:h-auto overflow-hidden">
                <img
                  src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Box_avventura.webp"
                  alt="Escursione personalizzata Altour nelle Dolomiti"
                  className="absolute inset-0 w-full h-full object-cover object-[center_30%]"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-brand-stone/70 to-transparent" />
                <div className="absolute bottom-6 left-8 text-white z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={14} className="text-brand-sky" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em]">Progetti Personalizzati</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase leading-none tracking-tighter italic">
                    Su misura, <br /> per te.
                  </h3>
                </div>
              </div>
              <div className="w-full md:w-3/5 p-10 md:p-14 flex flex-col justify-center bg-[#faf9f7]">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-sky mb-3 block">
                  Progetti Personalizzati
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-brand-stone uppercase tracking-tighter leading-none mb-3">
                  Avventura{" "}
                  <span className="text-brand-sky italic font-light tracking-normal">su misura.</span>
                </h2>
                <p className="text-stone-500 text-sm font-medium max-w-sm leading-relaxed mb-8">
                  Hai un'idea specifica? Progettiamo tour privati e team building tracciando la rotta insieme a te.
                </p>
                <motion.button
                  {...motionSafe({ whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 } })}
                  onClick={() => onBookingClick("Esperienza su Misura", "info")}
                  className="w-full md:w-auto bg-brand-stone text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-brand-sky transition-colors flex items-center justify-center gap-3"
                >
                  Contattaci <Send size={14} />
                </motion.button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </Section>

      {/* ── Modal ────────────────────────────────────────────────────────────── */}
      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onBookingClick={onBookingClick}
        />
      )}

      {/* ── WhatsApp FAB ─────────────────────────────────────────────────────── */}
      {/*
        motionSafe: su iOS rimuove initial/animate/whileHover/whileTap.
        Il FAB è visibile subito (nessun fade-in) e non ha hover effects.
        Visivamente identico, zero layer GPU.
      */}
      <motion.a
        href="https://wa.me/393281613762"
        target="_blank"
        rel="noopener noreferrer"
        {...motionSafe({
          initial:    { scale: 0, opacity: 0 },
          animate:    { scale: 1, opacity: 1 },
          transition: { delay: 0.6, type: "spring", stiffness: 280, damping: 22 },
          whileHover: { scale: 1.04, y: -2 },
          whileTap:   { scale: 0.97 },
        })}
        className={`fixed bottom-6 right-6 z-[90] flex items-center justify-center w-14 h-14 rounded-full transition-opacity duration-200 ${
          isDetailOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        style={{
          background: "linear-gradient(145deg, #2ecc71 0%, #25D366 40%, #1aab52 100%)",
          boxShadow: "0 1px 0 0 rgba(255,255,255,0.25) inset, 0 -1px 0 0 rgba(0,0,0,0.15) inset, 0 6px 16px -2px rgba(37,211,102,0.55), 0 2px 4px -1px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)",
        }}
        aria-label="Contattaci su WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </motion.a>

    </div>
  );
}