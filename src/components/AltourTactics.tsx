import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

// --- 1. TYPING & INTERFACES ---
export type SkillTag = 'orientamento' | 'meteo' | 'tecnica' | 'sopravvivenza' | 'emergenza';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type CourseLevel = 'base' | 'intermedio' | 'avanzato';

interface Choice {
  text: string;
  isCorrect: boolean; // Se isGamble è true, questo valore viene sovrascritto dal caso
  explanation: string;
  damage?: number;
  bonus?: number; // Punti extra
  skillTag: SkillTag;
  isGamble?: boolean; // Attiva la meccanica Rischio/Premio (50% probabilità)
}

interface Stage {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  coords: { x: number; y: number };
  choices: Choice[];
}

interface Course {
  id: string;
  level: CourseLevel;
  skill: SkillTag;
  title: string;
  desc: string;
  url: string;
}

const SKILL_LABELS: Record<SkillTag, string> = {
  orientamento: 'Orientamento & Navigazione',
  meteo: 'Gestione Meteo',
  tecnica: 'Tecnica di Progressione',
  sopravvivenza: 'Gestione Risorse & Ambiente',
  emergenza: 'Gestione Emergenze & Primo Soccorso',
};

const NEXT_LEVEL: Record<CourseLevel, CourseLevel | null> = {
  base: 'intermedio',
  intermedio: 'avanzato',
  avanzato: null,
};

// --- 2. DATABASE CORSI ALTOUR ---
const LOCAL_COURSES: Course[] = [
  { id: 'b1', level: 'base', skill: 'orientamento', title: 'Corso Base: Cartografia', desc: 'Impara a orientarti sui sentieri con carta e bussola.', url: '/corsi/base-cartografia' },
  { id: 'b2', level: 'base', skill: 'tecnica', title: 'Abbigliamento & Attrezzatura', desc: 'Prepara lo zaino perfetto ed evita brutte sorprese.', url: '/corsi/base-attrezzatura-1' },
  { id: 'i1', level: 'intermedio', skill: 'meteo', title: 'Meteo Montano & Prevenzione', desc: 'Anticipa i temporali e muoviti in sicurezza.', url: '/corsi/intermedio-meteorologia' },
  { id: 'i2', level: 'intermedio', skill: 'sopravvivenza', title: 'Alimentazione & Ritmo', desc: 'Gestisci le tue energie nelle escursioni lunghe.', url: '/corsi/intermedio-allenamento' },
  { id: 'a1', level: 'avanzato', skill: 'emergenza', title: 'Gestione Emergenze', desc: 'Protocolli di sicurezza, bivacco d\'emergenza e chiamate SOS.', url: '/corsi/avanzato-emergenze' },
  { id: 'a2', level: 'avanzato', skill: 'tecnica', title: 'Terreni Impervi & Attrezzatura Avanzata', desc: 'Affronta ghiaioni, nevai e tratti esposti con padronanza.', url: '/corsi/avanzato-attrezzatura-2' },
];

// --- 3. SCENARI ESPERIENZIALI (Orienteering RPG) ---
const STAGES_DATA: Record<DifficultyLevel, Stage[]> = {
  easy: [
    {
      id: 0, title: "Il Bivio nel Bosco", subtitle: "Decisione Rapida",
      description: "Sei nel fitto del bosco. Il sentiero segnato (CAI) è ostruito da alberi caduti. Sulla destra c'è una traccia ben battuta ma senza bandierine bianche e rosse.",
      coords: { x: 50, y: 110 },
      choices: [
        { text: "Tiro fuori la mappa/GPS per capire come aggirare l'ostacolo restando vicino al sentiero.", isCorrect: true, explanation: "Saggio! Le tracce non segnate spesso sono 'sentieri di animali' che finiscono in un dirupo.", skillTag: 'orientamento' },
        { text: "Prendo la traccia di destra, sembra larga e sicuramente riporterà sul sentiero principale.", isCorrect: false, damage: 1, explanation: "Pessima idea. Ti sei appena infilato in una traccia di cinghiali. Hai perso 30 minuti per tornare indietro.", skillTag: 'orientamento' }
      ]
    },
    {
      id: 1, title: "Incontro con i Cani", subtitle: "Gestione Ambiente",
      description: "Esci dal bosco. Sul sentiero davanti a te c'è un gregge di pecore sorvegliato da tre grossi cani da pastore maremmani che iniziano ad abbaiare.",
      coords: { x: 150, y: 50 },
      choices: [
        { text: "Mi fermo, evito di fissarli negli occhi e aggiro il gregge passandoci largo senza fare movimenti bruschi.", isCorrect: true, explanation: "Esatto! I cani fanno solo il loro lavoro. Mantenere la calma e fare un ampio giro è la scelta più sicura.", skillTag: 'sopravvivenza' },
        { text: "Alzo i bastoncini da trekking per spaventarli e proseguo dritto sul mio sentiero.", isCorrect: false, damage: 1, explanation: "Errore pericoloso! Alzare i bastoni viene visto come una minaccia e potrebbe innescare un attacco.", skillTag: 'sopravvivenza' }
      ]
    },
    {
      id: 2, title: "Il Torrente Ingrossato", subtitle: "Scelta di Percorso",
      description: "A causa della pioggia di ieri, il ruscello che devi attraversare si è gonfiato. L'acqua è torbida e copre le pietre su cui avresti dovuto poggiare i piedi.",
      coords: { x: 250, y: 120 },
      choices: [
        { text: "Cerco un guado migliore più a monte o a valle. Se è troppo forte, torno indietro.", isCorrect: true, explanation: "Ottima decisione. L'acqua torbida nasconde buche e sassi scivolosi, la corrente è più forte di quanto sembri.", skillTag: 'tecnica' },
        { text: "Mi tolgo gli scarponi per non bagnarli e attraverso a piedi nudi in fretta.", isCorrect: false, damage: 1, explanation: "Sbagliato! A piedi nudi non hai aderenza. Scivoli, batti il ginocchio e ti ritrovi bagnato e infreddolito.", skillTag: 'tecnica' }
      ]
    }
  ],
  medium: [
    {
      id: 0, title: "La Nebbia Sale", subtitle: "Disorientamento",
      description: "Stai camminando su un crinale erboso. All'improvviso sale un nebbione fitto, tipico degli Appennini: non vedi a due metri dal naso e i segnavia scompaiono.",
      coords: { x: 50, y: 110 },
      choices: [
        { text: "Mi fermo immediatamente. Prendo la bussola/GPS e cerco di ripercorrere i miei passi verso l'ultimo segnavia noto.", isCorrect: true, explanation: "Mossa da vero escursionista. Fermarsi evita di finire su un versante pericoloso.", skillTag: 'meteo' },
        { text: "Continuo a camminare cercando di scendere verso valle il più in fretta possibile.", isCorrect: false, damage: 1, explanation: "Trappola letale. Scendere a caso con la nebbia porta quasi sempre su salti di roccia o fossi ciechi.", skillTag: 'meteo' }
      ]
    },
    {
      id: 1, title: "Il Compagno in Crisi", subtitle: "Gestione Gruppo",
      description: "Il tuo compagno di escursione è sudato freddo, respira a fatica e non riesce a tenere il passo. Mancano 2 ore al rifugio in salita.",
      coords: { x: 120, y: 55 },
      choices: [
        { text: "Ci fermiamo all'ombra. Lo faccio bere, gli do carboidrati rapidi (zuccheri) e rallentiamo drasticamente il passo.", isCorrect: true, explanation: "Perfetto. È una classica crisi di zuccheri (ipoglicemia). Il riposo e lo zucchero fanno miracoli.", skillTag: 'sopravvivenza' },
        { text: "Gli dico di farsi forza, prendo il suo zaino per alleggerirlo e lo spingo a camminare veloce per arrivare prima.", isCorrect: false, damage: 1, explanation: "Sbagliato. Spingere oltre il limite chi è in crisi metabolica porta al collasso o allo svenimento.", skillTag: 'sopravvivenza' }
      ]
    },
    {
      id: 2, title: "La Corsa contro il Tempo", subtitle: "Sfida & Rischio",
      description: "Sei in ritardo. Il sole sta per tramontare. La traccia ufficiale fa un lungo e noioso giro a zig-zag. Vedi un canalone dritto (non segnato) che scende verso il parcheggio.",
      coords: { x: 190, y: 110 },
      choices: [
        { text: "Tengo il sentiero ufficiale, tiro fuori la torcia frontale e cammino sicuro anche al buio.", isCorrect: true, bonus: 50, explanation: "Scelta prudente che paga sempre in montagna. Niente rischi inutili.", skillTag: 'orientamento' },
        { text: "Rischio e mi butto giù per il canalone! Devo recuperare tempo.", isCorrect: false, damage: 2, isGamble: true, explanation: "Il rischio non ha pagato! Il canalone finiva in un salto di roccia. Sei dovuto tornare su al buio, sfiancato.", skillTag: 'emergenza' }
      ]
    }
  ],
  hard: [
    {
      id: 0, title: "Il Suono Preoccupante", subtitle: "Micro-Meteorologia",
      description: "Sei in prossimità della vetta (2500m). Senti un ronzio simile a un 'friggitore' nell'aria e i peli delle braccia si drizzano. Il cielo si è annuvolato.",
      coords: { x: 50, y: 110 },
      choices: [
        { text: "Mollo bastoncini e piccozza metallica, scendo di quota di corsa evitando creste e rocce isolate.", isCorrect: true, explanation: "Sopravvivenza pura. È l'effetto corona (Fuoco di Sant'Elmo): un fulmine sta per cadere esattamente lì.", skillTag: 'meteo' },
        { text: "Mi accovaccio dove sono, nascondendomi sotto un masso o una grotta di roccia isolata per ripararmi dalla pioggia.", isCorrect: false, damage: 1, explanation: "Fatale! Rintanarsi in anfratti o grotte durante una tempesta elettrica ti trasforma nel cavo di messa a terra del fulmine.", skillTag: 'meteo' }
      ]
    },
    {
      id: 1, title: "La Pietraia Traditrice", subtitle: "Tecnica in Discesa",
      description: "Inizi la discesa su un ripido ghiaione formato da sassi grandi come pugni. Al primo passo, le pietre franano e inizi a scivolare.",
      coords: { x: 130, y: 55 },
      choices: [
        { text: "Piego leggermente le ginocchia, appoggio il peso sui talloni e 'scio' assecondando la frana del ghiaietto.", isCorrect: true, explanation: "Tecnica corretta. Sul ghiaione fine bisogna far scivolare il tallone per affondarlo, sfruttando le pietre come ammortizzatore.", skillTag: 'tecnica' },
        { text: "Mi butto col peso all'indietro o mi siedo, frenando con le mani e coi glutei.", isCorrect: false, damage: 1, explanation: "Dolorosissimo! Sedendosi si perde ogni controllo direzionale, trasformandosi in bersagli per i sassi che rotolano da monte.", skillTag: 'tecnica' }
      ]
    },
    {
      id: 2, title: "S.O.S. Remoto", subtitle: "Emergenza Assoluta",
      description: "Il tuo compagno scivola in un canalone e non riesce a muovere la gamba (sospetta frattura). Non c'è campo per il cellulare.",
      coords: { x: 210, y: 115 },
      choices: [
        { text: "Lo metto in sicurezza e al caldo, poi vado da solo a cercare campo o il rifugio più vicino segnando il mio percorso.", isCorrect: true, explanation: "Scelta difficile ma giusta. Un ferito fermo al freddo peggiora rapidamente; bisogna cercare aiuto mappando il punto esatto.", skillTag: 'emergenza' },
        { text: "Costruisco una barella di fortuna con rami e zaini e cerco di trascinarlo io verso valle.", isCorrect: false, damage: 2, explanation: "Errore da film! Trasportare un ferito senza barelle professionali su terreno impervio peggiora le fratture e sfinisce entrambi.", skillTag: 'emergenza' }
      ]
    }
  ]
};

// --- FUNZIONI DI SUPPORTO GAMIFICATION ---
interface Badge {
  id: string;
  name: string;
  icon: string;
  condition: (score: number, maxStreak: number, lives: number, diff: string) => boolean;
}

const GAME_BADGES: Badge[] = [
  { id: 'perfect', name: 'Macchina da Guerra', icon: '🔥', condition: (_, maxStreak, __, diff) => maxStreak >= 3 && diff === 'hard' },
  { id: 'survivor', name: 'Intoccabile', icon: '🛡️', condition: (_, __, lives, diff) => lives === (diff === 'hard' ? 1 : diff === 'medium' ? 2 : 3) },
  { id: 'scorer', name: 'High Roller', icon: '💎', condition: (score) => score >= 500 },
];

interface Props {
  onClose: () => void;
}

// --- 4. COMPONENTE MAPPA SVG LIGHT THEME ---
function TrailMap({ currentStage, stages }: { currentStage: number, stages: Stage[] }) {
  const pathD = "M 50 110 Q 100 50, 150 50 T 250 120 T 350 40";
  const finalDest = { x: 350, y: 40 };

  const totalSteps = stages.length;
  const isWon = currentStage >= totalSteps;
  const activeCoord = isWon ? finalDest : stages[currentStage]?.coords || { x: 50, y: 110 };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 relative overflow-hidden shrink-0 shadow-sm mb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-1.5 bg-stone-100 py-1 px-2.5 rounded-full border border-stone-200 text-[9px] font-black text-brand-stone tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-sky animate-pulse"></span>
          <span>TRACCIATO GPS</span>
        </div>
        {!isWon && (
          <span className="text-[9px] font-black text-stone-400 tracking-wider">
            BIVIO {currentStage + 1} DI {totalSteps}
          </span>
        )}
      </div>

      <svg className="w-full h-24 mt-2" viewBox="0 0 400 150">
        <path d={pathD} fill="none" stroke="#e7e5e4" strokeWidth="6" strokeLinecap="round" />
        <path 
          d={pathD} fill="none" stroke="#5aaadd" strokeWidth="6" strokeLinecap="round"
          strokeDasharray="400" strokeDashoffset={isWon ? 0 : 400 - (currentStage * (400 / totalSteps))}
          className="transition-all duration-700 ease-out"
        />

        {stages.map((node, idx) => {
          const isActive = idx === currentStage && !isWon;
          const isCompleted = idx < currentStage || isWon;
          return (
            <g key={node.id}>
              {isActive && <circle cx={node.coords.x} cy={node.coords.y} r="14" className="fill-brand-sky/20 animate-pulse" style={{ transformOrigin: `${node.coords.x}px ${node.coords.y}px` }} />}
              <circle 
                cx={node.coords.x} cy={node.coords.y} r="8" 
                className={`transition-all duration-300 ${isActive ? 'fill-white stroke-brand-sky stroke-[4px]' : isCompleted ? 'fill-brand-sky stroke-none' : 'fill-stone-200 stroke-stone-300 stroke-2'}`}
              />
            </g>
          );
        })}

        <circle cx={finalDest.x} cy={finalDest.y} r="10" className={`transition-all duration-300 ${isWon ? 'fill-emerald-500 stroke-none' : 'fill-stone-200 stroke-stone-300 stroke-2'}`} />
        <path d="M 347 38 L 350 43 L 355 35" fill="none" stroke={isWon ? '#fff' : '#a8a29e'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        <g style={{ transform: `translate3d(${activeCoord.x}px, ${activeCoord.y}px, 0)`, transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <g transform="translate(-10, -28)">
            <path d="M10 0C4.48 0 0 4.48 0 10c0 5.25 10 13 10 13s10-7.75 10-13c0-5.52-4.48-10-10-10z" className="fill-brand-sky" />
            <circle cx="10" cy="10" r="4" className="fill-white"/>
          </g>
        </g>
      </svg>
    </div>
  );
}

// --- 5. PORTAL WRAPPER ---
export function AltourTacticsModal({ onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden'; 
    return () => { document.body.style.overflow = originalStyle; };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-brand-stone/80 backdrop-blur-sm sm:p-6 transition-opacity">
      <div className="w-full h-[100dvh] sm:h-[85vh] sm:max-h-[850px] max-w-md bg-stone-50 sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative sm:border-[6px] border-white text-stone-900 touch-none select-none overscroll-none">
        <AltourTacticsEngine onClose={onClose} />
      </div>
    </div>,
    document.body
  );
}

// --- 6. MOTORE PRINCIPALE ESPERIENZIALE ---
function AltourTacticsEngine({ onClose }: Props) {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'WON' | 'LOST'>('START');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [currentStage, setCurrentStage] = useState(0);
  
  // STATISTICHE DI GIOCO
  const [lives, setLives] = useState(3);
  const [maxLives, setMaxLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxCombo] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);

  const emptyErrors = () => Object.keys(SKILL_LABELS).reduce((acc, tag) => ({ ...acc, [tag]: 0 }), {} as Record<SkillTag, number>);
  const [errorsBySkill, setErrorsBySkill] = useState<Record<SkillTag, number>>(emptyErrors());
  
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const stages = STAGES_DATA[difficulty]?.length > 0 ? STAGES_DATA[difficulty] : STAGES_DATA['easy'];
  const stageData = stages[currentStage];

  const weakAreas = useMemo(() => {
    return (Object.keys(errorsBySkill) as SkillTag[])
      .filter(tag => errorsBySkill[tag] > 0)
      .sort((a, b) => errorsBySkill[b] - errorsBySkill[a]);
  }, [errorsBySkill]);

  const suggestedCourse = useMemo(() => {
    if (gameState !== 'WON' && gameState !== 'LOST') return null;
    const currentLevel: CourseLevel = difficulty === 'hard' ? 'avanzato' : difficulty === 'medium' ? 'intermedio' : 'base';

    if (weakAreas.length > 0) {
      const match = LOCAL_COURSES.find(c => c.level === currentLevel && c.skill === weakAreas[0]);
      if (match) return { course: match, isGrowth: false, targetLevel: currentLevel };
    }

    const nextLevel = NEXT_LEVEL[currentLevel];
    if (nextLevel) {
      const growthCourse = LOCAL_COURSES.find(c => c.level === nextLevel);
      if (growthCourse) return { course: growthCourse, isGrowth: true, targetLevel: nextLevel };
    }

    const refine = LOCAL_COURSES.find(c => c.level === 'avanzato' && c.skill === 'emergenza');
    return refine ? { course: refine, isGrowth: true, targetLevel: 'avanzato' } : null;
  }, [gameState, weakAreas, difficulty]);

  const startGame = (diff: DifficultyLevel) => {
    const initialLives = diff === 'hard' ? 1 : diff === 'medium' ? 2 : 3;
    setDifficulty(diff);
    setMaxLives(initialLives);
    setLives(initialLives);
    setScore(0);
    setStreak(0);
    setMaxCombo(0);
    setCurrentStage(0);
    setEarnedBadges([]);
    setErrorsBySkill(emptyErrors());
    setSelectedChoice(null);
    setShowFeedback(false);
    setGameState('PLAYING');
  };

  const handleChoiceClick = (choice: Choice) => {
    if (showFeedback) return;
    
    // MECCANICA GAMBLE (Lascia o Raddoppia)
    let processedChoice = { ...choice };
    if (choice.isGamble) {
      const gambleWins = Math.random() > 0.5;
      processedChoice.isCorrect = gambleWins;
      processedChoice.explanation = gambleWins 
        ? "Hai sfidato la sorte... e ti è andata bene! Hai guadagnato tempo e punti bonus preziosi."
        : "La montagna non perdona l'azzardo. La tua scelta si è rivelata disastrosa, perdi salute e tempo.";
    }

    setSelectedChoice(processedChoice);
    setShowFeedback(true);

    if (processedChoice.isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxCombo(newStreak);
      
      const streakBonus = newStreak > 1 ? (newStreak * 20) : 0;
      setScore(s => s + 100 + streakBonus + (processedChoice.bonus || 0));
    } else {
      setStreak(0); 
      setLives(prev => Math.max(0, prev - (processedChoice.damage || 1)));
      setErrorsBySkill(prev => ({ ...prev, [processedChoice.skillTag]: prev[processedChoice.skillTag] + 1 }));
    }
  };

  const handleAdvance = () => {
    if (lives <= 0) {
      finishGame('LOST');
      return;
    }
    if (currentStage + 1 >= stages.length) {
      finishGame('WON');
    } else {
      setCurrentStage(prev => prev + 1);
      setSelectedChoice(null);
      setShowFeedback(false);
    }
  };

  const finishGame = (status: 'WON' | 'LOST') => {
    // Calcolo Badges
    const unlocked = GAME_BADGES.filter(b => b.condition(score, maxStreak, lives, difficulty));
    setEarnedBadges(unlocked);
    setGameState(status);
  };

  const handleCTAClick = () => {
    onClose(); 
    window.location.hash = 'corsi';
  };

  return (
    <div className="flex flex-col h-full w-full bg-stone-50">
      
      <header className="px-5 py-4 border-b border-stone-200 flex items-center justify-between shrink-0 bg-white z-10 pt-safe">
        <div>
          <span className="text-brand-stone font-black tracking-tighter text-lg block leading-none">ALTOUR</span>
          <span className="text-[10px] text-brand-sky font-black uppercase tracking-widest">Outdoor Simulator</span>
        </div>
        
        <div className="flex items-center space-x-3">
          {gameState === 'PLAYING' && (
            <div className="flex items-center space-x-2">
              {streak >= 2 && (
                <div className="bg-amber-100 border border-amber-200 px-2 py-0.5 rounded flex items-center space-x-1 animate-pulse">
                  <span className="text-[10px] font-black text-amber-600">🔥 ×{streak}</span>
                </div>
              )}
              <div className="bg-stone-100 px-2 py-0.5 rounded font-black text-stone-600 text-xs border border-stone-200">
                {score} <span className="text-[9px] text-stone-400">PT</span>
              </div>
            </div>
          )}

          {gameState === 'PLAYING' && (
            <div className="flex space-x-1 bg-stone-100 py-1.5 px-2.5 rounded-full border border-stone-200">
              {Array.from({ length: maxLives }).map((_, i) => (
                <div key={i} className={`w-2.5 h-3 rounded-sm transition-colors ${i < lives ? 'bg-rose-500' : 'bg-stone-300'}`} />
              ))}
            </div>
          )}
          <button onClick={onClose} className="p-2 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </header>

      {/* --- MENU START --- */}
      {gameState === 'START' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto pb-safe">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center border border-stone-200 mb-6 shadow-sm relative">
            <svg className="w-8 h-8 text-brand-stone" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.446l6-1.912a1.859 1.859 0 001.03-1.454V3.059c0-.738-.491-1.37-1.203-1.536l-6 1.382a1.853 1.853 0 00-1.397 0l-6-1.382A1.853 1.853 0 005.18 3.059v12.938c0 .78.518 1.464 1.285 1.638l6 1.382a1.853 1.853 0 001.397 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-brand-stone mb-2 leading-tight uppercase tracking-tighter">Il Bivio Tattico</h1>
          <p className="text-stone-500 text-sm mb-8 max-w-xs font-medium">Immergiti in un'avventura interattiva. Risolvi imprevisti, gestisci il meteo e accumula punti esplorazione.</p>
          
          <div className="w-full max-w-xs space-y-3">
            {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((diff) => (
              <button 
                key={diff} onClick={() => startGame(diff)} 
                className="w-full bg-white border border-stone-200 hover:border-brand-sky hover:shadow-md p-4 rounded-2xl text-left transition-all active:scale-95 flex justify-between items-center shadow-sm"
              >
                <div>
                  <span className="block text-sm font-black text-brand-stone uppercase tracking-tight">
                    {diff === 'easy' ? '🌲 Esploratore (Facile)' : diff === 'medium' ? '🦅 Escursionista (Medio)' : '🏔️ Alpinista (Esperto)'}
                  </span>
                  <span className="text-[10px] text-stone-400 font-bold uppercase mt-1 inline-block">
                    {diff === 'easy' ? '3 Vite • Scenari Forestali' : diff === 'medium' ? '2 Vite • Gestione Imprevisti' : '1 Vita • Alta Quota Estrema'}
                  </span>
                </div>
                <svg className="w-5 h-5 text-brand-sky shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- IN GIOCO --- */}
      {gameState === 'PLAYING' && stageData && (
        <div className="flex-1 flex flex-col p-4 overflow-hidden min-h-0 relative bg-stone-50 pb-safe">
          <TrailMap currentStage={currentStage} stages={stages} />

          <div className="flex-1 bg-white border border-stone-200 rounded-2xl p-5 flex flex-col min-h-0 overflow-y-auto shadow-sm">
            <span className="inline-block text-[9px] font-black uppercase tracking-widest text-white bg-brand-sky px-2 py-1 rounded mb-3 w-max">
              {stageData.subtitle}
            </span>
            <h2 className="text-xl font-black text-brand-stone mb-3 leading-snug uppercase tracking-tight">{stageData.title}</h2>
            <p className="text-stone-600 text-sm mb-6 leading-relaxed font-medium">{stageData.description}</p>

            <div className="mt-auto space-y-3 shrink-0">
              {!showFeedback ? (
                stageData.choices.map((choice, idx) => (
                  <button 
                    key={idx} onClick={() => handleChoiceClick(choice)} 
                    className="w-full text-left bg-stone-50 hover:bg-stone-100 border border-stone-200 p-4 rounded-xl text-brand-stone text-sm font-bold transition-all active:scale-[0.98] shadow-sm flex flex-col"
                  >
                    <span>{choice.text}</span>
                    {choice.isGamble && (
                      <span className="text-[10px] text-amber-500 uppercase mt-2 block">🎲 Scelta Rischiosa (50% Probabilità)</span>
                    )}
                  </button>
                ))
              ) : (
                <div className={`p-4 rounded-xl border transition-all ${selectedChoice?.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  <p className={`font-black mb-1.5 text-sm uppercase tracking-wider ${selectedChoice?.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {selectedChoice?.isCorrect ? 'Sopravvivenza Garantita' : 'Scelta Fatale'}
                  </p>
                  <p className="text-xs text-stone-600 mb-5 leading-relaxed font-medium">{selectedChoice?.explanation}</p>
                  <button 
                    onClick={handleAdvance} 
                    className={`w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-white transition-all active:scale-[0.98] shadow-md ${selectedChoice?.isCorrect ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-brand-stone hover:bg-stone-800'}`}
                  >
                    {lives <= 0 ? 'Fine del Viaggio' : 'Prosegui il Tracciato'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- VITTORIA / SCONFITTA --- */}
      {(gameState === 'WON' || gameState === 'LOST') && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto pb-safe bg-stone-50">
          
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border-4 shadow-md ${gameState === 'WON' ? 'bg-emerald-100 text-emerald-600 border-white' : 'bg-rose-100 text-rose-600 border-white'}`}>
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               {gameState === 'WON' ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />}
             </svg>
          </div>
          
          <h1 className="text-2xl font-black text-brand-stone uppercase tracking-tighter mb-1">{gameState === 'WON' ? 'Traguardo Raggiunto!' : 'Smarrito in Quota'}</h1>
          <p className="text-stone-500 text-xs mb-6 text-center max-w-[280px] font-medium">
            {gameState === 'WON' ? 'Hai dimostrato istinto e freddezza in ambiente ostile.' : 'Gli imprevisti della montagna non perdonano.'}
          </p>

          <div className="bg-white border border-stone-200 p-4 rounded-xl flex items-center justify-between w-full max-w-sm mb-4 shadow-sm">
            <div>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-0.5">Punteggio Totale</p>
              <p className="text-2xl font-black text-brand-stone">{score} <span className="text-sm text-stone-400">PT</span></p>
            </div>
            {earnedBadges.length > 0 && (
              <div className="flex gap-1">
                {earnedBadges.map(b => (
                  <div key={b.id} className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-lg" title={b.name}>{b.icon}</div>
                ))}
              </div>
            )}
          </div>

          {weakAreas.length > 0 && (
            <div className="w-full max-w-sm flex flex-wrap justify-center gap-1.5 mb-6">
              {weakAreas.map(tag => (
                <span key={tag} className="text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-150 px-2.5 py-1 rounded-full">
                  ⚠️ {SKILL_LABELS[tag]} × {errorsBySkill[tag]}
                </span>
              ))}
            </div>
          )}

          {suggestedCourse && (
            <div className="w-full max-w-sm bg-white p-6 rounded-3xl border border-stone-200 text-left mb-6 shadow-xl shadow-stone-200/40">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-sky/10 text-brand-sky text-[9px] font-black uppercase tracking-wider mb-4 border border-brand-sky/20">
                <span>{suggestedCourse.isGrowth ? '🎯 IL TUO PROSSIMO LIVELLO' : '🛠️ AREA DI MIGLIORAMENTO'}</span>
              </div>
              
              <h3 className="text-base font-black text-brand-stone uppercase tracking-tight mb-1.5">{suggestedCourse.course.title}</h3>
              <p className="text-xs text-stone-500 mb-5 leading-relaxed font-medium">{suggestedCourse.course.desc}</p>
              
              <button 
                onClick={handleCTAClick} 
                className="w-full bg-brand-sky hover:bg-brand-sky/90 text-white font-black uppercase tracking-widest py-3.5 rounded-xl text-[10px] transition-all active:scale-95 flex justify-center items-center space-x-2 shadow-lg"
              >
                <span>Vai ai Corsi {suggestedCourse.targetLevel.toUpperCase()}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          )}

          <button onClick={() => setGameState('START')} className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors py-2 px-4">
            Rigioca Avventura
          </button>
        </div>
      )}

    </div>
  );
}