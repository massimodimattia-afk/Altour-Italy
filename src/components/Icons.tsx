// In src/components/Icons.tsx
export const Icons = {
  BootIcon: ({ size = 24, className = "" }: { size?: number, className?: string }) => {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" // O il tuo viewBox originale
        fill="none" 
        stroke="currentColor" 
        className={className}
        // ... resto del codice SVG
      >
        {/* ... i tuoi path dello scarpone */}
      </svg>
    );
  },
};
