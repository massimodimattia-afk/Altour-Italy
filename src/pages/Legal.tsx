import { useState } from "react";
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
          Ultimo aggiornamento: gennaio 2026
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

// ─── PRIVACY POLICY ──────────────────────────────────────────────────────────
function PrivacyContent() {
  return (
    <>
      <Section title="Titolare del Trattamento">
        <p>
          <strong>Altour Italy</strong><br />
          P.IVA 04412340263<br />
          Email: <a href="mailto:info.altouritaly@gmail.com">info.altouritaly@gmail.com</a><br />
          Telefono: +39 328 1613762
        </p>
      </Section>

      <Section title="Dati Raccolti">
        <p>Raccogliamo esclusivamente i dati necessari all'erogazione dei nostri servizi:</p>
        <ul>
          <li><strong>Dati di contatto</strong> — nome, indirizzo email e numero di telefono forniti tramite il modulo di richiesta informazioni o prenotazione.</li>
          <li><strong>Dati della tessera</strong> — codice tessera e storico delle escursioni completate, memorizzati nel nostro database sicuro (Supabase).</li>
          <li><strong>Dati tecnici</strong> — identificativo di sessione salvato in <code>localStorage</code> del browser, esclusivamente per mantenere l'accesso alla tessera senza richiedere il login ad ogni visita. Nessun dato personale è contenuto in questo identificativo.</li>
        </ul>
      </Section>

      <Section title="Finalità e Base Giuridica">
        <ul>
          <li><strong>Gestione richieste</strong> — rispondere alle richieste di informazioni e prenotazioni (art. 6.1.b GDPR — esecuzione di un contratto).</li>
          <li><strong>Gestione tessera fedeltà</strong> — tracciare le escursioni completate e i premi maturati (art. 6.1.b GDPR).</li>
          <li><strong>Comunicazioni commerciali</strong> — solo previo consenso esplicito (art. 6.1.a GDPR).</li>
        </ul>
      </Section>

      <Section title="Conservazione dei Dati">
        <p>I dati di contatto sono conservati per il tempo necessario alla gestione della richiesta e, in caso di rapporto continuativo, per tutta la durata dello stesso più 2 anni. I dati della tessera sono conservati fino alla cancellazione esplicita da parte dell'utente.</p>
      </Section>

      <Section title="Diritti dell'Interessato">
        <p>In qualsiasi momento puoi esercitare i seguenti diritti scrivendo a <a href="mailto:info.altouritaly@gmail.com">info.altouritaly@gmail.com</a>:</p>
        <ul>
          <li>Accesso, rettifica o cancellazione dei tuoi dati</li>
          <li>Limitazione o opposizione al trattamento</li>
          <li>Portabilità dei dati</li>
          <li>Revoca del consenso in qualsiasi momento</li>
          <li>Proporre reclamo al Garante per la Protezione dei Dati Personali (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">garanteprivacy.it</a>)</li>
        </ul>
      </Section>

      <Section title="Trasferimento Dati">
        <p>I dati sono conservati su server Supabase (UE). Nessun dato viene trasferito a terze parti per finalità di marketing o profilazione.</p>
      </Section>
    </>
  );
}

// ─── COOKIE POLICY ───────────────────────────────────────────────────────────
function CookieContent() {
  return (
    <>
      <Section title="Cosa sono i Cookie">
        <p>I cookie sono piccoli file di testo che i siti web salvano sul dispositivo dell'utente. Questo sito utilizza esclusivamente tecnologie di memorizzazione tecnica, strettamente necessarie al funzionamento.</p>
      </Section>

      <Section title="Tecnologie Utilizzate">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="text-left py-2 pr-4 text-[10px] uppercase tracking-widest text-stone-400 font-black">Nome</th>
                <th className="text-left py-2 pr-4 text-[10px] uppercase tracking-widest text-stone-400 font-black">Tipo</th>
                <th className="text-left py-2 pr-4 text-[10px] uppercase tracking-widest text-stone-400 font-black">Scopo</th>
                <th className="text-left py-2 text-[10px] uppercase tracking-widest text-stone-400 font-black">Durata</th>
              </tr>
            </thead>
            <tbody className="text-stone-600">
              <tr className="border-b border-stone-100">
                <td className="py-3 pr-4 font-mono text-xs">altour_session_v4</td>
                <td className="py-3 pr-4">localStorage</td>
                <td className="py-3 pr-4">Mantiene la sessione della tessera fedeltà tra una visita e l'altra</td>
                <td className="py-3">7 giorni</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-stone-500">
          Questa tecnologia è di natura <strong>strettamente tecnica</strong>: non traccia l'utente, non raccoglie dati personali e non richiede consenso ai sensi del Provvedimento del Garante Privacy e della Direttiva ePrivacy.
        </p>
      </Section>

      <Section title="Cookie di Terze Parti">
        <p>Questo sito <strong>non utilizza</strong> cookie di profilazione, cookie analitici di terze parti (es. Google Analytics), né pixel pubblicitari (es. Meta Pixel). Non viene effettuato alcun tracciamento inter-sito dell'utente.</p>
      </Section>

      <Section title="Come Eliminare i Dati di Sessione">
        <p>Puoi eliminare i dati salvati in <code>localStorage</code> in qualsiasi momento:</p>
        <ul>
          <li><strong>Chrome / Edge</strong> — Impostazioni → Privacy e sicurezza → Cancella dati di navigazione → Seleziona "Cookie e altri dati dei siti"</li>
          <li><strong>Firefox</strong> — Impostazioni → Privacy e sicurezza → Cookie e dati dei siti → Rimuovi dati</li>
          <li><strong>Safari</strong> — Preferenze → Privacy → Gestisci dati dei siti web</li>
        </ul>
        <p>In alternativa, dalla pagina Tessera puoi effettuare il logout per eliminare la sessione corrente.</p>
      </Section>
    </>
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

      <Section title="Responsabilità">
        <p>La partecipazione alle attività outdoor comporta rischi intrinseci. I partecipanti sono tenuti a dichiarare eventuali condizioni di salute rilevanti prima dell'escursione e a dotarsi dell'attrezzatura consigliata. Altour Italy declina ogni responsabilità per danni derivanti dalla mancata osservanza delle indicazioni delle guide.</p>
      </Section>

      <Section title="Proprietà Intellettuale">
        <p>Tutti i contenuti del sito (testi, immagini, loghi, grafica) sono di proprietà di Altour Italy o utilizzati con licenza. È vietata la riproduzione senza autorizzazione scritta.</p>
      </Section>

      <Section title="Legge Applicabile">
        <p>I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia è competente il Foro di Roma.</p>
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