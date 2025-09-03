// Parti del corpo per gli esercizi
export const BODY_PARTS = [
  'Braccia',
  'Spalle', 
  'Dorso',
  'Petto',
  'Addome',
  'Glutei',
  'Gambe',
  'Cardio'
];

// Colori disponibili per gli esercizi nelle schede (10 colori diversi)
export const EXERCISE_COLORS = [
  { name: 'Rosso', value: '#f44336', light: '#ffebee' },
  { name: 'Rosa', value: '#e91e63', light: '#fce4ec' },
  { name: 'Viola', value: '#9c27b0', light: '#f3e5f5' },
  { name: 'Blu Scuro', value: '#3f51b5', light: '#e8eaf6' },
  { name: 'Blu', value: '#2196f3', light: '#e3f2fd' },
  { name: 'Azzurro', value: '#00bcd4', light: '#e0f2f1' },
  { name: 'Verde', value: '#4caf50', light: '#e8f5e8' },
  { name: 'Giallo', value: '#ffeb3b', light: '#fffde7' },
  { name: 'Arancione', value: '#ff9800', light: '#fff3e0' },
  { name: 'Marrone', value: '#795548', light: '#efebe9' }
];

// Utility per formattare le date
export const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('it-IT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString('it-IT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Utility per confrontare parametri e determinare la direzione della freccia
export const getParameterDirection = (currentValue, previousValue) => {
  if (previousValue === null || previousValue === undefined) {
    return null; // Primo inserimento
  }
  
  const current = parseFloat(currentValue);
  const previous = parseFloat(previousValue);
  
  if (isNaN(current) || isNaN(previous)) {
    return null; // Valori non numerici
  }
  
  if (current > previous) {
    return 'up';
  } else if (current < previous) {
    return 'down';
  } else {
    return 'equal';
  }
};

// Utility per parsare parametri composti (es. "2x5kg, 1x10kg")
export const parseCompositeParameter = (value) => {
  if (typeof value !== 'string') {
    return value;
  }
  
  // Cerca pattern come "2x5kg" o "3 ripetizioni con 10kg"
  const patterns = [
    /(\d+)x(\d+(?:\.\d+)?)kg/g,
    /(\d+)\s*ripetizioni?\s*con\s*(\d+(?:\.\d+)?)kg/gi,
    /(\d+)\s*serie\s*da\s*(\d+)\s*ripetizioni?/gi
  ];
  
  for (const pattern of patterns) {
    const matches = [...value.matchAll(pattern)];
    if (matches.length > 0) {
      return matches.map(match => ({
        sets: parseInt(match[1]),
        weight: parseFloat(match[2]) || 0,
        reps: parseInt(match[2]) || 0
      }));
    }
  }
  
  return value;
};

// Utility per formattare parametri composti per la visualizzazione
export const formatCompositeParameter = (value) => {
  if (Array.isArray(value)) {
    return value.map(item => {
      if (item.weight !== undefined) {
        return `${item.sets}x${item.weight}kg`;
      } else if (item.reps !== undefined) {
        return `${item.sets} serie da ${item.reps} ripetizioni`;
      }
      return JSON.stringify(item);
    }).join(', ');
  }
  
  return value;
};

// Utility per convertire minuti e secondi in millisecondi
export const timeToMs = (minutes = 0, seconds = 0) => {
  return (minutes * 60 + seconds) * 1000;
};

// Utility per convertire millisecondi in minuti e secondi
export const msToTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return { minutes, seconds };
};

// Utility per formattare il tempo per la visualizzazione (accetta secondi)
export const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

