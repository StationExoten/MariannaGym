import { database } from './firebase.js';
import { ref, push, set, get, remove, update, query, orderByChild } from 'firebase/database';

// Struttura dati Firebase:
// /categories/{categoryId}
//   - name: string
//   - description: string
//   - createdAt: timestamp
//   - updatedAt: timestamp
//
// /exercises/{exerciseId}
//   - name: string
//   - categoryId: string
//   - bodyPart: string (Braccia, Spalle, Dorso, Petto, Addome, Glutei, Gambe, Cardio)
//   - parameters: object (chiavi dinamiche per i parametri dell'esercizio)
//   - createdAt: timestamp
//   - updatedAt: timestamp
//
// /exerciseHistory/{exerciseId}/{historyId}
//   - parameters: object (valori dei parametri aggiornati)
//   - previousParameters: object (valori precedenti per confronto)
//   - timestamp: timestamp
//   - comment: string (opzionale)
//
// /exerciseDiary/{exerciseId}/{diaryId}
//   - comment: string
//   - timestamp: timestamp
//
// /workoutSheets/{sheetId}
//   - name: string
//   - description: string
//   - notes: string
//   - exercises: array di oggetti con exerciseId, order, completed, disabled, color
//   - pauses: array di oggetti con order, duration, active
//   - texts: array di oggetti con order, content
//   - createdAt: timestamp
//   - updatedAt: timestamp

// Utility per timestamp
const getTimestamp = () => Date.now();

// === CATEGORIE ===
export const categoryService = {
  // Crea una nuova categoria
  async create(categoryData) {
    const categoriesRef = ref(database, 'categories');
    const newCategoryRef = push(categoriesRef);
    const timestamp = getTimestamp();
    
    const category = {
      ...categoryData,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await set(newCategoryRef, category);
    return { id: newCategoryRef.key, ...category };
  },

  // Ottieni tutte le categorie
  async getAll() {
    const categoriesRef = ref(database, 'categories');
    const snapshot = await get(categoriesRef);
    
    if (snapshot.exists()) {
      const categories = [];
      snapshot.forEach((childSnapshot) => {
        categories.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return categories;
    }
    return [];
  },

  // Ottieni una categoria per ID
  async getById(categoryId) {
    const categoryRef = ref(database, `categories/${categoryId}`);
    const snapshot = await get(categoryRef);
    
    if (snapshot.exists()) {
      return { id: categoryId, ...snapshot.val() };
    }
    return null;
  },

  // Aggiorna una categoria
  async update(categoryId, updates) {
    const categoryRef = ref(database, `categories/${categoryId}`);
    const updateData = {
      ...updates,
      updatedAt: getTimestamp()
    };
    
    await update(categoryRef, updateData);
    return updateData;
  },

  // Elimina una categoria
  async delete(categoryId) {
    const categoryRef = ref(database, `categories/${categoryId}`);
    await remove(categoryRef);
  }
};

// === ESERCIZI ===
export const exerciseService = {
  // Crea un nuovo esercizio
  async create(exerciseData) {
    const exercisesRef = ref(database, 'exercises');
    const newExerciseRef = push(exercisesRef);
    const timestamp = getTimestamp();
    
    const exercise = {
      ...exerciseData,
      parameters: exerciseData.parameters || {},
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await set(newExerciseRef, exercise);
    return { id: newExerciseRef.key, ...exercise };
  },

  // Ottieni tutti gli esercizi
  async getAll() {
    const exercisesRef = ref(database, 'exercises');
    const snapshot = await get(exercisesRef);
    
    if (snapshot.exists()) {
      const exercises = [];
      snapshot.forEach((childSnapshot) => {
        exercises.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return exercises;
    }
    return [];
  },

  // Ottieni esercizi per categoria
  async getByCategory(categoryId) {
    const exercisesRef = ref(database, 'exercises');
    const categoryQuery = query(exercisesRef, orderByChild('categoryId'));
    const snapshot = await get(categoryQuery);
    
    const exercises = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const exercise = childSnapshot.val();
        if (exercise.categoryId === categoryId) {
          exercises.push({
            id: childSnapshot.key,
            ...exercise
          });
        }
      });
    }
    return exercises;
  },

  // Ottieni un esercizio per ID
  async getById(exerciseId) {
    const exerciseRef = ref(database, `exercises/${exerciseId}`);
    const snapshot = await get(exerciseRef);
    
    if (snapshot.exists()) {
      return { id: exerciseId, ...snapshot.val() };
    }
    return null;
  },

  // Aggiorna un esercizio
  async update(exerciseId, updates) {
    const exerciseRef = ref(database, `exercises/${exerciseId}`);
    const updateData = {
      ...updates,
      updatedAt: getTimestamp()
    };
    
    await update(exerciseRef, updateData);
    return updateData;
  },

  // Elimina un esercizio
  async delete(exerciseId) {
    const exerciseRef = ref(database, `exercises/${exerciseId}`);
    await remove(exerciseRef);
    
    // Elimina anche lo storico e il diario associati
    const historyRef = ref(database, `exerciseHistory/${exerciseId}`);
    const diaryRef = ref(database, `exerciseDiary/${exerciseId}`);
    await remove(historyRef);
    await remove(diaryRef);
  }
};

// === STORICO ESERCIZI ===
export const historyService = {
  // Aggiungi una voce allo storico
  async addEntry(exerciseId, parameters, previousParameters = null, comment = '') {
    const historyRef = ref(database, `exerciseHistory/${exerciseId}`);
    const newEntryRef = push(historyRef);
    const timestamp = getTimestamp();
    
    const entry = {
      parameters,
      previousParameters,
      timestamp,
      comment
    };
    
    await set(newEntryRef, entry);
    return { id: newEntryRef.key, ...entry };
  },

  // Ottieni lo storico di un esercizio
  async getByExercise(exerciseId) {
    const historyRef = ref(database, `exerciseHistory/${exerciseId}`);
    const snapshot = await get(historyRef);
    
    if (snapshot.exists()) {
      const history = [];
      snapshot.forEach((childSnapshot) => {
        history.push({
          id: childSnapshot.key,
          exerciseId,
          ...childSnapshot.val()
        });
      });
      // Ordina per timestamp decrescente (più recente prima)
      return history.sort((a, b) => b.timestamp - a.timestamp);
    }
    return [];
  },

  // Ottieni tutto lo storico
  async getAll() {
    const historyRef = ref(database, 'exerciseHistory');
    const snapshot = await get(historyRef);
    
    const allHistory = [];
    if (snapshot.exists()) {
      snapshot.forEach((exerciseSnapshot) => {
        const exerciseId = exerciseSnapshot.key;
        exerciseSnapshot.forEach((entrySnapshot) => {
          allHistory.push({
            id: entrySnapshot.key,
            exerciseId,
            ...entrySnapshot.val()
          });
        });
      });
    }
    // Ordina per timestamp decrescente
    return allHistory.sort((a, b) => b.timestamp - a.timestamp);
  },

  // Aggiorna una voce dello storico
  async update(exerciseId, entryId, updates) {
    const entryRef = ref(database, `exerciseHistory/${exerciseId}/${entryId}`);
    await update(entryRef, updates);
  },

  // Elimina una voce dello storico
  async delete(exerciseId, entryId) {
    const entryRef = ref(database, `exerciseHistory/${exerciseId}/${entryId}`);
    await remove(entryRef);
  }
};

// === DIARIO ESERCIZI ===
export const diaryService = {
  // Aggiungi una voce al diario
  async addEntry(exerciseId, comment) {
    const diaryRef = ref(database, `exerciseDiary/${exerciseId}`);
    const newEntryRef = push(diaryRef);
    const timestamp = getTimestamp();
    
    const entry = {
      comment,
      timestamp
    };
    
    await set(newEntryRef, entry);
    return { id: newEntryRef.key, ...entry };
  },

  // Ottieni il diario di un esercizio
  async getByExercise(exerciseId) {
    const diaryRef = ref(database, `exerciseDiary/${exerciseId}`);
    const snapshot = await get(diaryRef);
    
    if (snapshot.exists()) {
      const diary = [];
      snapshot.forEach((childSnapshot) => {
        diary.push({
          id: childSnapshot.key,
          exerciseId,
          ...childSnapshot.val()
        });
      });
      // Ordina per timestamp decrescente
      return diary.sort((a, b) => b.timestamp - a.timestamp);
    }
    return [];
  },

  // Aggiorna una voce del diario
  async update(exerciseId, entryId, updates) {
    const entryRef = ref(database, `exerciseDiary/${exerciseId}/${entryId}`);
    await update(entryRef, updates);
  },

  // Elimina una voce del diario
  async delete(exerciseId, entryId) {
    const entryRef = ref(database, `exerciseDiary/${exerciseId}/${entryId}`);
    await remove(entryRef);
  }
};

// === SCHEDE ALLENAMENTO ===
export const workoutSheetService = {
  // Crea una nuova scheda
  async create(sheetData) {
    const sheetsRef = ref(database, 'workoutSheets');
    const newSheetRef = push(sheetsRef);
    const timestamp = getTimestamp();
    
    const sheet = {
      ...sheetData,
      exercises: sheetData.exercises || [],
      pauses: sheetData.pauses || [],
      texts: sheetData.texts || [],
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await set(newSheetRef, sheet);
    return { id: newSheetRef.key, ...sheet };
  },

  // Ottieni tutte le schede
  async getAll() {
    const sheetsRef = ref(database, 'workoutSheets');
    const snapshot = await get(sheetsRef);
    
    if (snapshot.exists()) {
      const sheets = [];
      snapshot.forEach((childSnapshot) => {
        sheets.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return sheets;
    }
    return [];
  },

  // Ottieni una scheda per ID
  async getById(sheetId) {
    const sheetRef = ref(database, `workoutSheets/${sheetId}`);
    const snapshot = await get(sheetRef);
    
    if (snapshot.exists()) {
      return { id: sheetId, ...snapshot.val() };
    }
    return null;
  },

  // Aggiorna una scheda
  async update(sheetId, updates) {
    const sheetRef = ref(database, `workoutSheets/${sheetId}`);
    const updateData = {
      ...updates,
      updatedAt: getTimestamp()
    };
    
    await update(sheetRef, updateData);
    return updateData;
  },

  // Elimina una scheda
  async delete(sheetId) {
    const sheetRef = ref(database, `workoutSheets/${sheetId}`);
    await remove(sheetRef);
  }
};


// Alias per compatibilità
export const workoutService = workoutSheetService;

