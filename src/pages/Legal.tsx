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

// ─── PRIVACY POLICY ──────────────────────────────────────────────────────────
function PrivacyContent() {
  return (
    <>
      <Section title="Titolare del Trattamento">
        <p>
          <strong>Altour Italy</strong> — Claudio Corazza
          Via/Indirizzo: Roma, Italia — 00151<br />
          Email: <a href="mailto:info@altouritaly.it">info@altouritaly.it</a><br />
          Telefono: +39 328 1613762
        </p>
        <p>
          La presente informativa descrive come raccogliamo, trattiamo e condividiamo i tuoi dati
          in occasione della visita al sito{" "}
          <a href="https://www.altouritaly.it" target="_blank" rel="noopener noreferrer">
            altouritaly.it
          </a>
          . Utilizzando il sito, accetti le pratiche descritte nel presente documento.
        </p>
      </Section>

      <Section title="Dati Raccolti">
        <p>Raccogliamo esclusivamente i dati necessari all'erogazione dei nostri servizi:</p>
        <ul>
          <li><strong>Dati di contatto</strong> — nome e indirizzo email forniti tramite il modulo di richiesta informazioni o prenotazione.</li>
          <li><strong>Dati della tessera</strong> — codice tessera e storico delle escursioni completate, memorizzati nel nostro database sicuro (Supabase).</li>
          <li><strong>Dati tecnici</strong> — identificativo di sessione salvato in <code>localStorage</code> del browser per mantenere l'accesso alla tessera tra una visita e l'altra. Nessun dato personale è contenuto in questo identificativo.</li>
          <li><strong>Preferenze cookie</strong> — le scelte espresse tramite il banner di consenso vengono salvate in un cookie tecnico di prima parte (CookieYes).</li>
          <li><strong>Dati raccolti automaticamente</strong> — quando accedi al sito da un dispositivo, potremmo raccogliere automaticamente dati tecnici dal dispositivo stesso (es. tipo di browser, sistema operativo) al solo fine di garantire il corretto funzionamento del servizio.</li>
        </ul>
      </Section>

      <Section title="Finalità e Base Giuridica">
        <ul>
          <li><strong>Erogazione del servizio</strong> — fornire e mantenere il sito e le sue funzionalità (art. 6.1.b GDPR — esecuzione di un contratto).</li>
          <li><strong>Gestione richieste e prenotazioni</strong> — rispondere alle richieste di informazioni (art. 6.1.b GDPR).</li>
          <li><strong>Gestione tessera fedeltà</strong> — tracciare le escursioni completate e i premi maturati (art. 6.1.b GDPR).</li>
          <li><strong>Gestione consenso cookie</strong> — memorizzare le preferenze espresse tramite il banner (art. 6.1.c GDPR — obbligo legale).</li>
          <li><strong>Miglioramento del servizio</strong> — valutare e migliorare i nostri prodotti e servizi (art. 6.1.f GDPR — legittimo interesse).</li>
          <li><strong>Comunicazioni commerciali</strong> — solo previo consenso esplicito (art. 6.1.a GDPR).</li>
        </ul>
      </Section>

      <Section title="Conservazione dei Dati">
        <p>
          Conserviamo i tuoi dati personali solo per il tempo necessario alle finalità descritte,
          salvo obblighi di legge. I dati di contatto vengono conservati per tutta la durata del
          rapporto e per i 2 anni successivi. I dati della tessera sono conservati fino alla
          cancellazione esplicita da parte dell'utente. Le preferenze cookie vengono conservate
          per 1 anno. Quando non sussiste più alcuna esigenza legittima, i dati vengono eliminati
          o anonimizzati.
        </p>
      </Section>

      <Section title="Terze Parti e Sub-responsabili">
        <p>Il sito si avvale dei seguenti servizi esterni. Non vendiamo né condividiamo i tuoi dati con terze parti per finalità di marketing o profilazione.</p>
        <ul>
          <li>
            <strong>Supabase</strong> — database e storage (server UE).{" "}
            <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Privacy policy</a>
          </li>
          <li>
            <strong>CookieYes</strong> — gestione consenso cookie.{" "}
            <a href="https://www.cookieyes.com/privacy-policy/" target="_blank" rel="noopener noreferrer">Privacy policy</a>
          </li>
          <li>
            <strong>Google Fonts</strong> — caricamento font tipografici.{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy policy</a>
          </li>
          <li>
            <strong>OpenStreetMap</strong> — mappe interattive.{" "}
            <a href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer">Privacy policy</a>
          </li>
          <li>
            <strong>Vercel</strong> — hosting e CDN.{" "}
            <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy policy</a>
          </li>
        </ul>
      </Section>

      <Section title="Cookie e Tecnologie Simili">
        <p>
          Utilizziamo cookie e tecnologie simili per garantire il funzionamento del sito e
          memorizzare le tue preferenze. Per informazioni dettagliate consulta la nostra{" "}
          <button
            className="text-brand-sky underline underline-offset-2 bg-transparent border-0 p-0 cursor-pointer font-medium"
            onClick={() => {
              // navigazione alla tab cookie — gestita dal parent tramite prop se necessario
              const cookieBtn = document.querySelector<HTMLButtonElement>('[data-tab="cookie"]');
              cookieBtn?.click();
            }}
          >
            Cookie Policy
          </button>
          .
        </p>
      </Section>

      <Section title="Richieste Do Not Track">
        <p>Il nostro sito non risponde alle richieste "Do Not Track" (DNT) dei browser, in quanto non effettuiamo tracciamento inter-sito dell'utente.</p>
      </Section>

      <Section title="Riservatezza dei Minori">
        <p>
          Non forniamo consapevolmente i nostri servizi online a minorenni senza il consenso del
          genitore o tutore legale. Se sei genitore e ritieni che tuo figlio ci abbia fornito dati
          senza il tuo consenso, contattaci a{" "}
          <a href="mailto:info@altouritaly.it">info@altouritaly.it</a>: provvederemo
          alla rimozione immediata dei dati.
        </p>
      </Section>

      <Section title="Sicurezza">
        <p>
          Adottiamo misure di sicurezza tecniche e organizzative adeguate per proteggere i tuoi
          dati. Tuttavia, nessun metodo di trasmissione su internet o di archiviazione digitale è
          infallibile al 100%. In caso di violazione dei dati che comporti rischi per i tuoi
          diritti, provvederemo a notificarti nei termini previsti dalla normativa vigente.
        </p>
      </Section>

      <Section title="Diritti dell'Interessato">
        <p>
          In qualsiasi momento puoi esercitare i seguenti diritti scrivendo a{" "}
          <a href="mailto:info@altouritaly.it">info@altouritaly.it</a>:
        </p>
        <ul>
          <li>Accesso, rettifica o cancellazione dei tuoi dati</li>
          <li>Limitazione o opposizione al trattamento</li>
          <li>Portabilità dei dati</li>
          <li>Revoca del consenso in qualsiasi momento (senza pregiudicare la liceità del trattamento precedente)</li>
          <li>
            Proporre reclamo al Garante per la Protezione dei Dati Personali{" "}
            <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">
              garanteprivacy.it
            </a>
          </li>
        </ul>
      </Section>

      <Section title="Modifiche alla presente Informativa">
        <p>
          Potremmo aggiornare periodicamente questa informativa per recepire modifiche normative o
          variazioni nelle nostre pratiche. Ti consigliamo di consultarla di tanto in tanto. La
          versione aggiornata entra in vigore dalla data di pubblicazione su questa pagina.
        </p>
      </Section>
    </>
  );
}

// ─── COOKIE POLICY ───────────────────────────────────────────────────────────
function CookieContent() {
  return (
    <>
      <Section title="Cosa sono i Cookie">
        <p>
          I cookie sono piccoli file di testo che i siti web salvano sul dispositivo dell'utente
          per garantire il corretto funzionamento del sito, memorizzare le preferenze e, in alcuni
          casi, raccogliere informazioni statistiche.
        </p>
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
              <tr className="border-b border-stone-100">
                <td className="py-3 pr-4 font-mono text-xs">cookieyes-consent</td>
                <td className="py-3 pr-4">Cookie (1ª parte)</td>
                <td className="py-3 pr-4">Memorizza le preferenze di consenso espresse tramite il banner cookie</td>
                <td className="py-3">1 anno</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-stone-500">
          Il cookie <code>altour_session_v4</code> è di natura <strong>strettamente tecnica</strong>:
          non traccia l'utente, non raccoglie dati personali e non richiede consenso ai sensi del
          Provvedimento del Garante Privacy e della Direttiva ePrivacy. Il cookie{" "}
          <code>cookieyes-consent</code> è anch'esso tecnico, necessario per ricordare le tue
          scelte sul banner.
        </p>
      </Section>

      <Section title="Cookie di Terze Parti">
        <p>
          Questo sito <strong>non utilizza</strong> cookie di profilazione, cookie analitici di
          terze parti (es. Google Analytics), né pixel pubblicitari (es. Meta Pixel). Non viene
          effettuato alcun tracciamento inter-sito dell'utente.
        </p>
        <p>
          Il servizio CookieYes (gestore del banner di consenso) può impostare cookie tecnici
          necessari al proprio funzionamento. Per dettagli:{" "}
          <a href="https://www.cookieyes.com/privacy-policy/" target="_blank" rel="noopener noreferrer">
            cookieyes.com/privacy-policy
          </a>
          .
        </p>
      </Section>

      <Section title="Gestione delle Preferenze">
        <p>
          Puoi modificare o revocare il tuo consenso in qualsiasi momento cliccando sul pulsante
          "Gestisci cookie" presente nel footer del sito, oppure tramite le impostazioni del tuo
          browser.
        </p>
      </Section>

      <Section title="Come Eliminare i Dati di Sessione">
        <p>Puoi eliminare i dati salvati in <code>localStorage</code> e i cookie in qualsiasi momento:</p>
        <ul>
          <li><strong>Chrome / Edge</strong> — Impostazioni → Privacy e sicurezza → Cancella dati di navigazione → "Cookie e altri dati dei siti"</li>
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
        <p>Per qualsiasi domanda: <a href="mailto:info@altouritaly.it">info@altouritaly.it</a> — +39 328 1613762</p>
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