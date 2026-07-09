import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

// --- 1. TYPING & INTERFACES ---
export type SkillTag = 'orientamento' | 'meteo' | 'tecnica' | 'sopravvivenza';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type CourseLevel = 'base' | 'intermedio' | 'avanzato';

interface Choice {
  text: string;
  isCorrect: boolean;
  explanation: string;
  damage?: number;
  skillTag: SkillTag;
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

// --- 2. DATABASE LOCALE DEI CORSI ---
const LOCAL_COURSES: Course[] = [
  { id: 'c1', level: 'base', skill: 'orientamento', title: 'Corso Base: Cartografia', desc: 'Impara a leggere la mappa IGM e usare la bussola con sicurezza.', url: '/corsi/base-cartografia' },
  { id: 'c2', level: 'base', skill: 'meteo', title: 'Introduzione al Meteo Montano', desc: 'Riconoscere le nuvole e anticipare i cambiamenti atmosferici.', url: '/corsi/base-meteo' },
  { id: 'c3', level: 'intermedio', skill: 'tecnica', title: 'Tecnica su Terreno Impervio', desc: 'Progressione su pietraie, guadi e uso corretto dei bastoncini.', url: '/corsi/intermedio-tecnica' },
  { id: 'c4', level: 'avanzato', skill: 'sopravvivenza', title: 'Gestione Emergenze', desc: 'Autosoccorso, bivacco d\'emergenza e chiamate SOS.', url: '/corsi/avanzato-emergenze' },
  { id: 'c5', level: 'intermedio', skill: 'orientamento', title: 'Navigazione Avanzata', desc: 'Fuori sentiero e orientamento senza visibilità.', url: '/corsi/intermedio-navigazione' },
];

// --- 3. DATI DI GIOCO & MAPPA ---
// Le coordinate sono calibrate su un viewBox="0 0 400 150"
const STAGES_DATA: Record<DifficultyLevel, Stage[]> = {
  easy: [
    {
      id: 0, title: "La Partenza", subtitle: "Orientamento",
      description: "Il segnavia CAI è coperto da rovi. Una traccia non segnalata scende rapida verso valle. Che fai?",
      coords: { x: 50, y: 110 },
      choices: [
        { text: "Consulto la mappa offline e cerco il segnavia.", isCorrect: true, explanation: "Ottimo! Mai fidarsi delle tracce non segnate.", skillTag: 'orientamento' },
        { text: "Seguo la traccia battuta, sembra diretta.", isCorrect: false, damage: 1, explanation: "Trappola! Spesso sono passaggi per animali che finiscono in dirupi.", skillTag: 'orientamento' }
      ]
    },
    {
      id: 1, title: "Nebbia Improvvisa", subtitle: "Meteo",
      description: "In cresta, una fitta nebbia azzera la visibilità a meno di 5 metri. Non vedi più il sentiero.",
      coords: { x: 150, y: 50 },
      choices: [
        { text: "Acceleriamo per uscire dalla nebbia il prima possibile.", isCorrect: false, damage: 1, explanation: "Errore fatale in cresta! Il rischio di caduta è altissimo.", skillTag: 'meteo' },
        { text: "Mi fermo, consulto la bussola e torno sui miei passi certi.", isCorrect: true, explanation: "La regola d'oro in caso di meteo avverso improvviso.", skillTag: 'meteo' }
      ]
    },
    {
      id: 2, title: "Ometto di Pietra", subtitle: "Orientamento",
      description: "Su una pietraia desolata, noti una piccola piramide di sassi impilati. Cosa significa?",
      coords: { x: 250, y: 120 },
      choices: [
        { text: "È un segnavia, lo seguo per mantenere la rotta.", isCorrect: true, explanation: "Esatto. Gli ometti di pietra sono fondamentali in alta quota.", skillTag: 'orientamento' },
        { text: "È solo l'opera di un turista, lo ignoro.", isCorrect: false, damage: 1, explanation: "Sbagliato. Ignorare gli ometti in una pietraia ti farà perdere la via.", skillTag: 'orientamento' }
      ]
    }
  ],
  medium: [], 
  hard: []    
};

interface Props {
  onClose: () => void;
}

// --- 4. COMPONENTE MAPPA SVG (Il tracciato interattivo) ---
function TrailMap({ currentStage, stages }: { currentStage: number, stages: Stage[] }) {
  // Genera un percorso morbido SVG che unisce i punti
  const pathD = "M 50 110 Q 100 50, 150 50 T 250 120 T 350 40";
  // Punto finale virtuale per mostrare dove finisce il sentiero
  const finalDest = { x: 350, y: 40 };
  
  // Calcolo progresso
  const totalSteps = stages.length;
  const isWon = currentStage >= totalSteps;
  
  // Determina la posizione attuale del cursore (se ha vinto, va al traguardo)
  const activeCoord = isWon ? finalDest : stages[currentStage]?.coords || { x: 50, y: 110 };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 relative overflow-hidden shrink-0 shadow-sm mb-4">
      <div className="absolute top-3 left-3 flex items-center space-x-1.5 bg-stone-100 py-1 px-2.5 rounded-full border border-stone-200 text-[9px] font-black text-stone-500 tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>TRACCIATO ATTIVO</span>
      </div>

      <svg className="w-full h-24 mt-2" viewBox="0 0 400 150">
        {/* Sfondo della traccia */}
        <path d={pathD} fill="none" stroke="#e7e5e4" strokeWidth="6" strokeLinecap="round" />
        
        {/* Progresso della traccia */}
        <path 
          d={pathD} 
          fill="none" 
          stroke="#10b981" 
          strokeWidth="6" 
          strokeLinecap="round"
          strokeDasharray="400"
          strokeDashoffset={isWon ? 0 : 400 - (currentStage * (400 / totalSteps))}
          className="transition-all duration-700 ease-out"
        />

        {/* Nodi del sentiero */}
        {stages.map((node, idx) => {
          const isActive = idx === currentStage && !isWon;
          const isCompleted = idx < currentStage || isWon;
          return (
            <g key={node.id}>
              {isActive && <circle cx={node.coords.x} cy={node.coords.y} r="14" className="fill-emerald-500/20 animate-pulse" />}
              <circle 
                cx={node.coords.x} 
                cy={node.coords.y} 
                r="8" 
                className={`transition-all duration-300 ${
                  isActive ? 'fill-white stroke-emerald-500 stroke-[4px]' 
                  : isCompleted ? 'fill-emerald-500 stroke-none' 
                  : 'fill-stone-200 stroke-stone-300 stroke-2'
                }`}
              />
            </g>
          );
        })}

        {/* Nodo Traguardo Finale */}
        <circle cx={finalDest.x} cy={finalDest.y} r="10" className={`transition-all duration-300 ${isWon ? 'fill-amber-400 stroke-none' : 'fill-stone-200 stroke-stone-300 stroke-2'}`} />
        <path d="M 347 38 L 350 43 L 355 35" fill="none" stroke={isWon ? '#fff' : '#a8a29e'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Indicatore "Escursionista" */}
        <g style={{ 
          transform: `translate(${activeCoord.x}px, ${activeCoord.y}px)`,
          transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <g transform="translate(-10, -28)">
            <path d="M10 0C4.48 0 0 4.48 0 10c0 5.25 10 13 10 13s10-7.75 10-13c0-5.52-4.48-10-10-10z" className="fill-amber-500 drop-shadow-md"/>
            <circle cx="10" cy="10" r="4" className="fill-white"/>
          </g>
        </g>
      </svg>
    </div>
  );
}

// --- 5. PORTAL WRAPPER (Gestione Modale Scura esterna) ---
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-900/70 sm:p-6 transition-opacity">
      {/* Contenitore Modale Light Theme */}
      <div className="w-full h-[100dvh] sm:h-[85vh] sm:max-h-[850px] max-w-md bg-stone-50 sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative sm:border-[6px] border-white text-stone-900 touch-none select-none overscroll-none">
        <AltourTacticsEngine onClose={onClose} />
      </div>
    </div>,
    document.body
  );
}

// --- 6. MOTORE PRINCIPALE (Theme Chiaro) ---
function AltourTacticsEngine({ onClose }: Props) {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'WON' | 'LOST'>('START');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [currentStage, setCurrentStage] = useState(0);
  const [lives, setLives] = useState(3);
  const [maxLives, setMaxLives] = useState(3);
  
  const [errorsBySkill, setErrorsBySkill] = useState<Record<SkillTag, number>>({
    orientamento: 0, meteo: 0, tecnica: 0, sopravvivenza: 0
  });

  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const stages = STAGES_DATA[difficulty]?.length > 0 ? STAGES_DATA[difficulty] : STAGES_DATA['easy'];
  const stageData = stages[currentStage];

  const suggestedCourse = useMemo(() => {
    if (gameState !== 'WON' && gameState !== 'LOST') return null;
    let weakestSkill: SkillTag = 'orientamento'; 
    let maxErrors = -1;
    (Object.keys(errorsBySkill) as SkillTag[]).forEach(skill => {
      if (errorsBySkill[skill] > maxErrors) {
        maxErrors = errorsBySkill[skill];
        weakestSkill = skill;
      }
    });

    const targetLevel: CourseLevel = difficulty === 'hard' ? 'avanzato' : difficulty === 'medium' ? 'intermedio' : 'base';
    const exactMatch = LOCAL_COURSES.find(c => c.level === targetLevel && c.skill === weakestSkill);
    return exactMatch || LOCAL_COURSES.find(c => c.level === targetLevel) || LOCAL_COURSES[0];
  }, [gameState, errorsBySkill, difficulty]);

  const startGame = (diff: DifficultyLevel) => {
    const initialLives = diff === 'hard' ? 1 : diff === 'medium' ? 2 : 3;
    setDifficulty(diff);
    setMaxLives(initialLives);
    setLives(initialLives);
    setCurrentStage(0);
    setErrorsBySkill({ orientamento: 0, meteo: 0, tecnica: 0, sopravvivenza: 0 });
    setSelectedChoice(null);
    setShowFeedback(false);
    setGameState('PLAYING');
  };

  const handleChoiceClick = (choice: Choice) => {
    if (showFeedback) return;
    setSelectedChoice(choice);
    setShowFeedback(true);

    if (!choice.isCorrect) {
      setLives(prev => Math.max(0, prev - (choice.damage || 1)));
      setErrorsBySkill(prev => ({ ...prev, [choice.skillTag]: prev[choice.skillTag] + 1 }));
    }
  };

  const handleAdvance = () => {
    if (lives <= 0) {
      setGameState('LOST');
      return;
    }
    if (currentStage + 1 >= stages.length) {
      setGameState('WON');
    } else {
      setCurrentStage(prev => prev + 1);
      setSelectedChoice(null);
      setShowFeedback(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      
      {/* HEADER CHIARO */}
      <header className="px-5 py-4 border-b border-stone-200 flex items-center justify-between shrink-0 bg-white z-10 pt-safe">
        <div>
          <span className="text-stone-900 font-black tracking-tighter text-lg block leading-none">ALTOUR</span>
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Academy Tactics</span>
        </div>
        <div className="flex items-center space-x-4">
          {gameState === 'PLAYING' && (
            <div className="flex space-x-1.5 bg-stone-100 py-1.5 px-3 rounded-full border border-stone-200">
              {Array.from({ length: maxLives }).map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full shadow-sm transition-colors ${i < lives ? 'bg-emerald-500' : 'bg-stone-300'}`} />
              ))}
            </div>
          )}
          <button onClick={onClose} className="p-2 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </header>

      {/* --- STATO: MENU START --- */}
      {gameState === 'START' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto pb-safe">
          <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center border border-stone-200 mb-6 shadow-sm">
            <svg className="w-10 h-10 text-stone-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.446l6-1.912a1.859 1.859 0 001.03-1.454V3.059c0-.738-.491-1.37-1.203-1.536l-6 1.382a1.853 1.853 0 00-1.397 0l-6-1.382A1.853 1.853 0 005.18 3.059v12.938c0 .78.518 1.464 1.285 1.638l6 1.382a1.853 1.853 0 001.397 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-stone-900 mb-2 leading-tight">Il Bivio dell'Escursionista</h1>
          <p className="text-stone-500 text-sm mb-10 max-w-xs font-medium">Testa il tuo istinto di sopravvivenza e scopri il livello di formazione adatto a te.</p>
          
          <div className="w-full max-w-xs space-y-3">
            {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((diff) => (
              <button 
                key={diff} 
                onClick={() => startGame(diff)} 
                className="w-full bg-white border border-stone-200 hover:border-emerald-500 hover:shadow-md p-4 rounded-2xl text-left transition-all active:scale-95 flex justify-between items-center shadow-sm"
              >
                <div>
                  <span className="block text-sm font-black text-stone-800 capitalize">{diff === 'easy' ? 'Esploratore (Facile)' : diff === 'medium' ? 'Escursionista (Medio)' : 'Alpinista (Esperto)'}</span>
                  <span className="text-[10px] text-stone-500 font-bold uppercase mt-1 inline-block">{diff === 'easy' ? '3 Vite • Bivi Base' : diff === 'medium' ? '2 Vite • Misto' : '1 Vita • Tecnico'}</span>
                </div>
                <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- STATO: IN GIOCO --- */}
      {gameState === 'PLAYING' && stageData && (
        <div className="flex-1 flex flex-col p-4 overflow-hidden min-h-0 relative bg-stone-50 pb-safe">
          
          {/* MAPPA SVG RIAVVIATA */}
          <TrailMap currentStage={currentStage} stages={stages} />

          <div className="flex-1 bg-white border border-stone-200 rounded-2xl p-5 flex flex-col min-h-0 overflow-y-auto shadow-sm">
            <span className="inline-block text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded mb-3 w-max">{stageData.subtitle}</span>
            <h2 className="text-xl font-black text-stone-900 mb-3 leading-snug">{stageData.title}</h2>
            <p className="text-stone-600 text-sm mb-6 leading-relaxed font-medium">{stageData.description}</p>

            <div className="mt-auto space-y-3 shrink-0">
              {!showFeedback ? (
                stageData.choices.map((choice, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleChoiceClick(choice)} 
                    className="w-full text-left bg-stone-50 hover:bg-stone-100 border border-stone-200 p-4 rounded-xl text-stone-800 text-sm font-bold transition-all active:scale-[0.98] shadow-sm"
                  >
                    {choice.text}
                  </button>
                ))
              ) : (
                <div className={`p-5 rounded-xl border transition-all ${selectedChoice?.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  <p className={`font-black mb-1.5 text-sm uppercase tracking-wider ${selectedChoice?.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {selectedChoice?.isCorrect ? 'Scelta Corretta' : 'Attenzione!'}
                  </p>
                  <p className="text-xs text-stone-600 mb-5 leading-relaxed font-medium">{selectedChoice?.explanation}</p>
                  <button 
                    onClick={handleAdvance} 
                    className={`w-full py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest text-white transition-all active:scale-[0.98] shadow-md ${selectedChoice?.isCorrect ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-stone-900 hover:bg-stone-800'}`}
                  >
                    {lives <= 0 ? 'Vedi Risultato' : 'Prosegui il Cammino'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- STATO: VITTORIA / SCONFITTA --- */}
      {(gameState === 'WON' || gameState === 'LOST') && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto pb-safe">
          
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 border-4 shadow-lg ${gameState === 'WON' ? 'bg-emerald-100 text-emerald-600 border-white' : 'bg-rose-100 text-rose-600 border-white'}`}>
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               {gameState === 'WON' 
                 ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /> 
                 : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
               }
             </svg>
          </div>
          
          <h1 className="text-3xl font-black text-stone-900 mb-2">{gameState === 'WON' ? 'Ce l\'hai fatta!' : 'Ti sei smarrito...'}</h1>
          <p className="text-stone-500 text-sm mb-8 text-center max-w-[260px] font-medium">
            {gameState === 'WON' ? 'Ottima lettura del territorio. Sei pronto per i sentieri reali.' : 'La montagna richiede preparazione. Hai perso l\'orientamento.'}
          </p>

          {suggestedCourse && (
            <div className="w-full max-w-sm bg-white p-6 rounded-3xl border border-stone-200 text-left mb-6 shadow-xl shadow-stone-200/50">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#7aaecd]/10 text-[#7aaecd] text-[9px] font-black uppercase tracking-wider mb-4">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                <span>IL CORSO CONSIGLIATO PER TE</span>
              </div>
              
              <h3 className="text-lg font-black text-stone-900 leading-tight mb-2">{suggestedCourse.title}</h3>
              <p className="text-xs text-stone-500 mb-6 leading-relaxed font-medium">{suggestedCourse.desc}</p>
              
              <button 
                onClick={() => window.open(suggestedCourse.url, '_blank')} 
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-black uppercase tracking-widest py-3.5 rounded-xl text-[10px] transition-all active:scale-95 flex justify-center items-center space-x-2 shadow-lg"
              >
                <span>Scopri il Corso in Academy</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          )}

          <button onClick={() => setGameState('START')} className="text-[11px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors py-2 px-4">
            Torna al Menu Principale
          </button>
        </div>
      )}

    </div>
  );
}