# Gestione Allenamenti - Workout Manager

Una web app single page per la gestione completa degli allenamenti con interfaccia Material Design 3 e integrazione Firebase.

## 🏋️ Funzionalità Principali

### 📊 Database Esercizi
- **Gestione Categorie**: Crea, modifica ed elimina categorie di esercizi
- **Gestione Esercizi**: Database completo con parametri personalizzabili
- **Ricerca e Filtri**: Sistema di ricerca avanzato per categorie ed esercizi
- **Modal Dettaglio**: Visualizzazione completa con storico e grafici progressi
- **Diario Esercizi**: Sezione note e commenti per ogni esercizio

### 📈 Storico e Progressi
- **Timeline Cronologica**: Visualizzazione delle modifiche ai parametri nel tempo
- **Confronto Parametri**: Frecce di confronto per visualizzare miglioramenti/peggioramenti
- **Filtri Avanzati**: Ricerca per esercizio, data e contenuto
- **Documentazione**: Tasto flottante per aggiungere rapidamente nuove sessioni
- **Raggruppamento**: Organizzazione automatica per data

### 🏃 Scheda Allenamento
- **Creazione Schede**: Builder intuitivo per schede personalizzate
- **Cronometro Integrato**: Timer per durata allenamento
- **Timer Riposo**: Timer personalizzabile per pause tra serie
- **Tracking Serie**: Sistema di spunta per serie completate
- **Modalità Allenamento**: Interfaccia dedicata durante l'allenamento attivo
- **Progressi Real-time**: Barra di progresso e statistiche live

## 🛠️ Tecnologie Utilizzate

- **Frontend**: React 18 + Vite
- **UI Framework**: Material-UI (MUI) v5 con Material Design 3
- **Database**: Firebase Realtime Database
- **Styling**: Material-UI System + CSS-in-JS
- **Icons**: Material Icons
- **Date Handling**: date-fns con localizzazione italiana
- **Build Tool**: Vite per sviluppo e build ottimizzati

## 🚀 Installazione e Setup

### Prerequisiti
- Node.js 18+ 
- npm o pnpm
- Account Firebase con Realtime Database abilitato

### Installazione
```bash
# Clona il repository
git clone <repository-url>
cd workout-manager

# Installa le dipendenze
pnpm install

# Configura Firebase
# Modifica src/lib/firebase.js con le tue credenziali Firebase

# Avvia il server di sviluppo
pnpm run dev
```

### Configurazione Firebase
1. Crea un nuovo progetto Firebase
2. Abilita Realtime Database
3. Configura le regole di sicurezza:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
4. Aggiorna `src/lib/firebase.js` con la tua configurazione

## 📱 Struttura del Progetto

```
src/
├── components/           # Componenti React principali
│   ├── DatabaseEsercizi.jsx
│   ├── StoricoProgressi.jsx
│   └── SchedaAllenamento.jsx
├── lib/                 # Utilities e servizi
│   ├── firebase.js      # Configurazione Firebase
│   ├── firebaseService.js # Servizi CRUD
│   └── constants.js     # Costanti e utility
├── App.jsx             # Componente principale
└── main.jsx           # Entry point
```

## 🔥 Struttura Database Firebase

```
/categories/{categoryId}
  - name: string
  - description: string
  - createdAt: timestamp
  - updatedAt: timestamp

/exercises/{exerciseId}
  - name: string
  - categoryId: string
  - bodyPart: string
  - parameters: object
  - createdAt: timestamp
  - updatedAt: timestamp

/exerciseHistory/{exerciseId}/{historyId}
  - parameters: object
  - previousParameters: object
  - timestamp: timestamp
  - comment: string

/exerciseDiary/{exerciseId}/{diaryId}
  - comment: string
  - timestamp: timestamp

/workoutSheets/{sheetId}
  - name: string
  - description: string
  - exercises: array
  - estimatedDuration: number
  - createdAt: timestamp
  - updatedAt: timestamp
```

## 🎨 Design System

L'applicazione utilizza Material Design 3 con:
- **Colori**: Palette viola/blu per tema fitness
- **Typography**: Roboto font family
- **Componenti**: Material-UI components
- **Layout**: Responsive design mobile-first
- **Navigazione**: Tab navigation con indicatori visivi

## 📋 Funzionalità Implementate

### ✅ Completate
- [x] Setup progetto React + Vite + Material-UI
- [x] Configurazione Firebase Realtime Database
- [x] Layout principale con navigazione responsive
- [x] Sezione Database Esercizi completa
- [x] Sezione Storico e Progressi completa
- [x] Sezione Scheda Allenamento completa
- [x] Sistema CRUD per categorie ed esercizi
- [x] Timeline cronologica con filtri
- [x] Cronometro e timer per allenamenti
- [x] Interfaccia Material Design 3

### 🔄 In Sviluppo
- [ ] Risoluzione problemi connessione Firebase
- [ ] Grafici progressi con Chart.js
- [ ] Export/Import dati
- [ ] Modalità offline
- [ ] Notifiche push

## 🚀 Deployment

### Build di Produzione
```bash
# Crea build ottimizzata
pnpm run build

# Preview build locale
pnpm run preview
```

### Deploy su Netlify/Vercel
1. Connetti il repository GitHub
2. Configura le variabili d'ambiente Firebase
3. Deploy automatico su push

## 🤝 Contribuire

1. Fork del progetto
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è sotto licenza MIT. Vedi il file `LICENSE` per dettagli.

## 👨‍💻 Autore

Sviluppato con ❤️ per la gestione professionale degli allenamenti.

---

**Nota**: Questo è un progetto dimostrativo che mostra l'integrazione di React, Material-UI e Firebase per applicazioni fitness moderne.

