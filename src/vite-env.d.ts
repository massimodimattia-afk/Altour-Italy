/// <reference types="vite/client" />
import 'react';

declare module 'react' {
  interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    // Aggiungiamo entrambe le versioni così TypeScript smette di lamentarsi 
    // a prescindere da come lo scrivi
    fetchPriority?: 'high' | 'low' | 'auto';
    fetchpriority?: 'high' | 'low' | 'auto';
  }
}