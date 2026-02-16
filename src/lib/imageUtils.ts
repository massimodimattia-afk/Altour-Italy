// Immagini Unsplash di alta qualità a tema montagna per sostituire i placeholder rotti
const MOUNTAIN_IMAGES = [
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop", // Montagne nebbiose (Prossimamente)
  "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=800&auto=format&fit=crop", // Inverno
  "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=800&auto=format&fit=crop", // Trekking
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop"  // Notte stellata
];

const COURSE_IMAGES = [
  "https://images.unsplash.com/photo-1516939884455-14a5c08ac0e0?q=80&w=800&auto=format&fit=crop", // Sci/Neve (Prossimamente)
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop", // Team
  "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=800&auto=format&fit=crop"  // Persone
];

export const hikeImage = (title: string) => {
  // Se è "Prossimamente", usa l'immagine evocativa delle montagne nebbiose
  if (title.toLowerCase().includes('prossimamente')) {
    return MOUNTAIN_IMAGES[0];
  }
  // Altrimenti seleziona un'immagine basata sulla lunghezza del titolo per consistenza (pseudo-random stabile)
  const index = title.length % MOUNTAIN_IMAGES.length;
  return MOUNTAIN_IMAGES[index];
};

export const courseImage = (title: string, category: string) => {
  // Se è "Prossimamente", usa l'immagine evocativa della neve
  if (title.toLowerCase().includes('prossimamente')) {
    return COURSE_IMAGES[0];
  }
  const index = (title.length + category.length) % COURSE_IMAGES.length;
  return COURSE_IMAGES[index];
};