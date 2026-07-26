import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';

// --- 1. TYPING SEMPLIFICATO ---
type CourseLevel = 'base' | 'intermedio' | 'avanzato';

interface StepOption {
  id: string;
  label: string;
  isCorrect?: boolean;
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

const STEPS: Step[] = [
  // --- SEZIONE 1: PROFILAZIONE (DOMANDE 1-5 NON VALUTATE) ---
  { id: 'esperienza', kind: 'profiling', type: 'single', tag: 'Il tuo profilo', question: 'Da quanti anni pratichi l\'attività escursionistica?', allowOther: true, options: [ { id: 'a', label: 'Da oltre 10 anni' }, { id: 'b', label: 'Tra i 2 e i 10 anni' }, { id: 'c', label: 'Meno di 2 anni' }, { id: 'd', label: 'Non ho esperienza' } ] },
  { id: 'frequenza', kind: 'profiling', type: 'single', tag: 'Il tuo profilo', question: 'Con quale frequenza esci in natura?', allowOther: true, options: [ { id: 'a', label: 'Mai' }, { id: 'b', label: '1/3 volte l\'anno' }, { id: 'c', label: 'Una volta al mese' }, { id: 'd', label: 'Ogni settimana' } ] },
  { id: 'modalita', kind: 'profiling', type: 'multi', tag: 'Il tuo profilo', question: 'Quando vuoi svolgere una attività preferisci ... (anche più scelte)', allowOther: true, options: [ { id: 'a', label: 'Andare da sol@' }, { id: 'b', label: 'Essere accompagnat@ da persone con la tua stessa esperienza' }, { id: 'c', label: 'Uscire con qualcuno più preparato ed esperto di te, che non sia un professionista' }, { id: 'd', label: 'Affidarti ad una Guida' } ] },
  { id: 'corso-pregresso', kind: 'profiling', type: 'single', tag: 'Il tuo profilo', question: 'Hai gia\' frequentato un corso di escursionismo?', allowOther: true, options: [ { id: 'a', label: 'No' }, { id: 'b', label: 'Sì, organizzato dal Club Alpino Italiano' }, { id: 'c', label: 'Sì, organizzato da un professionista del settore' }, { id: 'd', label: 'Sì, organizzato da un Ente formatore' } ] },
  { id: 'obiettivo', kind: 'objective', type: 'multi', tag: 'I tuoi obiettivi', question: 'Quale obiettivo hai frequentando un corso di escursionismo? (anche più scelte)', allowOther: true, options: [ { id: 'a', label: 'Saper leggere ed interpretare una carta topografica e non dipendere da strumenti elettronici' }, { id: 'b', label: 'Saper usare correttamente carta, bussola e altimetro' }, { id: 'c', label: 'Avere le conoscenze e la consapevolezza per progettare una escursione in ogni stagione dell\'anno' }, { id: GAE_OPTION_ID, label: 'Avere le basi per diventare una Guida Ambientale Escursionistica' } ] },
  
  // --- SEZIONE 2: RISPOSTE DI MERITO TECNICO (DOMANDE 6-21 VALUTATE) ---
  { id: 'q-calzature', kind: 'knowledge', type: 'single', tag: 'Calzature e cura del piede', scenario: 'Sei in Costiera Amalfitana e splende il sole. Per percorrere il Sentiero degli Dèi, da Bomerano a Positano,', question: 'Quale calzatura sceglieresti?', options: [ { id: 'a', label: 'Scarpe da ginnastica' }, { id: 'b', label: 'Una classica pedula', isCorrect: true }, { id: 'c', label: 'Infradito' }, { id: 'd', label: 'Un sandalo da escursionismo' }, { id: 'e', label: 'Una qualsiasi tra le precedenti' } ] },
  { id: 'q-abbigliamento', kind: 'knowledge', type: 'single', tag: 'Abbigliamento', scenario: 'Stai scendendo verso l\'Abbazia di S. Pietro in Valle in un bosco a prevalenza di leccio e pino d\'Aleppo quando all\'improvviso inizia a grandinare violentemente.', question: 'Come ti comporteresti?', options: [ { id: 'a', label: 'Rallenti ma continui a camminare' }, { id: 'b', label: 'Indossi la mantella e continui a scendere' }, { id: 'c', label: 'Ti ripari sotto un albero indossando il guscio', isCorrect: true }, { id: 'd', label: 'Ti fermi, indossi il windstopper e aspetti che finisca di grandinare' }, { id: 'e', label: 'Nessuna delle precedenti' } ] },
  { id: 'q-zaino', kind: 'knowledge', type: 'single', tag: 'Attrezzatura Base', question: 'Qual è il carico ideale dello zaino in relazione al peso corporeo?', options: [ { id: 'a', label: 'Intorno al 10%', isCorrect: true }, { id: 'b', label: 'Tra il 15 e il 20%' }, { id: 'c', label: 'Il 25%' }, { id: 'd', label: 'Dipende dall\'età e dall\'allenamento' }, { id: 'e', label: 'L\'unica cosa che conta è che abbia una capienza di almeno 25 litri' } ] },
  { id: 'q-cartografia', kind: 'knowledge', type: 'single', tag: 'Lettura ed interpretazione di una carta topografica', scenario: 'Per l\'uscita nella Riserva Naturale di Monte Mario sto utilizzando una fotocopia della carta topografica ufficiale ormai introvabile.', question: 'Quali caratteristiche della carta sono esattamente riprodotte nella fotocopia?', options: [ { id: 'a', label: 'Le distanze' }, { id: 'b', label: 'I simboli' }, { id: 'c', label: 'La scala' }, { id: 'd', label: 'L\'equidistanza', isCorrect: true }, { id: 'e', label: 'Tutte le precedenti' } ] },
  { id: 'q-impluvio', kind: 'knowledge', type: 'single', tag: 'Glossario', question: 'Quale definizione associeresti alla parola IMPLUVIO?', options: [ { id: 'a', label: 'Manufatto costruito lungo l\'alveo di un torrente' }, { id: 'b', label: 'Depressione di forma arrotondata' }, { id: 'c', label: 'Nessuna delle risposte proposte' }, { id: 'd', label: 'Scavo più o meno profondo eseguito per raggiungere falde idriche' }, { id: 'e', label: 'Linea che unisce i punti più depressi di una valle', isCorrect: true } ] },
  { id: 'q-alimentazione', kind: 'knowledge', type: 'single', tag: 'Alimentazione', scenario: 'Escursione invernale con le ciaspole da Campo dell\'Osso a Monte Autore. Hai con te una borraccia contenente 1,5 litri di acqua.', question: 'Qual\' è la gestione ottimale di questo principio nutritivo?', options: [ { id: 'a', label: 'Bevo quando ho sete' }, { id: 'b', label: 'Bevo ad intervalli regolari anche se non ho sete', isCorrect: true }, { id: 'c', label: 'Cerco di bere il meno possibile per non perdere tempo visto che procedo lentamente e le ore di luce sono poche' }, { id: 'd', label: 'Bevo quando arrivo alla meta e mi fermo per mangiare ed ammirare il panorama' }, { id: 'e', label: 'Esaurisco l\'acqua durante la salita, nel ritorno potrei dissetarmi con la neve.' } ] },
  { id: 'q-allenamento', kind: 'knowledge', type: 'single', tag: 'Allenamento', question: 'Se ti dicessi che con l\'esercizio e la costanza puoi perfezionare la tua respirazione nella camminata, quale atteggiamento metteresti in atto?', options: [ { id: 'a', label: 'Evito il sovrappeso e il fumo' }, { id: 'b', label: 'Sincronizzo il respiro con il movimento delle braccia' }, { id: 'c', label: 'Eseguo una respirazione completa e diaframmatica' }, { id: 'd', label: 'Devo concentrarmi sull\'espirazione' }, { id: 'e', label: 'Tutti i precedenti', isCorrect: true } ] },
  { id: 'q-eco', kind: 'knowledge', type: 'single', tag: 'Comportamenti Ecocompatibili', scenario: 'Durante una uscita didattica sui Monti Prenestini un allievo dopo aver mangiato una banana getta in mezzo ai rovi la buccia.', question: 'Come valuti il suo comportamento?', options: [ { id: 'a', label: 'Corretto, la buccia è degradabile da sei mesi a due anni' }, { id: 'b', label: 'Opinabile' }, { id: 'c', label: 'Corretto, sta lasciando del cibo per gli animali selvatici' }, { id: 'd', label: 'Sbagliato', isCorrect: true }, { id: 'e', label: 'Corretto, non posso appesantire lo zaino con i rifiuti organici' } ] },
  { id: 'q-prevenzione', kind: 'knowledge', type: 'single', tag: 'Prevenzione Pericoli', scenario: 'Ti trovi a pernottare in un rifugio ad una quota superiore al limite del pascolo, e stai studiando il sentiero da percorrere l\'indomani sapendo che sarà una bella giornata. Il sentiero passa ai piedi di una parete rocciosa.', question: 'In quale momento della giornata devi evitare di trovarti in quel tratto?', options: [ { id: 'a', label: 'Nelle prime ore del giorno', isCorrect: true }, { id: 'b', label: 'Quando il sole è allo zenit' }, { id: 'c', label: 'Nelle prime ore del pomeriggio, per possibili temporali' }, { id: 'd', label: 'Al tramonto' }, { id: 'e', label: 'Durante la notte' } ] },
  { id: 'q-soccorso', kind: 'knowledge', type: 'single', tag: 'Primo Soccorso', question: 'In Italia sono presenti molti tipi di serpenti ma solo quattro appartengono alla famiglia dei Viperidi e sono velenosi. Come si soccorre il morso di una vipera?', options: [ { id: 'a', label: 'Pratico un taglio a croce congiungente i morsi e poi cauterizzo la ferita' }, { id: 'b', label: 'Chiamo i soccorsi ed aspetto' }, { id: 'c', label: 'Metto a riposo l\'infortunato e applico un bendaggio compressivo a monte del morso', isCorrect: true }, { id: 'd', label: 'Uso il siero antivipera e poi chiamo i soccorsi' }, { id: 'e', label: 'Chiamo i soccorsi e accompagno velocemente a valle l\'infortunato' } ] },
  { id: 'q-sentieri', kind: 'knowledge', type: 'single', tag: 'Sentieristica', question: 'La rete sentieristica del CAI permette di identificare sul terreno un sentiero attraverso una numerazione di tre cifre. Quali di queste cifre indicano il numero del sentiero?', options: [ { id: 'a', label: 'Le prime due, l\'ultima indica la zona' }, { id: 'b', label: 'Le ultime due, la prima indica il settore', isCorrect: true }, { id: 'c', label: 'Tutte e tre' }, { id: 'd', label: 'Le prime due, l\'ultima indica l\'area' }, { id: 'e', label: 'Nessuna delle precedenti' } ] },
  { id: 'q-orientamento', kind: 'knowledge', type: 'single', tag: 'Orientamento Strumentale', scenario: 'Sono in bellissimo bosco di conifere in Val Pusteria e sto percorrendo la Romerweg da Dobbiaco a Monguelfo.', question: 'Voglio conoscere esattamente la mia posizione, quale strumento utilizzeresti?', options: [ { id: 'a', label: 'La carta topografica' }, { id: 'b', label: 'La bussola' }, { id: 'c', label: 'L\'altimetro' }, { id: 'd', label: 'Carta, bussola ed altimetro' }, { id: 'e', label: 'Solo carta ed altimetro', isCorrect: true } ] },
  { id: 'q-pedanca', kind: 'knowledge', type: 'single', tag: 'Glossario', question: 'Quale definizione associeresti alla parola PEDANCA?', options: [ { id: 'a', label: 'Parete continua di pali squadrati e affiancati, infissi nel terreno' }, { id: 'b', label: 'Diramazione secondaria di un massiccio montuoso' }, { id: 'c', label: 'Elevatore per liquidi o materiali terrosi' }, { id: 'd', label: 'Impianto per il trasporto di merci' }, { id: 'e', label: 'Nessuna delle precedenti', isCorrect: true } ] },
  { id: 'q-strumentazione', kind: 'knowledge', type: 'single', tag: 'Strumentazione', scenario: 'Sto percorrendo il sentiero che da Balme (1432m) arriva al Rifugio Gastaldi (2659m). Durante l\'ascesa l\'altimetro, anche se continuamente tarato, mi indica sempre una quota inferiore a quella indicata sulla carta.', question: 'Che conclusioni posso trarre?', options: [ { id: 'a', label: 'Il tempo tende a migliorare', isCorrect: true }, { id: 'b', label: 'Nessuna, probabilmente lo strumento non funziona' }, { id: 'c', label: 'Il tempo tende a peggiorare' }, { id: 'd', label: 'Sto percorrendo un sentiero diverso da quello scelto' }, { id: 'e', label: 'La carta non è accurata' } ] },
  { id: 'q-simboli', kind: 'knowledge', type: 'single', tag: 'Simboli', scenario: 'Stai svolgendo una prova di orienteering e sulla mappa trovi un simbolo di colore nero: un cerchio con al suo centro un punto.', question: 'Che cosa dovrai cercare?', options: [ { id: 'a', label: 'Un albero isolato' }, { id: 'b', label: 'Un cippo', isCorrect: true }, { id: 'c', label: 'Una fontana con acqua potabile' }, { id: 'd', label: 'Un oggetto particolare' }, { id: 'e', label: 'Un masso con una cavità centrale' } ] },
  { id: 'q-scala', kind: 'knowledge', type: 'single', tag: 'Fattore di Scala', question: 'Individuo su una carta topografica con scala 1:25000 due punti notevoli. Indicando con C la loro distanza sulla carta e con T la loro distanza reale sul terreno quando potrò affermare che C = T?', options: [ { id: 'a', label: 'Sempre' }, { id: 'b', label: 'Se e solo se la distanza tra i due punti viene percorsa in piano', isCorrect: true }, { id: 'c', label: 'Quando il fattore di scala è uguale a 1' }, { id: 'd', label: 'Solo se i due punti notevoli sono alla stessa quota' }, { id: 'e', label: 'Mai' } ] }
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
    if (optionId === OTHER_ID || optionId === 'altro' || optionId.includes('altro')) {
      setShowOtherInput(true);
      setDraftSelection([optionId]);
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }
    setDraftSelection([optionId]);
    setTimeout(() => commitAnswer([optionId]), 250);
  };

  const handleMultiToggle = (optionId: string) => {
    if (optionId === OTHER_ID || optionId === 'altro' || optionId.includes('altro')) {
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

  // --- NUOVO ALGORITMO PREDITTIVO A PUNTEGGIO ---
  const result = useMemo(() => {
    if (Object.keys(answers).length < STEPS.length) return null;

    // Isola solo le 16 domande tecniche (dalla 6 alla 21)
    const knowledgeSteps = STEPS.filter(s => s.kind === 'knowledge');
    let correctCount = 0;
    
    knowledgeSteps.forEach(s => {
      const chosenId = answers[s.id]?.optionIds?.[0];
      const chosenOption = s.options.find(o => o.id === chosenId);
      if (chosenOption?.isCorrect) {
        correctCount += 1;
      }
    });

    let level: CourseLevel;
    
    // Assegnazione Corso basata esclusivamente sul numero di risposte esatte
    if (correctCount <= 8) {
      level = 'base';
    } else if (correctCount >= 9 && correctCount <= 14) {
      level = 'intermedio';
    } else {
      level = 'avanzato';
    }

    // Le prime 5 domande influenzano solo flag secondari come la GAE
    const objectiveIds = answers['obiettivo']?.optionIds ?? [];
    const wantsGAE = objectiveIds.includes(GAE_OPTION_ID);
    
    return { level, correctCount, totalKnowledge: knowledgeSteps.length, wantsGAE };
  }, [answers]);

  // Invio dei dati su Tabella Supabase
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const risposteFormattate = JSON.parse(JSON.stringify(answers));

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
            risposte_dettagliate: risposteFormattate 
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
  const canContinueMulti = draftSelection.length > 0 && (!showOtherInput || otherDraft.trim().length > 0 || draftSelection.some(id => !id.includes('altro') && id !== OTHER_ID));

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

      {/* --- SCENARIO 3: REPORT ACADEMY FINALE (PULITO E SENZA MODULI SINGOLI) --- */}
      {phase === 'RESULT' && result && (
        <main className="flex-1 overflow-y-auto px-5 py-6 pb-[max(2rem,env(safe-area-inset-bottom))] bg-stone-50 flex flex-col items-center">
          <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6 py-4 my-auto animate-in fade-in zoom-in-95 duration-500">
            
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-white shadow-xl shrink-0"
              style={{ backgroundColor: BRAND_BG_LIGHT, color: BRAND_COLOR }}
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 6.75V15m6-6v8.25m.503 3.446l6-1.912a1.859 1.859 0 001.03-1.454V3.059c0-.738-.491-1.37-1.203-1.536l-6 1.382a1.853 1.853 0 00-1.397 0l-6-1.382A1.853 1.853 0 005.18 3.059v12.938c0 .78.518 1.464 1.285 1.638l6 1.382a1.853 1.853 0 001.397 0z" />
              </svg>
            </div>

            <div className="space-y-1 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 block">Il Percorso Adatto a Te</span>
              <h1 className="text-4xl font-black text-stone-900 mb-1 capitalize tracking-tight">Corso {result.level}</h1>
            </div>

            <p className="text-stone-600 text-sm sm:text-[15px] font-medium leading-relaxed max-w-[320px] shrink-0">
              In base alle risposte fornite nel test tecnico (<strong style={{ color: BRAND_COLOR }}>{result.correctCount} esatte su {result.totalKnowledge}</strong>), ti suggeriamo di consolidare la tua formazione iscrivendoti al nostro corso di livello {result.level}.
            </p>

            <button
              onClick={() => {
                onClose();
                window.location.hash = 'corsi';
              }}
              className="w-full hover:opacity-90 text-white font-bold uppercase tracking-widest py-4 rounded-xl text-[11px] transition-all active:scale-[0.98] flex justify-center items-center space-x-2 shadow-md"
              style={{ backgroundColor: BRAND_COLOR }}
            >
              <span>Esplora i Corsi in Academy</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
            </button>

            {result.wantsGAE && (
              <div className="w-full bg-stone-100 border border-stone-200 p-5 rounded-2xl text-left shrink-0 mt-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 shrink-0 mt-0.5" style={{ color: BRAND_COLOR }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-[12px] text-stone-600 font-medium leading-relaxed">
                    Il percorso per diventare <strong className="text-stone-900">Guida Ambientale Escursionistica</strong> prevede iter formativi specifici. Lo staff ti contatterà per ulteriori informazioni!
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