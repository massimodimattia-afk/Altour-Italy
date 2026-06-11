import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Shield, Cookie, FileText } from "lucide-react";

type Tab = "privacy" | "cookie" | "termini";

interface LegalProps {
  initialTab?: Tab;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "privacy",  label: "Privacy Policy", icon: <Shield size={14} /> },
  { id: "cookie",   label: "Cookie Policy",  icon: <Cookie size={14} /> },
  { id: "termini",  label: "Termini",        icon: <FileText size={14} /> },
];

export default function Legal({ initialTab = "privacy" }: LegalProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  return (
    <div className="min-h-screen bg-[#f5f2ed]">
      {/* HERO */}
      <div className="bg-[#2a2723] px-4 pt-16 pb-12 text-center">
        <p className="text-brand-sky text-[9px] font-black uppercase tracking-[0.4em] mb-3">
          Altour Italy
        </p>
        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">
          Informazioni Legali
        </h1>
        <p className="text-stone-400 text-xs font-medium mt-3">
          Ultimo aggiornamento: giugno 2026
        </p>
      </div>

      {/* TAB BAR */}
      <div className="sticky top-16 z-40 bg-[#f5f2ed] border-b border-stone-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex gap-1 py-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id
                    ? "bg-brand-stone text-white shadow-md"
                    : "text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-[2rem] shadow-sm border border-stone-100 p-8 md:p-12 prose prose-stone max-w-none"
        >
          {activeTab === "privacy" && <PrivacyContent />}
          {activeTab === "cookie"  && <CookieContent />}
          {activeTab === "termini" && <TerminiContent />}
        </motion.div>
      </div>
    </div>
  );
}

// ─── PRIVACY POLICY (widget CookieYes) ───────────────────────────────────────
function PrivacyContent() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const existing = document.getElementById("cky-privacy-policy");
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.id = "cky-privacy-policy";
    script.type = "text/javascript";
    script.src =
      "https://cdn-cookieyes.com/client_data/bd86c83e437d4d20544eac792282a41f/privacy-policy/script.js";
    script.async = true;

    container.appendChild(script);

    return () => {
      const s = document.getElementById("cky-privacy-policy");
      if (s) s.remove();
    };
  }, []);

  return (
    <div ref={containerRef}>
      <p className="text-stone-400 text-xs text-center py-4">
        Caricamento Privacy Policy…
      </p>
    </div>
  );
}

// ─── COOKIE POLICY (widget CookieYes) ────────────────────────────────────────
function CookieContent() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Rimuovi eventuale script precedente (es. cambio tab avanti/indietro)
    const existing = document.getElementById("cky-cookie-policy");
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.id = "cky-cookie-policy";
    script.type = "text/javascript";
    script.src =
      "https://cdn-cookieyes.com/client_data/bd86c83e437d4d20544eac792282a41f/cookie-policy/script.js";
    script.async = true;

    container.appendChild(script);

    return () => {
      // Cleanup all'unmount
      const s = document.getElementById("cky-cookie-policy");
      if (s) s.remove();
    };
  }, []);

  return (
    <div ref={containerRef}>
      {/* Il widget CookieYes si renderizza qui */}
      <p className="text-stone-400 text-xs text-center py-4">
        Caricamento Cookie Policy…
      </p>
    </div>
  );
}

// ─── TERMINI ─────────────────────────────────────────────────────────────────
function TerminiContent() {
  return (
    <>
      <Section title="Accettazione dei Termini">
        <p>L'utilizzo del sito altouritaly.it implica l'accettazione dei presenti Termini di Servizio. Se non accetti queste condizioni, ti invitiamo a non utilizzare il sito.</p>
      </Section>

      <Section title="Servizi Offerti">
        <p>Altour Italy offre escursioni guidate, corsi outdoor e tour in natura condotti da guide certificate AIGAE. Le informazioni presenti sul sito hanno carattere orientativo; prezzi, date e disponibilità sono soggetti a variazioni e vengono confermati al momento della prenotazione.</p>
      </Section>

      <Section title="Prenotazioni e Pagamenti">
        <ul>
          <li>Le richieste di prenotazione inviate tramite il sito non costituiscono contratto fino alla conferma esplicita da parte di Altour Italy.</li>
          <li>Le modalità di pagamento e le condizioni di cancellazione vengono comunicate al momento della conferma.</li>
          <li>In caso di cancellazione da parte del cliente, si applicano le condizioni comunicate in fase di prenotazione.</li>
          <li>Altour Italy si riserva il diritto di annullare un'escursione per cause di forza maggiore (condizioni meteo, sicurezza del percorso). In tal caso verrà proposta una data alternativa o il rimborso integrale.</li>
        </ul>
      </Section>

      <Section title="Tessera Fedeltà">
        <p>La tessera fedeltà è strettamente personale e non cedibile. I premi maturati (voucher) hanno validità di 12 mesi dalla data di emissione e sono utilizzabili esclusivamente per servizi Altour Italy.</p>
      </Section>

      <Section title="Partecipazione e Responsabilità">
        <p>La partecipazione alle attività outdoor comporta rischi intrinseci. I partecipanti sono tenuti a:</p>
        <ul>
          <li>Dichiarare eventuali condizioni di salute rilevanti prima dell'escursione.</li>
          <li>Dotarsi dell'attrezzatura consigliata dalla guida.</li>
          <li>I minori di 18 anni devono partecipare con il consenso scritto del genitore o tutore legale.</li>
        </ul>
        <p>Altour Italy declina ogni responsabilità per danni derivanti dalla mancata osservanza delle indicazioni delle guide.</p>
      </Section>

      <Section title="Proprietà Intellettuale">
        <p>Tutti i contenuti del sito (testi, immagini, loghi, grafica) sono di proprietà di Altour Italy o utilizzati con licenza. È vietata la riproduzione senza autorizzazione scritta.</p>
      </Section>

      <Section title="Legge Applicabile">
        <p>I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia è competente il Foro territorialmente competente in base alla sede legale di Altour Italy.</p>
      </Section>

      <Section title="Contatti">
        <p>Per qualsiasi domanda: <a href="mailto:info.altouritaly@gmail.com">info.altouritaly@gmail.com</a> — +39 328 1613762</p>
      </Section>
    </>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10 last:mb-0">
      <h2 className="text-xs font-black uppercase tracking-[0.25em] text-brand-sky mb-4 flex items-center gap-2">
        <span className="h-px flex-1 bg-stone-100" />
        {title}
        <span className="h-px flex-1 bg-stone-100" />
      </h2>
      <div className="text-stone-600 text-sm leading-relaxed space-y-3">{children}</div>
    </div>
  );
}