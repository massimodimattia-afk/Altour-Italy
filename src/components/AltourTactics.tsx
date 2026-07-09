import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

// --- 1. TYPING & INTERFACES ---
export type SkillTag =
  | 'abbigliamento' | 'attrezzatura1' | 'calzature' | 'cartografia'
  | 'alimentazione' | 'allenamento' | 'ecocompatibilita' | 'orientamento_strumentale'
  | 'prevenzione' | 'primosoccorso' | 'sentieristica'
  | 'attrezzatura2' | 'geodesia' | 'meteorologia' | 'parchi' | 'progettazione';

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
}

const ALL_SKILL_TAGS: SkillTag[] = [
  'abbigliamento', 'attrezzatura1', 'calzature', 'cartografia',
  'alimentazione', 'allenamento', 'ecocompatibilita', 'orientamento_strumentale',
  'prevenzione', 'primosoccorso', 'sentieristica',
  'attrezzatura2', 'geodesia', 'meteorologia', 'parchi', 'progettazione',
];

const SKILL_LABELS: Record<SkillTag, string> = {
  abbigliamento: 'Abbigliamento',
  attrezzatura1: 'Attrezzatura I',
  calzature: 'Calzature',
  cartografia: 'Cartografia',
  alimentazione: 'Alimentazione',
  allenamento: 'Allenamento',
  ecocompatibilita: 'Comportamenti Ecocompatibili',
  orientamento_strumentale: 'Orientamento Strumentale',
  prevenzione: 'Prevenzione Pericoli',
  primosoccorso: 'Primo Soccorso',
  sentieristica: 'Sentieristica',
  attrezzatura2: 'Attrezzatura Avanzata',
  geodesia: 'Geodesia',
  meteorologia: 'Meteorologia',
  parchi: 'Parchi e Aree Protette',
  progettazione: 'Progettazione Escursioni',
};

const NEXT_LEVEL: Record<CourseLevel, CourseLevel | null> = {
  base: 'intermedio',
  intermedio: 'avanzato',
  avanzato: null,
};

// --- 2. DATABASE LOCALE DEI CORSI ---
const LOCAL_COURSES: Course[] = [
  { id: 'b1', level: 'base', skill: 'abbigliamento', title: 'Abbigliamento in Montagna', desc: 'Stratificazione e scelta dei materiali per ogni condizione meteo.' },
  { id: 'b2', level: 'base', skill: 'attrezzatura1', title: 'Attrezzatura I', desc: 'Zaino, bastoncini e dotazione essenziale per l\'escursionismo base.' },
  { id: 'b3', level: 'base', skill: 'calzature', title: 'Calzature da Trekking', desc: 'Come scegliere e allacciare le scarpe giuste per ogni terreno.' },
  { id: 'b4', level: 'base', skill: 'cartografia', title: 'Lettura della Carta Geografica', desc: 'Impara a leggere la mappa IGM e usare la bussola con sicurezza.' },
  { id: 'i1', level: 'intermedio', skill: 'alimentazione', title: 'Alimentazione in Escursione', desc: 'Cosa mangiare prima, durante e dopo per non calare di energie.' },
  { id: 'i2', level: 'intermedio', skill: 'allenamento', title: 'Allenamento per l\'Escursionismo', desc: 'Preparazione fisica e gestione del ritmo in salita e discesa.' },
  { id: 'i3', level: 'intermedio', skill: 'ecocompatibilita', title: 'Comportamenti Ecocompatibili', desc: 'Muoversi in montagna nel rispetto dell\'ambiente e della fauna.' },
  { id: 'i4', level: 'intermedio', skill: 'orientamento_strumentale', title: 'Orientamento Strumentale', desc: 'GPS, bussola e mappa insieme, fuori sentiero e senza visibilità.' },
  { id: 'i5', level: 'intermedio', skill: 'prevenzione', title: 'Prevenzione Pericoli', desc: 'Riconoscere e gestire i rischi oggettivi del terreno montano.' },
  { id: 'i6', level: 'intermedio', skill: 'primosoccorso', title: 'Primo Soccorso in Montagna', desc: 'Gestire un infortunio e valutare l\'evacuazione in sicurezza.' },
  { id: 'i7', level: 'intermedio', skill: 'sentieristica', title: 'Sentieristica', desc: 'Tempi di percorrenza, varianti e pianificazione del rientro.' },
  { id: 'a1', level: 'avanzato', skill: 'attrezzatura2', title: 'Attrezzatura II', desc: 'Ramponcini, piccozza e tecnica su nevai e terreno impervio.' },
  { id: 'a2', level: 'avanzato', skill: 'geodesia', title: 'Elementi di Geodesia', desc: 'Altimetria, coordinate e calibrazione degli strumenti di quota.' },
  { id: 'a3', level: 'avanzato', skill: 'meteorologia', title: 'Elementi di Meteorologia', desc: 'Leggere il cielo e i bollettini per anticipare i cambi repentini.' },
  { id: 'a4', level: 'avanzato', skill: 'parchi', title: 'Parchi ed Aree Protette', desc: 'Regolamenti e rispetto delle zone protette e della fauna selvatica.' },
  { id: 'a5', level: 'avanzato', skill: 'progettazione', title: 'Progettazione di una Escursione', desc: 'Pianificare dislivelli, tempistiche e vie di fuga a tavolino.' },
];

// --- 3. DATI DI GIOCO AD ELEVATA COMPLESSITÀ ---
const STAGES_DATA: Record<DifficultyLevel, Stage[]> = {
  easy: [
    {
      id: 0, title: "Equidistanza e Curve di Livello", subtitle: "Cartografia",
      description: "Su una tavoletta IGM 1:25.000 riscontri che tra due curve direttrici consecutive sono interposte 4 curve ordinarie. Qual è il dislivello geometrico reale espresso tra due curve ordinarie contigue?",
      coords: { x: 50, y: 110 },
      choices: [
        { text: "25 metri di dislivello verticale per ciascun intervallo.", isCorrect: true, explanation: "Esatto. L'equidistanza standard IGM 1:25.000 è di 25 metri. Le direttrici distano 100m l'una dall'altra e lo spazio tra le ordinarie ne mappa fedelmente la frazione.", skillTag: 'cartografia' },
        { text: "5 metri, calcolati in base al fattore di scala planimetrico ridotto.", isCorrect: false, damage: 1, explanation: "Sbagliato. Confondi l'equidistanza altimetrica con i millimetri grafici di proiezione in piano.", skillTag: 'cartografia' }
      ]
    },
    {
      id: 1, title: "Convezione e Strati Termici", subtitle: "Abbigliamento",
      description: "Stai risalendo un crinale esposto a Nord con temperatura di 4°C e vento costante a 35 km/h. La sudorazione ha bagnato il primo strato. Quale combinazione di materiali massimizza l'evacuazione dell'umidità prevenendo l'ipotermia da conduzione?",
      coords: { x: 120, y: 55 },
      choices: [
        { text: "Polipropilene o lana merino a contatto; guscio esterno in PTFE (Gore-Tex) traspirante.", isCorrect: true, explanation: "Ottimo. Il polipropilene non assorbe acqua e la trasferisce all'esterno, mentre la membrana in PTFE blocca il wind-chill senza intrappolare il vapore.", skillTag: 'abbigliamento' },
        { text: "Primo strato in cotone pettinato ad alta densità accoppiato a un layer intermedio in microfibra.", isCorrect: false, damage: 1, explanation: "Sbagliato. Il cotone trattiene l'umidità fino al suo nucleo, accelerando il raffreddamento corporeo per conduzione termica appena il vento colpisce il tessuto.", skillTag: 'abbigliamento' }
      ]
    },
    {
      id: 2, title: "Serraggio Bi-Zona in Discesa", subtitle: "Calzature",
      description: "Devi affrontare una discesa tecnica di 800 metri di dislivello su ghiaione instabile. Come configuri l'allacciatura degli scarponi per azzerare i traumi subungueali all'avampiede?",
      coords: { x: 190, y: 110 },
      choices: [
        { text: "Serraggio vigoroso sul collo del piede e bloccaggio sui ganci della caviglia per immobilizzare il tallone sul fondo.", isCorrect: true, explanation: "Corretto. Bloccando saldamente il collo del piede si impedisce lo scivolamento anteriore delle dita contro il puntale, preservando le unghie dai microtraumi da impatto.", skillTag: 'calzature' },
        { text: "Allacciatura uniformemente tesa ed esasperata sulla punta per rendere la tomaia un blocco rigido.", isCorrect: false, damage: 1, explanation: "Sbagliato. Costringere le dita blocca la microcircolazione e amplifica gli urti diretti sul puntale della scarpa.", skillTag: 'calzature' }
      ]
    },
    {
      id: 3, title: "Bilanciamento dei Carichi Asiali", subtitle: "Attrezzatura I",
      description: "Stai assemblando uno zaino da 50 litri per un trekking d'alta quota di più giorni. Dove posizioni gli elementi a maggiore densità (tenda pesante, cibo, riserva idrica principale) per non destabilizzare il baricentro scheletrico?",
      coords: { x: 260, y: 55 },
      choices: [
        { text: "A ridosso dello schienale nella zona medio-alta (altezza scapole), centrati rispetto alla colonna.", isCorrect: true, explanation: "Corretto. Posizionare i carichi pesanti vicino al dorso e alti allinea lo zaino al baricentro del corpo, riducendo lo sforzo compensativo dei muscoli lombari.", skillTag: 'attrezzatura1' },
        { text: "Sul fondo dello zaino, subito sopra l'asola inferiore del sacco a pelo.", isCorrect: false, damage: 1, explanation: "Sbagliato. I pesi sul fondo esercitano una leva che tira il busto all'indietro, sbilanciando l'andatura e sovraccaricando le spalle.", skillTag: 'attrezzatura1' }
      ]
    }
  ],
  medium: [
    {
      id: 0, title: "Depauperamento del Glicogeno", subtitle: "Alimentazione",
      description: "Al termine di una salita intensa avverti spossatezza improvvisa, leggera disarticolazione motoria e vertigini. Sono passate 4 ore dall'ultimo spuntino. Qual è l'approccio nutrizionale corretto per contrastare il catabolismo?",
      coords: { x: 50, y: 110 },
      choices: [
        { text: "Assunzione immediata di carboidrati semplici a indice glicemico elevato, seguiti dopo 15 minuti da zuccheri complessi.", isCorrect: true, explanation: "Esatto. Le scorte di glicogeno muscolare ed epatico sono sature. Serve glucosio immediato nel sangue per via sublinguale, stabilizzato poi da amidi a lento rilascio.", skillTag: 'alimentazione' },
        { text: "Integrazione massiva di amminoacidi ramificati (BCAA) puri disciolti in un litro di acqua ipotonica.", isCorrect: false, damage: 1, explanation: "Sbagliato. In piena crisi ipoglicemica le proteine non tamponano la carenza di ATP ematico nel breve termine.", skillTag: 'alimentazione' }
      ]
    },
    {
      id: 1, title: "Soglia di Lattato e Compensazione", subtitle: "Allenamento",
      description: "Durante una salita ripida la frequenza cardiaca supera l'85% della FcMax, innescando bruciore muscolare e iperventilazione. Quale accorgimento biomeccanico adotti per ritornare in regime aerobico?",
      coords: { x: 120, y: 55 },
      choices: [
        { text: "Passo del montanaro: estensione e bloccaggio osseo del ginocchio a ogni passo per concedere una frazione di secondo di riposo ai quadricipiti.", isCorrect: true, explanation: "Perfetto. Il micro-riposo scheletrico permette la riossigenazione dei tessuti e lo smaltimento parziale dell'acido lattico accumulato oltre la soglia anaerobica.", skillTag: 'allenamento' },
        { text: "Aumento della frequenza dei passi accorciando l'andatura e flettendo costantemente il busto in avanti.", isCorrect: false, damage: 1, explanation: "Sbagliato. La flessione continua mantiene i muscoli in contrazione isometrica perenne, accelerando l'asfissia cellulare.", skillTag: 'allenamento' }
      ]
    },
    {
      id: 2, title: "Triangolazione e Azimut Strumentale", subtitle: "Orientamento Strumentale",
      description: "Ti trovi fuori sentiero e devi determinare la tua posizione di stazionamento sulla carta. Individui due picchi visibili all'orizzonte. Quale sequenza tecnica applichi con la bussola?",
      coords: { x: 190, y: 110 },
      choices: [
        { text: "Rilevo l'Azimut magnetico dei picchi, lo converto in Azimut geografico, calcolo i Contrazimut e traccio le linee sulla mappa partendo dai picchi.", isCorrect: true, explanation: "Eccellente. Il punto di intersezione delle due linee di Contrazimut geografico proiettate sulla carta determinerà matematicamente il tuo punto di stazionamento.", skillTag: 'orientamento_strumentale' },
        { text: "Rilevo l'Azimut dei picchi e traccio le medesime rette orientando la bussola direttamente sulla mappa senza variazioni numeriche.", isCorrect: false, damage: 1, explanation: "Sbagliato. Se non calcoli il contrazimut (+/- 180°) e la declinazione magnetica locale, le linee se proietteranno nella direzione opposta.", skillTag: 'orientamento_strumentale' }
      ]
    },
    {
      id: 3, title: "Trauma Cranico Commotivo in Ambiente Remoto", subtitle: "Primo Soccorso",
      description: "Un escursionista viene colpito alla testa da una pietra. Perde conoscenza per 30 secondi, dopodiché rinviene lucido ma manifesta nausea, cefalea intensa e amnesia retrograda. Come intervieni?",
      coords: { x: 260, y: 55 },
      choices: [
        { text: "Immobilizzo l'asse spinale, lo mantengo supino a riposo assoluto e allerto immediatamente il Soccorso Alpino (112/CNSAS).", isCorrect: true, explanation: "Corretto. L'amnesia e la perdita di coscienza indicano un trauma commotivo con potenziale rischio di ematoma intracranico latente. È tassativo il trasporto medico aeroportato.", skillTag: 'primosoccorso' },
        { text: "Gli somministro un analgesico Fans per la cefalea e lo incito a camminare lentamente verso valle per evitare l'ipotermia.", isCorrect: false, damage: 2, explanation: "Grave errore. I Fans possono esacerbare un'emorragia interna intracranica. Muovere il paziente in questo stato è estremamente rischioso.", skillTag: 'primosoccorso' }
      ]
    },
    {
      id: 4, title: "Formula Empirica CAI dei Tempi", subtitle: "Sentieristica",
      description: "Devi calcolare i tempi di percorrenza di un tracciato di tipo E che presenta un dislivello positivo di 900 metri e uno sviluppo planimetrico lineare di 8 chilometri. Qual è la stima corretta?",
      coords: { x: 330, y: 90 },
      choices: [
        { text: "Circa 4 ore complessive (3h per il dislivello + 2h per lo sviluppo, sommando il valore maggiore al 50% del minore).", isCorrect: true, explanation: "Esatto. La regola ufficiale CAI prevede di stimare 300m/h in salita e 4km/h in piano, sommando poi al tempo maggiore la metà del tempo minore.", skillTag: 'sentieristica' },
        { text: "2 ore e 30 minuti, dividendo gli 8 km per il passo medio escursionistico di 4 km/h e ignorando la quota.", isCorrect: false, damage: 1, explanation: "Sbagliato. Omettere il dislivello nel calcolo del tempo escursionistico porta a macroscopici errori di pianificazione, con rischio di farsi sorprendere dal buio.", skillTag: 'sentieristica' }
      ]
    }
  ],
  hard: [
    {
      id: 0, title: "Arresto della Scivolata su Pendio Ghiacciato", subtitle: "Attrezzatura Avanzata",
      description: "Perdi l'equilibrio su un nevaio ripido inclinato a 35° e inizi a scivolare a testa a valle in posizione supina (pancia in su). Qual è l'esatta sequenza cinetica di auto-arresto (self-arrest) con la piccozza?",
      coords: { x: 50, y: 110 },
      choices: [
        { text: "Afferro la piccozza al petto, ruoto il busto piantando la becca lateralmente per fare perno, mi giro prono e sollevo i piedi da terra.", isCorrect: true, explanation: "Eccellente tecnica alpinistica. Sollevare i piedi è vitale: se i ramponi o gli scarponi impuntassero la neve a forte velocità, il corpo verrebbe catapultato all'indietro con traumi spinali severi.", skillTag: 'attrezzatura2' },
        { text: "Faccio leva piantando direttamente i tacchi degli scarponi e spingo il puntale della piccozza sotto il bacino.", isCorrect: false, damage: 1, explanation: "Manovra letale. Piantare i piedi causa il ribaltamento immediato e incontrollato del corpo in aria.", skillTag: 'attrezzatura2' }
      ]
    },
    {
      id: 1, title: "Ondulazione del Geoide e Quota Ortometrica", subtitle: "Geodesia",
      description: "Il tuo ricevitore satellitare GPS indica una quota geometrica riferita all'ellissoide WGS84 di 1650 metri, ma la carta topografica ufficiale riporta una quota ortometrica di 1602 metri. Quale fattore fisico geodetico determina questa discrepanza?",
      coords: { x: 130, y: 55 },
      choices: [
        { text: "L'ondulazione del geoide (lo scostamento della superficie equipotenziale del campo gravitazionale terrestre rispetto all'ellissoide matematico).", isCorrect: true, explanation: "Geodesia pura! Le mappe riportano quote ortometriche riferite al geoide (livello del mare), mentre il GPS legge una quota matematica pura sull'ellissoide WGS84.", skillTag: 'geodesia' },
        { text: "L'errore di rifrazione troposferica zenitale causato dal surriscaldamento estivo delle rocce in quota.", isCorrect: false, damage: 1, explanation: "Sbagliato. Gli errori atmosferici causano fluttuazioni dinamiche di pochi metri, non uno scostamento geodetico sistematico di questa entità.", skillTag: 'geodesia' }
      ]
    },
    {
      id: 2, title: "Indicatori di Ciclogenesi Convettiva", subtitle: "Meteorologia",
      description: "Ti trovi su una cresta esposta. Il barometro registra un calo di 4 hPa in meno di tre ore, il vento ruota bruscamente da Sud-Ovest a Nord-Ovest e noti la comparsa di Altocumulus lenticularis castellanus stabili. Cosa sta per verificarsi?",
      coords: { x: 210, y: 115 },
      choices: [
        { text: "L'approssimarsi imminente di un fronte freddo attivo a rapido sviluppo convettivo con associati fenomeni temporaleschi violenti.", isCorrect: true, explanation: "Esatto. La rotazione repentina del vento accoppiata al calo barometrico repentino anticipa la linea di groppo del fronte freddo in quota. Massima allerta fulmini.", skillTag: 'meteorologia' },
        { text: "Il consolidamento di un'inversione termica da subsidenza anticiclonica subtropicale.", isCorrect: false, damage: 1, explanation: "Sbagliato. L'anticiclone causa un aumento della pressione (hPa) e una stabilizzazione della colonna d'aria, l'esatto opposto dello scenario descritto.", skillTag: 'meteorologia' }
      ]
    },
    {
      id: 3, title: "Point of No Return Temporale (PNR)", subtitle: "Progettazione Escursione",
      description: "Stai conducendo una cordata su una cresta alpinistica valutata AD. La progressione reale è di 150m/h a fronte dei 250m/h stimati. Mancano 3 ore alla vetta e la discesa richiede 4 ore. I temporali termoconvettivi sono previsti per le ore 14:00. Sono le 10:30. Qual è la condotta di comando corretta?",
      coords: { x: 290, y: 55 },
      choices: [
        { text: "Ho intercettato il PNR temporale di sicurezza. Interrompo l'ascesa e inizio la ritirata attrezzando le calate sulle vie di fuga previste.", isCorrect: true, explanation: "Decisione ineccepibile. Continuando arriveresti in cima alle 13:30, esponendo la cordata in cresta durante il picco dell'attività elettrica atmosferica.", skillTag: 'progettazione' },
        { text: "Forzo l'andatura passando a una progressione in conserva corta disancorata per recuperare il gap orario entro le 13:00.", isCorrect: false, damage: 1, explanation: "Molto rischioso. Aumentare la velocità su terreno AD senza protezioni adeguate incrementa esponenzialmente la probabilità di errore umano fatale.", skillTag: 'progettazione' }
      ]
    },
    {
      id: 4, title: "Regolamenti Comunitari ZPS", subtitle: "Parchi e Aree Protette",
      description: "Durante la pianificazione di un intranet invernale fuori sentiero, incroci i confini di una Zona di Protezione Speciale (ZPS - Rete Natura 2000) istituita per la tutela svernante dei tetraonidi. Quale restrizione etologica e legale si applica?",
      coords: { x: 360, y: 90 },
      choices: [
        { text: "Divieto assoluto di attraversamento delle aree forestali di rifugio per prevenire l'involo da stress, che causerebbe un consumo letale delle riserve energetiche.", isCorrect: true, explanation: "Esatto. Lo shock cinetico da disturbo antropico costringe i tetraonidi a consumare calorie insostituibili in inverno, portandoli alla morte per sfinimento termico.", skillTag: 'parchi' },
        { text: "Obbligo di marcia esclusivamente in gruppi superiori a 5 unità per minimizzare l'impatto visivo globale.", isCorrect: false, damage: 1, explanation: "Sbagliato. I gruppi numerosi amplificano il raggio di disturbo acustico e cinetico, peggiorando l'impatto sulla fauna protetta.", skillTag: 'parchi' }
      ]
    }
  ]
};

interface Props {
  onClose: () => void;
}

// --- 4. COMPONENTE MAPPA SVG LIGHT THEME COERENTE ---
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
          <span>VALUTAZIONE TATTICA ATTIVA</span>
        </div>
        {!isWon && (
          <span className="text-[9px] font-black text-stone-400 tracking-wider">
            SNODO {currentStage + 1} DI {totalSteps}
          </span>
        )}
      </div>

      <svg className="w-full h-24 mt-2" viewBox="0 0 400 150">
        <path d={pathD} fill="none" stroke="#e7e5e4" strokeWidth="6" strokeLinecap="round" />
        <path 
          d={pathD} 
          fill="none" 
          stroke="#5aaadd" // brand-sky coerente
          strokeWidth="6" 
          strokeLinecap="round"
          strokeDasharray="400"
          strokeDashoffset={isWon ? 0 : 400 - (currentStage * (400 / totalSteps))}
          className="transition-all duration-700 ease-out"
        />

        {stages.map((node, idx) => {
          const isActive = idx === currentStage && !isWon;
          const isCompleted = idx < currentStage || isWon;
          return (
            <g key={node.id}>
              {isActive && <circle cx={node.coords.x} cy={node.coords.y} r="14" className="fill-brand-sky/20 animate-pulse" style={{ transformOrigin: `${node.coords.x}px ${node.coords.y}px` }} />}
              <circle 
                cx={node.coords.x} 
                cy={node.coords.y} 
                r="8" 
                className={`transition-all duration-300 ${
                  isActive ? 'fill-white stroke-brand-sky stroke-[4px]' 
                  : isCompleted ? 'fill-brand-sky stroke-none' 
                  : 'fill-stone-200 stroke-stone-300 stroke-2'
                }`}
              />
            </g>
          );
        })}

        <circle cx={finalDest.x} cy={finalDest.y} r="10" className={`transition-all duration-300 ${isWon ? 'fill-amber-500 stroke-none' : 'fill-stone-200 stroke-stone-300 stroke-2'}`} />
        <path d="M 347 38 L 350 43 L 355 35" fill="none" stroke={isWon ? '#fff' : '#a8a29e'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        <g style={{ 
          transform: `translate3d(${activeCoord.x}px, ${activeCoord.y}px, 0)`,
          transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-brand-stone/70 sm:p-6 transition-opacity">
      <div className="w-full h-[100dvh] sm:h-[85vh] sm:max-h-[850px] max-w-md bg-stone-50 sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative sm:border-[6px] border-white text-stone-900 touch-none select-none overscroll-none">
        <AltourTacticsEngine onClose={onClose} />
      </div>
    </div>,
    document.body
  );
}

// --- 6. MOTORE PRINCIPALE ---
function AltourTacticsEngine({ onClose }: Props) {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'WON' | 'LOST'>('START');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [currentStage, setCurrentStage] = useState(0);
  const [lives, setLives] = useState(3);
  const [maxLives, setMaxLives] = useState(3);
  
  // Meccanica di Engagement: Streak Combo
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxCombo] = useState(0);

  const emptyErrors = () => ALL_SKILL_TAGS.reduce((acc, tag) => {
    acc[tag] = 0;
    return acc;
  }, {} as Record<SkillTag, number>);

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

  // --- MOTORE DI RACCOMANDAZIONE CORSI ---
  const suggestedCourse = useMemo(() => {
    if (gameState !== 'WON' && gameState !== 'LOST') return null;
    const currentLevel: CourseLevel = difficulty === 'hard' ? 'avanzato' : difficulty === 'medium' ? 'intermedio' : 'base';

    if (weakAreas.length > 0) {
      const match = LOCAL_COURSES.find(c => c.level === currentLevel && c.skill === weakAreas[0]);
      // CORRETTO: targetLevel riceve il valore di currentLevel
      if (match) return { course: match, isGrowth: false, targetLevel: currentLevel };
    }

    const nextLevel = NEXT_LEVEL[currentLevel];
    if (nextLevel) {
      const growthCourse = LOCAL_COURSES.find(c => c.level === nextLevel);
      if (growthCourse) return { course: growthCourse, isGrowth: true, targetLevel: nextLevel };
    }

    const refine = LOCAL_COURSES.find(c => c.level === 'avanzato' && c.skill === 'progettazione');
    return refine ? { course: refine, isGrowth: true, targetLevel: 'avanzato' } : null;
  }, [gameState, weakAreas, difficulty]);

  const startGame = (diff: DifficultyLevel) => {
    const initialLives = diff === 'hard' ? 1 : diff === 'medium' ? 2 : 3;
    setDifficulty(diff);
    setMaxLives(initialLives);
    setLives(initialLives);
    setCurrentStage(0);
    setStreak(0);
    setMaxCombo(0);
    setErrorsBySkill(emptyErrors());
    setSelectedChoice(null);
    setShowFeedback(false);
    setGameState('PLAYING');
  };

  const handleChoiceClick = (choice: Choice) => {
    if (showFeedback) return;
    setSelectedChoice(choice);
    setShowFeedback(true);

    if (choice.isCorrect) {
      setStreak(prev => {
        const nextStreak = prev + 1;
        if (nextStreak > maxStreak) setMaxCombo(nextStreak);
        return nextStreak;
      });
    } else {
      setStreak(0); 
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

  // ─── NUOVA LOGICA SMART PER IL RIATTERRAGGIO IN ACCADEMIA ───
  const handleCTAClick = () => {
    onClose(); // Chiude la modale pulendo lo scroll lock del body
    // Forza il riatterraggio morbido sull'ancora della pagina corsi attiva
    window.location.hash = 'corsi';
  };

  return (
    <div className="flex flex-col h-full w-full bg-stone-50">
      
      <header className="px-5 py-4 border-b border-stone-200 flex items-center justify-between shrink-0 bg-white z-10 pt-safe">
        <div>
          <span className="text-brand-stone font-black tracking-tighter text-lg block leading-none">ALTOUR</span>
          <span className="text-[10px] text-brand-sky font-black uppercase tracking-widest">Academy Tactics</span>
        </div>
        <div className="flex items-center space-x-3">
          {gameState === 'PLAYING' && streak >= 2 && (
            <div className="bg-brand-sky/10 border border-brand-sky/20 px-2 py-1 rounded-md flex items-center space-x-1 animate-pulse">
              <span className="text-[8px] font-black text-brand-sky uppercase tracking-wider">STREAK</span>
              <span className="text-xs font-black text-brand-sky">×{streak}</span>
            </div>
          )}
          {gameState === 'PLAYING' && (
            <div className="flex space-x-1 bg-stone-100 py-1.5 px-2.5 rounded-full border border-stone-200">
              {Array.from({ length: maxLives }).map((_, i) => (
                <div key={i} className={`w-2.5 h-3 rounded-sm transition-colors ${i < lives ? 'bg-brand-sky' : 'bg-stone-300'}`} />
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
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center border border-stone-200 mb-6 shadow-sm">
            <svg className="w-8 h-8 text-brand-stone" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.446l6-1.912a1.859 1.859 0 001.03-1.454V3.059c0-.738-.491-1.37-1.203-1.536l-6 1.382a1.853 1.853 0 00-1.397 0l-6-1.382A1.853 1.853 0 005.18 3.059v12.938c0 .78.518 1.464 1.285 1.638l6 1.382a1.853 1.853 0 001.397 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-brand-stone mb-2 leading-tight uppercase tracking-tighter">Valutazione Tattica</h1>
          <p className="text-stone-500 text-sm mb-8 max-w-xs font-medium">Affronta l'analisi dei bivi decisionali d'alta quota per individuare le tue carenze dottrinali.</p>
          
          <div className="w-full max-w-xs space-y-3">
            {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((diff) => (
              <button 
                key={diff} 
                onClick={() => startGame(diff)} 
                className="w-full bg-white border border-stone-200 hover:border-brand-sky hover:shadow-md p-4 rounded-2xl text-left transition-all active:scale-95 flex justify-between items-center shadow-sm"
              >
                <div>
                  <span className="block text-sm font-black text-brand-stone uppercase tracking-tight">{diff === 'easy' ? 'Livello Base' : diff === 'medium' ? 'Livello Intermedio' : 'Livello Avanzato'}</span>
                  <span className="text-[10px] text-stone-400 font-bold uppercase mt-1 inline-block queen-leading">
                    {diff === 'easy' ? 'Cartografia IGM, Layers, Allacciature' : diff === 'medium' ? 'Fisiologia, Orientamento Strumentale, Traumatologia' : 'Autosoccorso, Geodesia, Micro-Meteorologia'}
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
            <span className="inline-block text-[9px] font-black uppercase tracking-widest text-white bg-brand-sky px-2 py-1 rounded mb-3 w-max">{stageData.subtitle}</span>
            <h2 className="text-lg font-black text-brand-stone mb-3 leading-snug uppercase tracking-tight">{stageData.title}</h2>
            <p className="text-stone-600 text-xs sm:text-sm mb-6 leading-relaxed font-medium">{stageData.description}</p>

            <div className="mt-auto space-y-3 shrink-0">
              {!showFeedback ? (
                stageData.choices.map((choice, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleChoiceClick(choice)} 
                    className="w-full text-left bg-stone-50 hover:bg-stone-100 border border-stone-200 p-4 rounded-xl text-brand-stone text-xs sm:text-sm font-bold transition-all active:scale-[0.98] shadow-sm"
                  >
                    {choice.text}
                  </button>
                ))
              ) : (
                <div className={`p-4 rounded-xl border transition-all ${selectedChoice?.isCorrect ? 'bg-stone-50 border-brand-sky/40' : 'bg-rose-50 border-rose-200'}`}>
                  <p className={`font-black mb-1.5 text-xs uppercase tracking-wider ${selectedChoice?.isCorrect ? 'text-brand-sky' : 'text-rose-700'}`}>
                    {selectedChoice?.isCorrect ? 'Decisione Corretta' : 'Decisione Errata'}
                  </p>
                  <p className="text-xs text-stone-600 mb-4 leading-relaxed font-medium">{selectedChoice?.explanation}</p>
                  <button 
                    onClick={handleAdvance} 
                    className={`w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-white transition-all active:scale-[0.98] shadow-md ${selectedChoice?.isCorrect ? 'bg-brand-sky hover:bg-brand-sky/90' : 'bg-brand-stone hover:bg-brand-stone/90'}`}
                  >
                    {lives <= 0 ? 'Vedi Analisi Carenze' : 'Prosegui'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- VITTORIA / SCONFITTA (Con Riatterraggio Dinamico) --- */}
      {(gameState === 'WON' || gameState === 'LOST') && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto pb-safe bg-stone-50">
          
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border-4 shadow-md ${gameState === 'WON' ? 'bg-stone-100 text-brand-sky border-white' : 'bg-rose-100 text-rose-600 border-white'}`}>
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               {gameState === 'WON' 
                 ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /> 
                 : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
               }
             </svg>
          </div>
          
          <h1 className="text-2xl font-black text-brand-stone uppercase tracking-tighter mb-2">{gameState === 'WON' ? (weakAreas.length === 0 ? 'Analisi Perfetta!' : 'Analisi Conclusa') : 'Smarrito in Quota'}</h1>
          <p className="text-stone-500 text-xs sm:text-sm mb-4 text-center max-w-[280px] font-medium">
            {gameState === 'WON' 
              ? (weakAreas.length === 0 ? 'Nessun errore riscontrato: padroneggi interamente i moduli didattici.' : 'Simulazione completata. Il sistema ha rilevato alcune lacune operative.') 
              : 'I bivi decisionali falliti espongono l\'escursionista a pericoli oggettivi gravi.'}
          </p>

          <div className="bg-white border border-stone-200 p-3.5 rounded-xl flex justify-between items-center w-full max-w-sm mb-4 shadow-sm">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Miglior Streak Consecutiva</span>
            <span className="text-xs font-black text-brand-sky">×{maxStreak}</span>
          </div>

          {weakAreas.length > 0 && (
            <div className="w-full max-w-sm flex flex-wrap justify-center gap-1.5 mb-6">
              {weakAreas.map(tag => (
                <span key={tag} className="text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-150 px-2.5 py-1 rounded-full">
                  {SKILL_LABELS[tag]} × {errorsBySkill[tag]}
                </span>
              ))}
            </div>
          )}

          {suggestedCourse && (
            <div className="w-full max-w-sm bg-white p-6 rounded-3xl border border-stone-200 text-left mb-6 shadow-xl shadow-stone-200/40">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-sky/10 text-brand-sky text-[9px] font-black uppercase tracking-wider mb-4 border border-brand-sky/20">
                <span>{suggestedCourse.isGrowth ? 'PERCORSO DI CRESCITA IN ACCADEMIA' : 'MODULO DI RECUPERO IN ACCADEMIA'}</span>
              </div>
              
              <h3 className="text-base font-black text-brand-stone uppercase tracking-tight mb-1.5">{suggestedCourse.course.title}</h3>
              <p className="text-xs text-stone-500 mb-5 leading-relaxed font-medium">{suggestedCourse.course.desc}</p>
              
              {/* Bottone modificato per chiudere la modale e riagganciare la griglia corsi in SPA */}
              <button 
                onClick={handleCTAClick} 
                className="w-full bg-brand-sky hover:bg-brand-sky/90 text-white font-black uppercase tracking-widest py-3.5 rounded-xl text-[10px] transition-all active:scale-95 flex justify-center items-center space-x-2 shadow-lg"
              >
                <span>Filtra Corsi {suggestedCourse.targetLevel.toUpperCase()}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          )}

          <button onClick={() => setGameState('START')} className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors py-2 px-4">
            Ripeti Test Competenze
          </button>
        </div>
      )}

    </div>
  );
}