import { useEffect, useState, useRef, useCallback } from "react";
import {
  Clock,
  TrendingUp,
  Gift,
  Star,
  Send,
  Shield,
  Users,
  ArrowRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import ActivityDetailModal from "../components/ActivityDetailModal";
import { motion } from "framer-motion";
import { CourseCard, Corso } from "../components/CourseCard";
import Section, { isIOS } from "../components/Section";

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

// ─── Skeleton ────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div
    className="bg-white rounded-2xl overflow-hidden flex flex-col"
    style={{
      boxShadow:
        "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
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
);

const IMG_FALLBACK = "/altour-logo.png";

export function iosClean(className: string): string {
  if (!isIOS) return className;
  return className
    .split(" ")
    .filter(c => !c.includes("backdrop-blur") && !c.includes("backdrop-filter"))
    .join(" ");
}

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
  "Tra mare e cielo":      "#7aaecd",
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

const PRESET_VOUCHERS = [
  { amount: 10,  tag: null,      highlight: false },
  { amount: 20,  tag: null,      highlight: false },
  { amount: 60,  tag: "Top",     highlight: true  },
  { amount: 100, tag: null,      highlight: false },
  { amount: 200, tag: "Premium", highlight: false },
  { amount: 300, tag: null,      highlight: false },
];

// ─── CSS keyframes hero ───────────────────────────────────────────────────────
// Separati dai keyframes di Section: l'hero ha una logica propria
// (animazioni staggerate al caricamento, non scroll-triggered).
const HERO_KEYFRAMES = `
  @keyframes heroFadeUp {
    from {
      opacity: 0;
      transform: translate3d(0, 18px, 0);
    }
    to {
      opacity: 1;
    }
  }
  @keyframes heroFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`;

// Nessun willChange: il browser gestisce il compositing layer
// internamente per la durata della CSS animation e lo rimuove da solo.
// fill-mode "both": invisibile durante il delay, visibile al termine.
function heroAnim(
  delay: number,
  name: "heroFadeUp" | "heroFadeIn" = "heroFadeUp",
  duration = 0.65
): React.CSSProperties {
  return {
    animation: `${name} ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s both`,
  };
}

// ─── ScrollReveal ─────────────────────────────────────────────────────────────
//
// Questo è il pezzo architetturale centrale dell'integrazione con Section.
//
// PROBLEMA: Section gestisce le animazioni di scroll su iOS via CSS.
// Su Android/Desktop, Framer Motion whileInView gestisce le animazioni.
// I due sistemi non devono MAI coesistere sullo stesso elemento:
// se Section anima il padre (sezione intera) E FM anima un figlio interno,
// su iOS l'utente vedrebbe una doppia animazione.
//
// SOLUZIONE: ScrollReveal è un componente che si comporta diversamente
// in base alla piattaforma:
//
//   iOS     → <>{children}</>
//             (wrapper trasparente: Section ha già gestito l'animazione
//              dell'intera sezione, niente FM all'interno)
//
//   Non-iOS → <motion.div whileInView ...>{children}</motion.div>
//             (FM gestisce l'animazione di scroll normalmente,
//              Section su non-iOS è trasparente e non interferisce)
//
// isIOS è calcolato una volta a livello di modulo → il ternario
// viene risolto al caricamento del bundle, non ad ogni render.
// React non vede mai due rami diversi dello stesso componente
// → nessuna violazione della regola dei hooks.

const ScrollReveal = isIOS
  ? ({ children }: { children: React.ReactNode }) => <>{children}</>
  : ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, delay, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    );

// ─── Componente principale ────────────────────────────────────────────────────
export default function Home({ onNavigate, onBookingClick }: HomeProps) {
  const [featuredActivities, setFeaturedActivities] = useState<FeaturedActivity[]>([]);
  const [courses, setCourses]                       = useState<Corso[]>([]);
  const [loading, setLoading]                       = useState(true);
  const [selectedActivity, setSelectedActivity]     = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen]             = useState(false);
  const [bgAnimDone, setBgAnimDone]                 = useState(false);

  const isMobile = useRef(
    typeof window !== "undefined" && window.innerWidth < 768
  ).current;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [{ data: allHikes }, { data: allCampi }, { data: crs }] =
          await Promise.all([
            supabase
              .from("escursioni")
              .select("*")
              .eq("is_active", true)
              .order("data", { ascending: true }),
            supabase
              .from("campi")
              .select("id, titolo, descrizione, immagine_url, prezzo, durata, slug"),
            supabase
              .from("corsi")
              .select("*")
              .order("posizione", { ascending: true }),
          ]);

        const hikes = ((allHikes ?? []) as any[]).map((e) => ({
          ...e,
          _tipo: "escursione" as const,
        }));
        const campi = ((allCampi ?? []) as any[]).map((c) => ({
          ...c,
          _tipo: "campo" as const,
        }));
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

  if (loading)
    return (
      <div className="min-h-screen bg-[#f5f2ed] overflow-x-hidden">
        <div className="h-[80vh] md:h-screen bg-stone-200 animate-pulse" />
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f5f2ed] overflow-x-hidden">

      <style dangerouslySetInnerHTML={{ __html: HERO_KEYFRAMES }} />

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      {/*
        animate={false}: l'hero non usa Section per le animazioni di scroll.
        Le sue animazioni sono staggerate al caricamento (heroAnim),
        non scroll-triggered. fullHeight usa la CSS var --vh di App.tsx.
        as="section" per semantica corretta.
      */}
      <Section
        animate={false}
        fullHeight
        as="section"
        className="flex items-center justify-center overflow-hidden"
      >
        {/* Background zoom — FM con will-change temporaneo */}
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
            onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }}
          />
        </motion.div>

        <div
          className="absolute inset-0 bg-black/30"
          style={heroAnim(0, "heroFadeIn", 1.0)}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-[70%] to-[#f5f2ed]" />

        <div className="relative z-10 text-center max-w-4xl w-full px-4 flex flex-col items-center">

          <div style={heroAnim(0.5)} className="mb-3">
            <h1 className="text-6xl md:text-7xl font-black text-white uppercase tracking-tighter drop-shadow-2xl leading-none">
              Altour
            </h1>
            <p className="text-sm md:text-xl font-bold uppercase tracking-[0.4em] text-white/75 mt-2">
              Italy
            </p>
          </div>

          <p
            style={heroAnim(0.7, "heroFadeUp", 0.6)}
            className="text-white/65 text-sm md:text-base font-medium max-w-xs md:max-w-md mx-auto mb-8 leading-relaxed"
          >
            Formazione ed attività outdoor
          </p>

          <div
            style={heroAnim(0.9, "heroFadeUp", 0.6)}
            className="flex flex-col sm:flex-row items-stretch gap-3 w-full max-w-sm mx-auto mb-10 md:mb-12"
          >
            <button
              onClick={() => onNavigate("attivitapage")}
              className={iosClean("flex-1 flex items-center justify-center gap-2 bg-white/12 hover:bg-white/22 text-white font-black uppercase text-[10px] tracking-widest py-4 px-5 rounded-2xl border border-white/25 active:scale-95 transition-colors")}
            >
              Esplora Attività <ArrowRight size={12} />
            </button>
            <button
              onClick={() => onNavigate("corsi")}
              className={iosClean("flex-1 flex items-center justify-center gap-2 bg-white/12 hover:bg-white/22 text-white font-black uppercase text-[10px] tracking-widest py-4 px-5 rounded-2xl border border-white/25 active:scale-95 transition-colors")}
            >
              Vai all'Accademia <ArrowRight size={12} />
            </button>
          </div>

          <div
            style={heroAnim(1.1, "heroFadeUp", 0.6)}
            className="bg-white/15 py-4 px-4 md:px-8 rounded-[1.5rem] md:rounded-full border border-white/20 shadow-xl w-full max-w-md mx-auto"
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

      {/* ── 2. ACCADEMIA ────────────────────────────────────────────────────── */}
      {/*
        Section con animate={true} (default):
        - iOS      → CSS sectionFadeUp al primo scroll nella viewport
        - Non-iOS  → wrapper trasparente, nessuna animazione aggiunta
                     (il contenuto è già visibile, ScrollReveal non usato qui
                      perché l'intera sezione è troppo grande per un fade unitario)
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

      {/* ── 3. VOUCHER ──────────────────────────────────────────────────────── */}
      {/*
        Section gestisce il fade-in su iOS.
        ScrollReveal aggiunge whileInView su Android/Desktop, ed è un
        no-op trasparente su iOS (evita doppia animazione).
      */}
      <Section className="max-w-4xl mx-auto px-4 py-12 md:py-20" delay={0.05}>
        <ScrollReveal>
          <div
            className="bg-white rounded-[2.5rem] overflow-hidden border border-stone-50"
            style={{
              boxShadow:
                "0 0 80px -10px rgba(14,165,233,0.18), 0 0 40px -20px rgba(68,64,60,0.1), 0 25px 50px -12px rgba(0,0,0,0.1)",
            }}
          >
            <div className="flex flex-col md:flex-row min-h-[360px]">

              <div className="w-full md:w-2/5 relative h-48 md:h-auto overflow-hidden">
                <img
                  src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20241231_144800.webp"
                  alt="Paesaggio innevato Trentino — Gift Experience Altour"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }}
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
                      whileHover={{ y: -2, scale: 1.04 }}
                      whileTap={{ scale: 0.95 }}
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
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onBookingClick("Richiesta Gift Voucher Personalizzato")}
                  className="w-full bg-brand-stone text-white py-4 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg hover:bg-brand-sky transition-colors flex items-center justify-center gap-2"
                >
                  <Gift size={12} />
                  Importo personalizzato
                </motion.button>
              </div>

            </div>
          </div>
        </ScrollReveal>
      </Section>

      {/* ── 4. ATTIVITÀ IN EVIDENZA ─────────────────────────────────────────── */}
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
            <div className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center group-hover:border-brand-sky group-hover:bg-brand-sky group-hover:text-white transition-all">
              <ArrowRight size={16} />
            </div>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredActivities.map((activity) => {
            const isEscursione = activity._tipo === "escursione";
            return (
              <div
                key={activity.id}
                className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 flex flex-col group hover:shadow-2xl transition-shadow duration-500"
              >
                <div className="aspect-[16/9] md:h-56 md:aspect-auto bg-stone-200 relative overflow-hidden">
                  {activity.immagine_url && (
                    <img
                      src={activity.immagine_url}
                      alt={activity.titolo}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
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
                      onClick={() => openDetails(activity)}
                      className="flex-1 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest border-2 border-stone-200 text-stone-600 hover:border-stone-400 transition-colors active:scale-95"
                    >
                      Dettagli
                    </button>
                    <button
                      onClick={() => onBookingClick(activity.titolo, "info")}
                      className="flex-[1.5] py-3 rounded-xl font-black uppercase text-[9px] tracking-widest bg-brand-sky text-white shadow-lg hover:bg-[#0284c7] transition-colors active:scale-95"
                    >
                      Richiedi Info
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── 5. TAILOR-MADE ──────────────────────────────────────────────────── */}
      <Section className="max-w-4xl mx-auto px-4 py-8" delay={0.05}>
        <ScrollReveal>
          <div
            className="bg-white rounded-[2.5rem] overflow-hidden border border-stone-50"
            style={{
              boxShadow:
                "0 0 80px -10px rgba(14,165,233,0.18), 0 0 40px -20px rgba(68,64,60,0.1), 0 25px 50px -12px rgba(0,0,0,0.1)",
            }}
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
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
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
      <motion.a
        href="https://wa.me/393281613762"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 280, damping: 22 }}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.97 }}
        className={`fixed bottom-6 right-6 z-[90] flex items-center justify-center w-14 h-14 rounded-full transition-opacity duration-200 ${
          isDetailOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        style={{
          background: "linear-gradient(145deg, #2ecc71 0%, #25D366 40%, #1aab52 100%)",
          boxShadow:
            "0 1px 0 0 rgba(255,255,255,0.25) inset, 0 -1px 0 0 rgba(0,0,0,0.15) inset, 0 6px 16px -2px rgba(37,211,102,0.55), 0 2px 4px -1px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)",
        }}
        aria-label="Contattaci su WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6 relative">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </motion.a>

    </div>
  );
}