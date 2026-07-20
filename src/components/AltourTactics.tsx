import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase'; // Centralizzato e tipizzato con <Database>

// --- 1. TYPING & DATI SENTIERISTICI ---
type SkillTag =
  | 'abbigliamento' | 'attrezzatura1' | 'calzature' | 'cartografia'
  | 'alimentazione' | 'allenamento' | 'ecocompatibilita' | 'orientamento_strumentale'
  | 'prevenzione' | 'primosoccorso' | 'sentieristica'
  | 'attrezzatura2' | 'geodesia' | 'meteorologia' | 'parchi' | 'progettazione';

type CourseLevel = 'base' | 'intermedio' | 'avanzato';

interface Course {
  id: string;
  level: CourseLevel;
  skill: SkillTag;
  title: string;
  desc: string;
  url: string;
}

const LOCAL_COURSES: Course[] = [
  // MODULI CORSO BASE
  { id: 'b1', level: 'base', skill: 'abbigliamento', title: 'Abbigliamento', desc: 'Stratificazione e gestione termica ottimale.', url: '/corsi/base' },
  { id: 'b2', level: 'base', skill: 'attrezzatura1', title: 'Attrezzatura I', desc: 'Organizzazione ottimale e calcolo del carico dello zaino.', url: '/corsi/base' },
  { id: 'b3', level: 'base', skill: 'calzature', title: 'Calzature', desc: 'Scelta della calzatura e prevenzione delle problematiche del piede.', url: '/corsi/base' },
  { id: 'b4', level: 'base', skill: 'cartografia', title: 'Lettura ed interpretazione di una carta geografica', desc: 'Interpretazione di simboli, distanze ed equidistanze sulla topografica.', url: '/corsi/base' },
  // MODULI CORSO INTERMEDIO
  { id: 'i1', level: 'intermedio', skill: 'alimentazione', title: 'Alimentazione', desc: 'Gestione ottimale dei nutrienti e bilancio idrico in escursione.', url: '/corsi/intermedio' },
  { id: 'i2', level: 'intermedio', skill: 'allenamento', title: 'Allenamento', desc: 'Ottimizzazione della progressione e respirazione diaframmatica.', url: '/corsi/intermedio' },
  { id: 'i3', level: 'intermedio', skill: 'ecocompatibilita', title: 'Comportamenti ecocompatibili', desc: 'Rispetto dell\'ambiente montano e della fauna.', url: '/corsi/intermedio' },
  { id: 'i4', level: 'intermedio', skill: 'orientamento_strumentale', title: 'Orientamento strumentale', desc: 'Uso sinergico di carta, bussola e altimetro sul campo.', url: '/corsi/intermedio' },
  { id: 'i5', level: 'intermedio', skill: 'prevenzione', title: 'Prevenzione pericoli', desc: 'Gestione ed analisi del rischio oggettivo in ambiente montano.', url: '/corsi/intermedio' },
  { id: 'i6', level: 'intermedio', skill: 'primosoccorso', title: 'Primo soccorso', desc: 'Gestione delle emergenze sanitarie montane, inclusi i viperidi.', url: '/corsi/intermedio' },
  { id: 'i7', level: 'intermedio', skill: 'sentieristica', title: 'Sentieristica', desc: 'Studio e decodifica della numerazione e dei settori della rete CAI.', url: '/corsi/intermedio' },
  // MODULI CORSO AVANZATO
  { id: 'a1', level: 'avanzato', skill: 'attrezzatura2', title: 'Attrezzatura II', desc: 'Strumentazione tecnica avanzata per terreni esposti o invernali.', url: '/corsi/avanzato' },
  { id: 'a2', level: 'avanzato', skill: 'geodesia', title: 'Elementi di Geodesia', desc: 'Sistemi di riferimento, altimetria e coordinate.', url: '/corsi/avanzato' },
  { id: 'a3', level: 'avanzato', skill: 'meteorologia', title: 'Elementi di Meteorologia', desc: 'Previsioni complesse ed evoluzione dei fenomeni atmosferici in quota.', url: '/corsi/avanzato' },
  { id: 'a4', level: 'avanzato', skill: 'parchi', title: 'Parchi ed Aree protette', desc: 'Normative di tutela delle riserves e gestione del territorio.', url: '/corsi/avanzato' },
  { id: 'a5', level: 'avanzato', skill: 'progettazione', title: 'Progettazione di una escursione', desc: 'Pianificazione avanzata a tavolino, dislivelli e vie di fuga.', url: '/corsi/avanzato' },
];

interface StepOption {
  id: string;
  label: string;
  isCorrect?: boolean;
  skillTag?: SkillTag;
}

interface Step {
  id: string;
  kind: 'profiling' | 'objective' | 'knowledge';
  type: 'single' | 'multi';
  tag: string;
  scenario?: string;
  question: string;
  options: StepOption[];
  allowOther?: boolean;
}

const OTHER_ID = 'altro';
const GAE_OPTION_ID = 'obiettivo-gae';
const BRAND_COLOR = '#7aaecd';
const BRAND_BG_LIGHT = 'rgba(122, 174, 205, 0.1)';

const EXPERIENCE_WEIGHT: Record<string, number> = {
  'esp-oltre20': 4,
  'esp-5-20': 3,
  'esp-1-5': 2,
  'esp-meno1': 0, 
  'esp-zero': 0,  
};

const STEPS: Step[] = [
  // --- SEZIONE 1: PROFILAZIONE INTERATTIVA ---
  { id: 'esperienza', kind: 'profiling', type: 'single', tag: 'Il tuo profilo', question: 'Da quanti anni pratichi attività escursionistica?', allowOther: true, options: [ { id: 'esp-oltre20', label: 'Da oltre 20 anni' }, { id: 'esp-5-20', label: 'Tra i 5 e i 20 anni' }, { id: 'esp-1-5', label: 'Tra 1 e 5 anni' }, { id: 'esp-meno1', label: 'Meno di 1 anno' }, { id: 'esp-zero', label: 'Non ho esperienza' } ] },
  { id: 'frequenza', kind: 'profiling', type: 'single', tag: 'Il tuo profilo', question: 'Con quale frequenza esci in natura?', allowOther: true, options: [ { id: 'freq-mai', label: 'Mai' }, { id: 'freq-1-3anno', label: '1/3 volte l\'anno' }, { id: 'freq-mese', label: 'Una volta al mese' }, { id: 'freq-settimana', label: 'Ogni settimana' }, { id: 'freq-piu-settimana', label: 'Più volte a settimana' } ] },
  { id: 'modalita', kind: 'profiling', type: 'multi', tag: 'Il tuo profilo', question: 'Quando vuoi svolgere una attività preferisci ... (anche più scelte)', allowOther: true, options: [ { id: 'mod-solo', label: 'Andare da sol@' }, { id: 'mod-pari', label: 'Essere accompagnat@ da persone con la tua stessa esperienza' }, { id: 'mod-esperto', label: 'Uscire con qualcuno più preparato ed esperto di te, che non sia un professionista' }, { id: 'mod-guida', label: 'Affidarti ad una Guida' } ] },
  { id: 'corso-pregresso', kind: 'profiling', type: 'single', tag: 'Il tuo profilo', question: 'Hai gia\' frequentato un corso di escursionismo?', allowOther: true, options: [ { id: 'corso-no', label: 'No' }, { id: 'corso-cai', label: 'Sì, organizzato dal Club Alpino Italiano' }, { id: 'corso-prof', label: 'Sì, organizzato da un professionista del settore' }, { id: 'corso-ente', label: 'Sì, organizzato da un Ente formatore' } ] },
  { id: 'obiettivo', kind: 'objective', type: 'multi', tag: 'I tuoi obiettivi', question: 'Quale obiettivo hai frequentando un corso di escursionismo? (anche più scelte)', allowOther: true, options: [ { id: 'obiettivo-cartografia', label: 'Saper leggere ed interpretare una carta topografica così da percorrere in autonomia sentieri comodi e ben segnati e non dipendere da strumenti elettronici (smartphone/GPS)', skillTag: 'cartografia' }, { id: 'obiettivo-strumenti', label: 'Saper usare correttamente carta, bussola e altimetro per potermi muovere con maggior sicurezza su ogni tipo di sentiero', skillTag: 'orientamento_strumentale' }, { id: 'obiettivo-progettazione', label: 'Avere le conoscenze e la consapevolezza per progettare una escursione o un trekking in ogni stagione dell\'anno', skillTag: 'progettazione' }, { id: GAE_OPTION_ID, label: 'Avere le basi per diventare una Guida Ambientale Escursionistica' } ] },
  
  // --- SEZIONE 2: RISPOSTE DI MERITO TECNICO ---
  { id: 'q-calzature', kind: 'knowledge', type: 'single', tag: 'Calzature e cura del piede', scenario: 'Sei in Costiera Amalfitana e splende il sole. Per percorrere il Sentiero degli Dèi, da Bomerano a Positano...', question: 'Quale calzatura sceglieresti?', options: [ { id: 'a', label: 'Scarpe da ginnastica' }, { id: 'b', label: 'Una classica pedula', isCorrect: true, skillTag: 'calzature' }, { id: 'c', label: 'Infradito' }, { id: 'd', label: 'Un sandalo da escursionismo' }, { id: 'e', label: 'Nessuna delle precedenti' } ] },
  { id: 'q-abbigliamento', kind: 'knowledge', type: 'single', tag: 'Abbigliamento', scenario: 'Stai scendendo verso l\'Abbazia di S. Pietro in Valle in un bosco a prevalenza di leccio e pino d\'Aleppo quando all\'improvviso inizia a grandinare violentemente.', question: 'Come ti comporteresti?', options: [ { id: 'a', label: 'Rallento ma continuo a camminare' }, { id: 'b', label: 'Indosso la mantella e continuo a scendere' }, { id: 'c', label: 'Mi riparo sotto un albero indossando il guscio' }, { id: 'd', label: 'Mi fermo, indosso il windstopper e aspetto che finisca di grandinare' }, { id: 'e', label: 'Nessuna delle precedenti', isCorrect: true, skillTag: 'abbigliamento' } ] },
  { id: 'q-zaino', kind: 'knowledge', type: 'single', tag: 'Attrezzatura Base', question: 'Qual è il carico ideale dello zaino in relazione al peso corporeo?', options: [ { id: 'a', label: 'Intorno al 10%', isCorrect: true, skillTag: 'attrezzatura1' }, { id: 'b', label: 'Tra il 15 e il 20%' }, { id: 'c', label: 'Il 25%' }, { id: 'd', label: 'Dipende dall\'età e dall\'allenamento' }, { id: 'e', label: 'L\'unica cosa che conta è che abbia una capienza di almeno 25 litri' } ] },
  { id: 'q-cartografia', kind: 'knowledge', type: 'single', tag: 'Lettura ed interpretazione di una carta topografica', scenario: 'Per l\'uscita nella Riserva Naturale di Monte Mario sto utilizzando una fotocopia della carta topografica ufficiale ormai introvabile.', question: 'Quali caratteristiche della carta sono esattamente riprodotte nella fotocopia?', options: [ { id: 'a', label: 'Le distanze' }, { id: 'b', label: 'I simboli', isCorrect: true, skillTag: 'cartografia' }, { id: 'c', label: 'La scala' }, { id: 'd', label: 'L\'equidistanza' }, { id: 'e', label: 'Tutte le precedenti' } ] },
  { id: 'q-impluvio', kind: 'knowledge', type: 'single', tag: 'Glossario', question: 'Quale definizione associeresti alla parola IMPLUVIO?', options: [ { id: 'a', label: 'Manufatto costruito lungo l\'alveo di un torrente' }, { id: 'b', label: 'Depressione di forma arrotondata' }, { id: 'c', label: 'Nessuna delle risposte proposte' }, { id: 'd', label: 'Scavo più o meno profondo eseguito per raggiungere falde idriche' }, { id: 'e', label: 'Linea che unisce i punti più depressi di una valle', isCorrect: true, skillTag: 'cartografia' } ] },
  { id: 'q-alimentazione', kind: 'knowledge', type: 'single', tag: 'Alimentazione', scenario: 'Escursione invernale da Campo dell\'Osso a Monte Autore, procedi con le ciaspole. Hai una borraccia con 1,5 litri d\'acqua.', question: 'Qual\' è la gestione ottimale di questo principio nutritivo?', options: [ { id: 'a', label: 'Bevo quando ho sete' }, { id: 'b', label: 'Bevo ad intervalli regolari anche se non ho sete', isCorrect: true, skillTag: 'alimentazione' }, { id: 'c', label: 'Cerco di bere il meno possibile per non fermarmi' }, { id: 'd', label: 'Bevo quando arrivo alla meta e mi fermo per mangiare ed ammirare il panorama' }, { id: 'e', label: 'Esaurisco l\'acqua in salita potendomi dissetare con la neve al ritorno' } ] },
  { id: 'q-allenamento', kind: 'knowledge', type: 'single', tag: 'Allenamento', scenario: 'Se ti dicessi che con l\'esercizio e la costanza puoi perfezionare la tua respirazione nella camminata...', question: 'Quale atteggiamento metteresti in atto?', options: [ { id: 'a', label: 'Evito il sovrappeso e il fumo' }, { id: 'b', label: 'Sincronizzo il respiro con il movimento delle braccia' }, { id: 'c', label: 'Eseguo una respirazione completa e diaframmatica' }, { id: 'd', label: 'Devo concentrarmi sull\'espirazione' }, { id: 'e', label: 'Tutti i precedenti', isCorrect: true, skillTag: 'allenamento' } ] },
  { id: 'q-eco', kind: 'knowledge', type: 'single', tag: 'Comportamenti Ecocompatibili', scenario: 'Durante una uscita didattica di un corso base di escursionismo sui Monti Prenestini un allievo dopo aver mangiato una banana getta in mezzo ai rovi la buccia.', question: 'Come valuti il suo comportamento?', options: [ { id: 'a', label: 'Corretto, la buccia è degradabile in poco tempo' }, { id: 'b', label: 'Opinabile' }, { id: 'c', label: 'Corretto, sta lasciando del cibo per gli animali selvatici' }, { id: 'd', label: 'Sbagliato', isCorrect: true, skillTag: 'ecocompatibilita' }, { id: 'e', label: 'Corretto, non posso appesantire lo zaino con i rifiuti' } ] },
  { id: 'q-prevenzione', kind: 'knowledge', type: 'single', tag: 'Prevenzione Pericoli', scenario: 'Ti trovi a pernottare in un rifugio in quota. Il sentiero da percorrere l\'indomani in una bella giornata passa ai piedi di una parete rocciosa.', question: 'In quale momento della giornata devi evitare di trovarti in quel tratto?', options: [ { id: 'a', label: 'Nelle prime ore del giorno', isCorrect: true, skillTag: 'prevenzione' }, { id: 'b', label: 'Quando il sole è allo zenit' }, { id: 'c', label: 'Nelle prime ore del pomeriggio, per possibili temporali' }, { id: 'd', label: 'Al tramonto' } ] },
  { id: 'q-soccorso', kind: 'knowledge', type: 'single', tag: 'Primo Soccorso', question: 'In Italia ci sono quattro tipi di serpenti velenosi della famiglia dei Viperidi. Come si soccorre il morso di una vipera?', options: [ { id: 'a', label: 'Pratico un taglio a croce congiungente i morsi e poi cauterizzo la ferita' }, { id: 'b', label: 'Chiamo i soccorsi ed aspetto' }, { id: 'c', label: 'Metto a riposo l\'infortunato e applico un bendaggio compressivo a monte del morso', isCorrect: true, skillTag: 'primosoccorso' }, { id: 'd', label: 'Uso il siero antivipera e poi chiamo i soccorsi' } ] },
  { id: 'q-sentieri', kind: 'knowledge', type: 'single', tag: 'Sentieristica', question: 'La rete CAI identifica un sentiero sul terreno attraverso una numerazione di tre cifre. Quali indicano il numero del sentiero?', options: [ { id: 'a', label: 'Le prime due, l\'ultima indica la zona' }, { id: 'b', label: 'Le ultime due, la prima indica il settore', isCorrect: true, skillTag: 'sentieristica' }, { id: 'c', label: 'Tutte e tre' }, { id: 'd', label: 'Le prime due, l\'ultima indica l\'area' }, { id: 'e', label: 'Nessuna delle precedenti' } ] },
  { id: 'q-orientamento', kind: 'knowledge', type: 'single', tag: 'Orientamento Strumentale', scenario: 'Sei in Val Pusteria e stai percorrendo la Romerweg da Dobbiaco a Monguelfo. Vuoi conoscere esattamente la tua posizione.', question: 'Quale strumento utilizzeresti?', options: [ { id: 'a', label: 'La carta topografica' }, { id: 'b', label: 'La bussola' }, { id: 'c', label: 'L\'altimetro' }, { id: 'd', label: 'Carta, bussola ed altimetro', isCorrect: true, skillTag: 'orientamento_strumentale' }, { id: 'e', label: 'Nessuna delle precedenti' } ] }
];

interface Props {
  onClose: () => void;
}

interface Answer {
  optionIds: string[];
  otherText?: string;
}

// --- 2. PORTAL FUNCTIONAL WRAPPER ---
export function AltourTactics({ onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalStyle; };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center items-center bg-stone-900/80 backdrop-blur-sm sm:p-6 transition-all duration-300">
      <div className="w-full h-[95dvh] sm:h-auto sm:max-h-[85vh] max-w-lg bg-stone-50 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col relative text-stone-900 overflow-hidden">
        <AltourTacticsEngine onClose={onClose} />
      </div>
    </div>,
    document.body
  );
}

// --- 3. MOTORE CORE DEL SIMULATORE ---
function AltourTacticsEngine({ onClose }: Props) {
  const [phase, setPhase] = useState<'TEST' | 'LEAD' | 'RESULT'>('TEST');
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [draftSelection, setDraftSelection] = useState<string[]>([]);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherDraft, setOtherDraft] = useState('');
  
  // Lead Generation States
  const [formData, setFormData] = useState({ nome: '', cognome: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  const step = STEPS[stepIndex];
  const totalSteps = STEPS.length;
  const progressPct = phase === 'TEST' ? Math.round((stepIndex / totalSteps) * 100) : 100;

  const commitAnswer = (optionIds: string[], otherText?: string) => {
    setAnswers(prev => ({ ...prev, [step.id]: { optionIds, otherText } }));
    setDraftSelection([]);
    setShowOtherInput(false);
    setOtherDraft('');

    if (stepIndex + 1 >= totalSteps) {
      setPhase('LEAD');
    } else {
      setStepIndex(prev => prev + 1);
    }
  };

  const handleSingleTap = (optionId: string) => {
    if (optionId === OTHER_ID) {
      setShowOtherInput(true);
      setDraftSelection([OTHER_ID]);
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }
    setDraftSelection([optionId]);
    setTimeout(() => commitAnswer([optionId]), 250);
  };

  const handleMultiToggle = (optionId: string) => {
    if (optionId === OTHER_ID) {
      setShowOtherInput(prev => {
        if (!prev) setTimeout(() => inputRef.current?.focus(), 50);
        return !prev;
      });
    }
    setDraftSelection(prev =>
      prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]
    );
  };

  const handleGoBack = () => {
    if (stepIndex === 0) return;
    setDraftSelection([]);
    setShowOtherInput(false);
    setOtherDraft('');
    setStepIndex(prev => prev - 1);
  };

  const handleRestart = () => {
    setAnswers({});
    setDraftSelection([]);
    setShowOtherInput(false);
    setOtherDraft('');
    setFormData({ nome: '', cognome: '', email: '' });
    setSubmitError('');
    setStepIndex(0);
    setPhase('TEST');
  };

  // Algoritmo predittivo basato sulla profilazione ad albero
  const result = useMemo(() => {
    if (Object.keys(answers).length < STEPS.length) return null;

    const expAnswer = answers['esperienza']?.optionIds?.[0];
    const expWeight = expAnswer ? (EXPERIENCE_WEIGHT[expAnswer] ?? 0) : 0;

    const knowledgeSteps = STEPS.filter(s => s.kind === 'knowledge');
    let correctCount = 0;
    const wrongSkills: SkillTag[] = [];
    
    knowledgeSteps.forEach(s => {
      const chosenId = answers[s.id]?.optionIds?.[0];
      const chosenOption = s.options.find(o => o.id === chosenId);
      const correctOption = s.options.find(o => o.isCorrect);
      
      if (chosenOption?.isCorrect) {
        correctCount += 1;
      } else if (correctOption?.skillTag) {
        wrongSkills.push(correctOption.skillTag);
      }
    });

    let level: CourseLevel;
    
    // Regola di sbarramento: se dichiara esperienza nulla o limitata, l'avvio è bloccato al corso Base
    if (expWeight === 0) {
      level = 'base';
    } else if (correctCount >= 10 && expWeight >= 3) {
      level = 'avanzato';
    } else if (correctCount >= 5 && expWeight >= 2) {
      level = 'intermedio';
    } else {
      level = 'base';
    }

    const objectiveIds = answers['obiettivo']?.optionIds ?? [];
    const wantsGAE = objectiveIds.includes(GAE_OPTION_ID);
    
    let course = null;
    const targetWrongSkill = wrongSkills.find(ws => LOCAL_COURSES.some(c => c.level === level && c.skill === ws));
    if (targetWrongSkill) {
      course = LOCAL_COURSES.find(c => c.level === level && c.skill === targetWrongSkill);
    }
    
    if (!course) {
      course = LOCAL_COURSES.find(c => c.level === level);
    }

    return { level, correctCount, totalKnowledge: knowledgeSteps.length, course, wantsGAE };
  }, [answers]);

  // Invio dei dati su Tabella Supabase altour_leads tipizzata
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const { error } = await supabase
        .from('altour_leads')
        .insert([
          {
            nome: formData.nome,
            cognome: formData.cognome,
            email: formData.email,
            livello_suggerito: result?.level || 'base',
            punteggio: result?.correctCount || 0,
            vuole_gae: result?.wantsGAE || false,
          }
        ] as any);

      if (error) throw error;

      setPhase('RESULT');
    } catch (err: any) {
      console.error('Errore durante il salvataggio su Supabase:', err);
      setSubmitError(err.message || 'Errore durante la trasmissione dei dati. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOptionSelected = (optionId: string) => draftSelection.includes(optionId);
  const requiresFooterAction = phase === 'TEST' && (step.type === 'multi' || (step.type === 'single' && showOtherInput));
  const canContinueMulti = draftSelection.length > 0 && (!showOtherInput || otherDraft.trim().length > 0 || draftSelection.some(id => id !== OTHER_ID));

  return (
    <>
      {/* INTERFACCIA DI TESTA */}
      <header className="shrink-0 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))] bg-white border-b border-stone-200 flex items-center justify-between z-20 shadow-sm">
        <div>
          <span className="text-stone-900 font-black tracking-tight text-xl block leading-none">ALTOUR</span>
          <span className="text-xs text-stone-500 font-bold uppercase tracking-widest mt-0.5 block">Test d'Ingresso</span>
        </div>
        <button onClick={onClose} className="p-2 -mr-2 bg-transparent hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-700 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </header>

      {/* LINEA DI PROGRESSO AVANZAMENTO */}
      {(phase === 'TEST' || phase === 'LEAD') && (
        <div className="shrink-0 h-1 w-full bg-stone-200">
          <div className="h-full transition-all duration-500 ease-out" style={{ width: `${progressPct}%`, backgroundColor: BRAND_COLOR }} />
        </div>
      )}

      {/* --- SCENARIO 1: SOMMINISTRAZIONE DEL TEST --- */}
      {phase === 'TEST' && (
        <>
          <main className="flex-1 overflow-y-auto px-5 py-6 bg-stone-50">
            <div className="flex items-center justify-between mb-5">
              {stepIndex > 0 ? (
                <button onClick={handleGoBack} className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-700 flex items-center gap-1.5 py-1 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                  Indietro
                </button>
              ) : <span />}
              <span className="text-[10px] font-black text-stone-400 tracking-widest">DOMANDA {stepIndex + 1} / {totalSteps}</span>
            </div>

            <span 
              className="inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-4 w-max"
              style={{ backgroundColor: BRAND_BG_LIGHT, color: BRAND_COLOR }}
            >
              {step.tag}
            </span>

            {step.scenario && (
              <p className="text-stone-500 text-sm mb-4 leading-relaxed font-medium bg-white p-3 rounded-xl border border-stone-100 shadow-sm">
                <span className="block text-stone-800 font-bold mb-1 text-xs uppercase tracking-wide">Scenario Operativo:</span>
                {step.scenario}
              </p>
            )}
            
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 mb-6 leading-tight">
              {step.question}
            </h2>

            <div className="space-y-3 pb-2">
              {step.options.map(option => {
                const selected = isOptionSelected(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => step.type === 'single' ? handleSingleTap(option.id) : handleMultiToggle(option.id)}
                    className={`w-full text-left border-2 p-4 rounded-2xl text-[14px] sm:text-[15px] leading-snug font-semibold transition-all duration-200 active:scale-[0.98] flex items-start sm:items-center justify-between gap-4 ${
                      selected ? 'shadow-sm' : 'bg-white hover:border-stone-300 border-stone-200 text-stone-700'
                    }`}
                    style={selected ? { backgroundColor: BRAND_BG_LIGHT, borderColor: BRAND_COLOR, color: '#2d5063' } : {}}
                  >
                    <span>{option.label}</span>
                    {step.type === 'multi' && (
                      <span 
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 transition-colors ${selected ? '' : 'border-stone-300 bg-stone-50'}`}
                        style={selected ? { backgroundColor: BRAND_COLOR, borderColor: BRAND_COLOR } : {}}
                      >
                        {selected && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>}
                      </span>
                    )}
                  </button>
                );
              })}

              {step.allowOther && (
                <div 
                  className={`border-2 rounded-2xl transition-all duration-200 overflow-hidden ${isOptionSelected(OTHER_ID) ? '' : 'border-stone-200 bg-white'}`}
                  style={isOptionSelected(OTHER_ID) ? { backgroundColor: BRAND_BG_LIGHT, borderColor: BRAND_COLOR } : {}}
                >
                  <button
                    onClick={() => step.type === 'single' ? handleSingleTap(OTHER_ID) : handleMultiToggle(OTHER_ID)}
                    className="w-full text-left p-4 text-[15px] font-semibold flex items-center justify-between"
                    style={{ color: isOptionSelected(OTHER_ID) ? '#2d5063' : '#44403c' }}
                  >
                    Altro…
                    {step.type === 'multi' && (
                      <span 
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isOptionSelected(OTHER_ID) ? '' : 'border-stone-300 bg-stone-50'}`}
                        style={isOptionSelected(OTHER_ID) ? { backgroundColor: BRAND_COLOR, borderColor: BRAND_COLOR } : {}}
                      >
                        {isOptionSelected(OTHER_ID) && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>}
                      </span>
                    )}
                  </button>
                  
                  {showOtherInput && (
                    <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={otherDraft}
                        onChange={(e) => setOtherDraft(e.target.value)}
                        placeholder="Specifica..."
                        className="w-full border-2 border-stone-200 rounded-xl p-3 text-[15px] font-medium text-stone-800 focus:outline-none focus:ring-4 bg-white transition-all"
                        style={{ outlineColor: BRAND_COLOR, borderColor: otherDraft ? BRAND_COLOR : '' }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>

          {requiresFooterAction && (
            <footer className="shrink-0 bg-white border-t border-stone-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
              <button
                onClick={() => commitAnswer(draftSelection, showOtherInput ? otherDraft : undefined)}
                disabled={!canContinueMulti}
                className="w-full py-4 rounded-xl font-black text-[14px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed disabled:shadow-none"
                style={canContinueMulti ? { backgroundColor: BRAND_COLOR, color: '#ffffff', boxShadow: '0 10px 15px -3px rgba(122, 174, 205, 0.3)' } : {}}
              >
                Conferma Scelta
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
              </button>
            </footer>
          )}
        </>
      )}

      {/* --- SCENARIO 2: BLOCCO LEAD GENERATION --- */}
      {phase === 'LEAD' && (
        <main className="flex-1 overflow-y-auto px-5 py-8 bg-stone-50 flex flex-col justify-center">
          <div className="w-full max-w-sm mx-auto">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm mx-auto"
              style={{ backgroundColor: BRAND_BG_LIGHT, color: BRAND_COLOR }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            
            <h2 className="text-2xl font-black text-stone-900 mb-2 text-center leading-tight">Test Completato!</h2>
            <p className="text-stone-500 text-[15px] mb-8 text-center leading-relaxed">
              Inserisci i tuoi dati per salvare il test nel tuo profilo ed accedere al report personalizzato dell'Academy.
            </p>

            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Nome</label>
                  <input
                    required
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full border-2 border-stone-200 rounded-xl p-3.5 text-sm font-medium text-stone-800 focus:outline-none focus:ring-4 bg-white transition-all"
                    style={{ outlineColor: BRAND_COLOR, borderColor: formData.nome ? BRAND_COLOR : '' }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Cognome</label>
                  <input
                    required
                    type="text"
                    value={formData.cognome}
                    onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                    className="w-full border-2 border-stone-200 rounded-xl p-3.5 text-sm font-medium text-stone-800 focus:outline-none focus:ring-4 bg-white transition-all"
                    style={{ outlineColor: BRAND_COLOR, borderColor: formData.cognome ? BRAND_COLOR : '' }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Email</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border-2 border-stone-200 rounded-xl p-3.5 text-sm font-medium text-stone-800 focus:outline-none focus:ring-4 bg-white transition-all"
                  style={{ outlineColor: BRAND_COLOR, borderColor: formData.email ? BRAND_COLOR : '' }}
                />
              </div>

              {submitError && (
                <p className="text-xs text-red-500 font-medium text-center">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !formData.nome || !formData.cognome || !formData.email}
                className="w-full py-4 mt-4 rounded-xl font-black text-[14px] uppercase tracking-widest transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed disabled:shadow-none"
                style={(!isSubmitting && formData.nome && formData.cognome && formData.email) ? { backgroundColor: BRAND_COLOR, color: '#ffffff', boxShadow: '0 10px 15px -3px rgba(122, 174, 205, 0.3)' } : {}}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Salvataggio dati...
                  </span>
                ) : (
                  <>Elabora Risultato <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg></>
                )}
              </button>
            </form>
          </div>
        </main>
      )}

      {/* --- SCENARIO 3: REPORT ACADEMY FINALE --- */}
      {phase === 'RESULT' && result && (
        <main className="flex-1 overflow-y-auto px-5 py-6 pb-[max(2rem,env(safe-area-inset-bottom))] bg-stone-50 flex flex-col items-center">
          <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6 py-4 my-auto animate-in fade-in zoom-in-95 duration-500">
            
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-white shadow-xl shrink-0"
              style={{ backgroundColor: BRAND_BG_LIGHT, color: BRAND_COLOR }}
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 6.75V15m6-6v8.25m.503 3.446l6-1.912a1.859 1.859 0 001.03-1.454V3.059c0-.738-.491-1.37-1.203-1.536l-6 1.382a1.853 1.853 0 00-1.397 0l-6-1.382A1.853 1.853 0 005.18 3.059v12.938c0 .78.518 1.464 1.285 1.638l6 1.382a1.853 1.853 0 00(1.397 0z" />
              </svg>
            </div>

            <div className="space-y-1 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 block">Il Livello Adatto a Te</span>
              <h1 className="text-4xl font-black text-stone-900 mb-1 capitalize tracking-tight">Corso {result.level}</h1>
            </div>

            <p className="text-stone-600 text-sm sm:text-[15px] font-medium leading-relaxed max-w-[320px] shrink-0">
              In base all'esperienza sul campo e alle risposte fornite (<strong style={{ color: BRAND_COLOR }}>{result.correctCount} su {result.totalKnowledge}</strong>), ti suggeriamo di consolidare la tua formazione con il modulo indicato[cite: 1].
            </p>

            {result.course && (
              <div className="w-full bg-white p-6 rounded-3xl border border-stone-200 text-left shadow-xl shadow-stone-200/40 relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: BRAND_COLOR }} />
                <div 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest mb-4 border"
                  style={{ backgroundColor: BRAND_BG_LIGHT, color: BRAND_COLOR, borderColor: BRAND_COLOR }}
                >
                  <span>MODULO CONSIGLIATO</span>
                </div>
                <h3 className="text-xl font-black text-stone-900 leading-tight mb-2">{result.course.title}</h3>
                <p className="text-sm text-stone-500 mb-6 leading-relaxed font-medium">{result.course.desc}</p>
                <button
                  onClick={() => {
                    onClose();
                    window.location.hash = 'corsi';
                  }}
                  className="w-full hover:opacity-90 text-white font-bold uppercase tracking-widest py-4 rounded-xl text-[11px] transition-all active:scale-[0.98] flex justify-center items-center space-x-2 shadow-md"
                  style={{ backgroundColor: BRAND_COLOR }}
                >
                  <span>Scopri in Academy</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            )}

            {result.wantsGAE && (
              <div className="w-full bg-stone-100 border border-stone-200 p-5 rounded-2xl text-left shrink-0">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 shrink-0 mt-0.5" style={{ color: BRAND_COLOR }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-[12px] text-stone-600 font-medium leading-relaxed">
                    Il percorso per acquisire le competenze da <strong className="text-stone-900">Guida Ambientale Escursionistica</strong> prevede moduli specifici[cite: 1]. La segreteria ti contatterà per definire l'iter didattico.
                  </p>
                </div>
              </div>
            )}

            <button onClick={handleRestart} className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-700 transition-colors py-3 px-6 shrink-0 pt-2">
              Ricomincia Profilazione
            </button>
          </div>
        </main>
      )}
    </>
  );
}