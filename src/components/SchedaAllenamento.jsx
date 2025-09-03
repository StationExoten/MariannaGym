import React, { useState, useEffect, useRef } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Fab,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
  Menu,
  ListItemButton,
  Alert,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  LinearProgress,
  Checkbox,
  FormControlLabel,
  Slider,
  Switch
} from '@mui/material';
import {
  FitnessCenter as WorkoutIcon,
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Timer as TimerIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckIcon,
  ExpandMore as ExpandMoreIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  RestartAlt as RestartIcon,
  Schedule as ScheduleIcon,
  TrendingUp as ProgressIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';

import { workoutService, exerciseService, categoryService, historyService } from '../lib/firebaseService';
import { formatTime, formatDateTime, BODY_PARTS } from '../lib/constants';

function SchedaAllenamento() {
  // Stati principali
  const [workouts, setWorkouts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Stati per dialoghi
  const [createDialog, setCreateDialog] = useState({ open: false });
  const [editDialog, setEditDialog] = useState({ open: false, workout: null });
  
  // Stati per cronometro e timer
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [isWorkoutRunning, setIsWorkoutRunning] = useState(false);
  const [isRestRunning, setIsRestRunning] = useState(false);
  const [restDuration, setRestDuration] = useState(60); // secondi
  
  // Stati per menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  
  // Stati per notifiche
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Refs per timer
  const workoutIntervalRef = useRef(null);
  const restIntervalRef = useRef(null);

  // Caricamento dati iniziale
  useEffect(() => {
    loadData();
  }, []);

  // Gestione timer allenamento
  useEffect(() => {
    if (isWorkoutRunning) {
      workoutIntervalRef.current = setInterval(() => {
        setWorkoutTimer(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(workoutIntervalRef.current);
    }
    
    return () => clearInterval(workoutIntervalRef.current);
  }, [isWorkoutRunning]);

  // Gestione timer riposo
  useEffect(() => {
    if (isRestRunning && restTimer > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsRestRunning(false);
            showSnackbar('Tempo di riposo terminato!', 'info');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(restIntervalRef.current);
    }
    
    return () => clearInterval(restIntervalRef.current);
  }, [isRestRunning, restTimer]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workoutsData, exercisesData, categoriesData] = await Promise.all([
        workoutService.getAll(),
        exerciseService.getAll(),
        categoryService.getAll()
      ]);
      setWorkouts(workoutsData);
      setExercises(exercisesData);
      setCategories(categoriesData);
    } catch (error) {
      showSnackbar('Errore nel caricamento dei dati', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // === GESTIONE SCHEDE ===
  const handleCreateWorkout = async (workoutData) => {
    try {
      await workoutService.create(workoutData);
      showSnackbar('Scheda creata con successo');
      setCreateDialog({ open: false });
      loadData();
    } catch (error) {
      showSnackbar('Errore nella creazione della scheda', 'error');
    }
  };

  const handleEditWorkout = async (workoutId, updates) => {
    try {
      await workoutService.update(workoutId, updates);
      showSnackbar('Scheda aggiornata con successo');
      setEditDialog({ open: false, workout: null });
      loadData();
    } catch (error) {
      showSnackbar('Errore nell\'aggiornamento', 'error');
    }
  };

  const handleDeleteWorkout = async (workoutId) => {
    if (window.confirm('Sei sicuro di voler eliminare questa scheda?')) {
      try {
        await workoutService.delete(workoutId);
        showSnackbar('Scheda eliminata con successo');
        if (activeWorkout?.id === workoutId) {
          setActiveWorkout(null);
          handleStopWorkout();
        }
        loadData();
      } catch (error) {
        showSnackbar('Errore nell\'eliminazione', 'error');
      }
    }
  };

  // === GESTIONE ALLENAMENTO ===
  const handleStartWorkout = (workout) => {
    setActiveWorkout({
      ...workout,
      startTime: Date.now(),
      completedSets: {},
      currentExerciseIndex: 0
    });
    setWorkoutTimer(0);
    setIsWorkoutRunning(true);
    showSnackbar(`Allenamento "${workout.name}" iniziato!`);
  };

  const handlePauseWorkout = () => {
    setIsWorkoutRunning(!isWorkoutRunning);
    showSnackbar(isWorkoutRunning ? 'Allenamento in pausa' : 'Allenamento ripreso');
  };

  const handleStopWorkout = () => {
    if (activeWorkout && window.confirm('Sei sicuro di voler terminare l\'allenamento?')) {
      setActiveWorkout(null);
      setWorkoutTimer(0);
      setIsWorkoutRunning(false);
      setIsRestRunning(false);
      setRestTimer(0);
      showSnackbar('Allenamento terminato');
    }
  };

  const handleCompleteSet = (exerciseId, setIndex) => {
    if (!activeWorkout) return;
    
    const key = `${exerciseId}_${setIndex}`;
    const newCompletedSets = { ...activeWorkout.completedSets };
    
    if (newCompletedSets[key]) {
      delete newCompletedSets[key];
    } else {
      newCompletedSets[key] = true;
      // Avvia timer di riposo
      setRestTimer(restDuration);
      setIsRestRunning(true);
    }
    
    setActiveWorkout(prev => ({
      ...prev,
      completedSets: newCompletedSets
    }));
  };

  const handleStartRest = (duration = restDuration) => {
    setRestTimer(duration);
    setIsRestRunning(true);
  };

  const handleSkipRest = () => {
    setRestTimer(0);
    setIsRestRunning(false);
  };

  // === CALCOLO PROGRESSI ===
  const calculateWorkoutProgress = () => {
    if (!activeWorkout || !activeWorkout.exercises) return 0;
    
    const totalSets = activeWorkout.exercises.reduce((total, ex) => total + (ex.sets || 1), 0);
    const completedSets = Object.keys(activeWorkout.completedSets).length;
    
    return totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  };

  // Componente per visualizzare una scheda
  const WorkoutCard = ({ workout }) => {
    const exerciseCount = workout.exercises?.length || 0;
    const totalSets = workout.exercises?.reduce((total, ex) => total + (ex.sets || 1), 0) || 0;
    
    return (
      <Card sx={{ mb: 2, '&:hover': { boxShadow: 4 } }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {workout.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {workout.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<WorkoutIcon />}
                  label={`${exerciseCount} esercizi`} 
                  size="small" 
                  variant="outlined"
                />
                <Chip 
                  icon={<ProgressIcon />}
                  label={`${totalSets} serie totali`} 
                  size="small" 
                  variant="outlined"
                />
                <Chip 
                  icon={<TimeIcon />}
                  label={`~${workout.estimatedDuration || 60} min`} 
                  size="small" 
                  variant="outlined"
                />
              </Box>
            </Box>
            <IconButton
              onClick={(e) => {
                setAnchorEl(e.currentTarget);
                setSelectedWorkout(workout);
              }}
            >
              <MoreIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={() => handleStartWorkout(workout)}
              disabled={!!activeWorkout}
              fullWidth
            >
              Inizia Allenamento
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Componente per l'allenamento attivo
  const ActiveWorkoutPanel = () => {
    if (!activeWorkout) return null;

    const progress = calculateWorkoutProgress();

    return (
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.50', border: '2px solid', borderColor: 'primary.main' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            🏋️ {activeWorkout.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={handlePauseWorkout} color="primary">
              {isWorkoutRunning ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
            <IconButton onClick={handleStopWorkout} color="error">
              <StopIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Timer e progresso */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {formatTime(workoutTimer)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tempo Allenamento
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 600, 
                  color: isRestRunning ? 'warning.main' : 'text.secondary' 
                }}
              >
                {formatTime(restTimer)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Riposo
              </Typography>
              {isRestRunning && (
                <Button size="small" onClick={handleSkipRest} sx={{ mt: 1 }}>
                  Salta
                </Button>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                {Math.round(progress)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Completato
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ mt: 1 }}
              />
            </Paper>
          </Grid>
        </Grid>

        {/* Timer riposo personalizzato */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Timer Riposo: {restDuration}s
          </Typography>
          <Slider
            value={restDuration}
            onChange={(e, value) => setRestDuration(value)}
            min={15}
            max={300}
            step={15}
            marks={[
              { value: 30, label: '30s' },
              { value: 60, label: '1m' },
              { value: 120, label: '2m' },
              { value: 180, label: '3m' }
            ]}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}s`}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<TimerIcon />}
            onClick={() => handleStartRest()}
            sx={{ mt: 1 }}
          >
            Avvia Riposo ({restDuration}s)
          </Button>
        </Box>

        {/* Lista esercizi */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Esercizi
        </Typography>
        {activeWorkout.exercises?.map((workoutExercise, index) => {
          const exercise = exercises.find(ex => ex.id === workoutExercise.exerciseId);
          if (!exercise) return null;

          return (
            <Card key={`${workoutExercise.exerciseId}_${index}`} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {exercise.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {workoutExercise.sets} serie × {workoutExercise.reps} ripetizioni
                  {workoutExercise.weight && ` @ ${workoutExercise.weight}`}
                  {workoutExercise.notes && ` - ${workoutExercise.notes}`}
                </Typography>
                
                {/* Serie */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {Array.from({ length: workoutExercise.sets || 1 }, (_, setIndex) => {
                    const key = `${workoutExercise.exerciseId}_${setIndex}`;
                    const isCompleted = activeWorkout.completedSets[key];
                    
                    return (
                      <Button
                        key={setIndex}
                        variant={isCompleted ? "contained" : "outlined"}
                        color={isCompleted ? "success" : "primary"}
                        startIcon={isCompleted ? <CheckIcon /> : <UncheckIcon />}
                        onClick={() => handleCompleteSet(workoutExercise.exerciseId, setIndex)}
                        size="small"
                      >
                        Serie {setIndex + 1}
                      </Button>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Paper>
    );
  };

  return (
    <Box>
      {/* Header della sezione */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 600,
            color: 'primary.main',
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <WorkoutIcon sx={{ fontSize: '2rem' }} />
          Scheda Allenamento
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 600 }}
        >
          Crea e gestisci le tue schede di allenamento personalizzate. 
          Avvia sessioni con cronometro integrato e traccia i tuoi progressi.
        </Typography>
      </Box>

      {/* Pannello allenamento attivo */}
      <ActiveWorkoutPanel />

      {/* Lista schede */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Le Tue Schede ({workouts.length})
        </Typography>
        
        {workouts.length > 0 ? (
          workouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <WorkoutIcon sx={{ fontSize: '4rem', color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              Nessuna scheda creata
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Crea la tua prima scheda di allenamento per iniziare
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialog({ open: true })}
            >
              Crea Prima Scheda
            </Button>
          </Paper>
        )}
      </Box>

      {/* Menu contestuale */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setEditDialog({ open: true, workout: selectedWorkout });
            setAnchorEl(null);
          }}
        >
          <ListItemIcon><EditIcon /></ListItemIcon>
          Modifica
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedWorkout) {
              handleDeleteWorkout(selectedWorkout.id);
            }
            setAnchorEl(null);
          }}
        >
          <ListItemIcon><DeleteIcon /></ListItemIcon>
          Elimina
        </MenuItem>
      </Menu>

      {/* Dialog Crea Scheda */}
      <CreateWorkoutDialog
        open={createDialog.open}
        exercises={exercises}
        categories={categories}
        onClose={() => setCreateDialog({ open: false })}
        onSubmit={handleCreateWorkout}
      />

      {/* Dialog Modifica Scheda */}
      <EditWorkoutDialog
        open={editDialog.open}
        workout={editDialog.workout}
        exercises={exercises}
        categories={categories}
        onClose={() => setEditDialog({ open: false, workout: null })}
        onSubmit={(updates) => {
          if (editDialog.workout) {
            handleEditWorkout(editDialog.workout.id, updates);
          }
        }}
      />

      {/* Tasto flottante per creare scheda */}
      {!activeWorkout && (
        <Fab
          color="primary"
          aria-label="crea scheda"
          onClick={() => setCreateDialog({ open: true })}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Snackbar per notifiche */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// === COMPONENTI DIALOG ===

function CreateWorkoutDialog({ open, exercises, categories, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    exercises: [],
    estimatedDuration: 60
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        description: '',
        exercises: [],
        estimatedDuration: 60
      });
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.exercises.length > 0) {
      onSubmit(formData);
    }
  };

  const addExercise = (exerciseId) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (exercise) {
      setFormData(prev => ({
        ...prev,
        exercises: [...prev.exercises, {
          exerciseId,
          sets: 3,
          reps: '10',
          weight: '',
          notes: ''
        }]
      }));
    }
  };

  const updateExercise = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === index ? { ...ex, [field]: value } : ex
      )
    }));
  };

  const removeExercise = (index) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Crea Nuova Scheda</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Nome Scheda"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Durata Stimata (min)"
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) })}
                fullWidth
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descrizione"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
            </Grid>

            {/* Selezione esercizi */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Aggiungi Esercizi
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Seleziona Esercizio</InputLabel>
                <Select
                  value=""
                  onChange={(e) => addExercise(e.target.value)}
                  label="Seleziona Esercizio"
                >
                  {categories.map((category) => [
                    <MenuItem key={`cat-${category.id}`} disabled sx={{ fontWeight: 600 }}>
                      {category.name}
                    </MenuItem>,
                    ...exercises
                      .filter(ex => ex.categoryId === category.id)
                      .map((exercise) => (
                        <MenuItem key={exercise.id} value={exercise.id} sx={{ pl: 4 }}>
                          {exercise.name}
                        </MenuItem>
                      ))
                  ]).flat()}
                </Select>
              </FormControl>
            </Grid>

            {/* Lista esercizi aggiunti */}
            {formData.exercises.map((workoutExercise, index) => {
              const exercise = exercises.find(ex => ex.id === workoutExercise.exerciseId);
              return (
                <Grid item xs={12} key={index}>
                  <Paper sx={{ p: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {exercise?.name}
                      </Typography>
                      <IconButton onClick={() => removeExercise(index)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          label="Serie"
                          type="number"
                          value={workoutExercise.sets}
                          onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          label="Ripetizioni"
                          value={workoutExercise.reps}
                          onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          label="Peso (opzionale)"
                          value={workoutExercise.weight}
                          onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          label="Note"
                          value={workoutExercise.notes}
                          onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annulla</Button>
          <Button type="submit" variant="contained" disabled={!formData.name || formData.exercises.length === 0}>
            Crea Scheda
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function EditWorkoutDialog({ open, workout, exercises, categories, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    exercises: [],
    estimatedDuration: 60
  });

  useEffect(() => {
    if (open && workout) {
      setFormData({
        name: workout.name || '',
        description: workout.description || '',
        exercises: workout.exercises || [],
        estimatedDuration: workout.estimatedDuration || 60
      });
    }
  }, [open, workout]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Stessa logica del CreateWorkoutDialog per gestire esercizi
  const addExercise = (exerciseId) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (exercise) {
      setFormData(prev => ({
        ...prev,
        exercises: [...prev.exercises, {
          exerciseId,
          sets: 3,
          reps: '10',
          weight: '',
          notes: ''
        }]
      }));
    }
  };

  const updateExercise = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === index ? { ...ex, [field]: value } : ex
      )
    }));
  };

  const removeExercise = (index) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Modifica Scheda - {workout?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Nome Scheda"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Durata Stimata (min)"
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) })}
                fullWidth
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descrizione"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
            </Grid>

            {/* Selezione esercizi */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Esercizi nella Scheda
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Aggiungi Esercizio</InputLabel>
                <Select
                  value=""
                  onChange={(e) => addExercise(e.target.value)}
                  label="Aggiungi Esercizio"
                >
                  {categories.map((category) => [
                    <MenuItem key={`cat-${category.id}`} disabled sx={{ fontWeight: 600 }}>
                      {category.name}
                    </MenuItem>,
                    ...exercises
                      .filter(ex => ex.categoryId === category.id)
                      .map((exercise) => (
                        <MenuItem key={exercise.id} value={exercise.id} sx={{ pl: 4 }}>
                          {exercise.name}
                        </MenuItem>
                      ))
                  ]).flat()}
                </Select>
              </FormControl>
            </Grid>

            {/* Lista esercizi */}
            {formData.exercises.map((workoutExercise, index) => {
              const exercise = exercises.find(ex => ex.id === workoutExercise.exerciseId);
              return (
                <Grid item xs={12} key={index}>
                  <Paper sx={{ p: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {exercise?.name}
                      </Typography>
                      <IconButton onClick={() => removeExercise(index)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          label="Serie"
                          type="number"
                          value={workoutExercise.sets}
                          onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          label="Ripetizioni"
                          value={workoutExercise.reps}
                          onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          label="Peso (opzionale)"
                          value={workoutExercise.weight}
                          onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          label="Note"
                          value={workoutExercise.notes}
                          onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annulla</Button>
          <Button type="submit" variant="contained" disabled={!formData.name}>
            Salva Modifiche
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default SchedaAllenamento;

