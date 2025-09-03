import React, { useState, useEffect } from 'react';
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
  Grid
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Add as AddIcon,
  FitnessCenter as ExerciseIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { it } from 'date-fns/locale';

import { categoryService, exerciseService, historyService, diaryService } from '../lib/firebaseService';
import { formatDateTime, getParameterDirection, BODY_PARTS } from '../lib/constants';

function StoricoProgressi() {
  // Stati principali
  const [history, setHistory] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Stati per filtri e ricerca
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExercise, setFilterExercise] = useState('');
  const [filterDate, setFilterDate] = useState(null);
  const [groupByDate, setGroupByDate] = useState(true);
  
  // Stati per dialoghi
  const [addDocDialog, setAddDocDialog] = useState({ open: false });
  const [editDialog, setEditDialog] = useState({ open: false, entry: null });
  
  // Stati per menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  
  // Stati per notifiche
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Caricamento dati iniziale
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [historyData, exercisesData, categoriesData] = await Promise.all([
        historyService.getAll(),
        exerciseService.getAll(),
        categoryService.getAll()
      ]);
      setHistory(historyData);
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

  // === GESTIONE DOCUMENTAZIONE ===
  const handleAddDocumentation = async (formData) => {
    try {
      const exercise = exercises.find(ex => ex.id === formData.exerciseId);
      if (!exercise) return;

      // Ottieni i valori precedenti per il confronto
      const exerciseHistory = await historyService.getByExercise(formData.exerciseId);
      const previousEntry = exerciseHistory[0]; // Il più recente
      const previousParameters = previousEntry ? previousEntry.parameters : {};

      // Aggiungi alla cronologia
      await historyService.addEntry(
        formData.exerciseId,
        formData.parameters,
        previousParameters,
        formData.comment
      );

      // Se c'è un commento, aggiungilo anche al diario
      if (formData.comment) {
        await diaryService.addEntry(formData.exerciseId, formData.comment);
      }

      showSnackbar('Documentazione aggiunta con successo');
      setAddDocDialog({ open: false });
      loadData();
    } catch (error) {
      showSnackbar('Errore nell\'aggiunta della documentazione', 'error');
    }
  };

  // === GESTIONE MODIFICA/ELIMINAZIONE ===
  const handleEditEntry = async (entryId, exerciseId, updates) => {
    try {
      await historyService.update(exerciseId, entryId, updates);
      showSnackbar('Voce aggiornata con successo');
      setEditDialog({ open: false, entry: null });
      loadData();
    } catch (error) {
      showSnackbar('Errore nell\'aggiornamento', 'error');
    }
  };

  const handleDeleteEntry = async (entryId, exerciseId) => {
    if (window.confirm('Sei sicuro di voler eliminare questa voce dallo storico?')) {
      try {
        await historyService.delete(exerciseId, entryId);
        showSnackbar('Voce eliminata con successo');
        loadData();
      } catch (error) {
        showSnackbar('Errore nell\'eliminazione', 'error');
      }
    }
  };

  // === FILTRI E RICERCA ===
  const filteredHistory = history.filter(entry => {
    const exercise = exercises.find(ex => ex.id === entry.exerciseId);
    const category = categories.find(cat => cat.id === exercise?.categoryId);
    
    // Filtro per termine di ricerca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesExercise = exercise?.name.toLowerCase().includes(searchLower);
      const matchesCategory = category?.name.toLowerCase().includes(searchLower);
      const matchesComment = entry.comment?.toLowerCase().includes(searchLower);
      
      if (!matchesExercise && !matchesCategory && !matchesComment) {
        return false;
      }
    }
    
    // Filtro per esercizio specifico
    if (filterExercise && entry.exerciseId !== filterExercise) {
      return false;
    }
    
    // Filtro per data
    if (filterDate) {
      const entryDate = new Date(entry.timestamp);
      const filterDateObj = new Date(filterDate);
      if (entryDate.toDateString() !== filterDateObj.toDateString()) {
        return false;
      }
    }
    
    return true;
  });

  // Raggruppa per data se richiesto
  const groupedHistory = groupByDate ? groupHistoryByDate(filteredHistory) : { 'Tutti': filteredHistory };

  // Utility per raggruppare per data
  function groupHistoryByDate(historyArray) {
    const groups = {};
    historyArray.forEach(entry => {
      const date = new Date(entry.timestamp).toLocaleDateString('it-IT');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
    });
    return groups;
  }

  // Componente per visualizzare una voce dello storico
  const HistoryEntry = ({ entry }) => {
    const exercise = exercises.find(ex => ex.id === entry.exerciseId);
    const category = categories.find(cat => cat.id === exercise?.categoryId);

    if (!exercise) return null;

    return (
      <ListItem
        sx={{
          py: 2,
          px: 3,
          '&:hover': {
            backgroundColor: 'grey.50',
          },
        }}
      >
        <ListItemIcon>
          <ExerciseIcon sx={{ color: 'primary.main' }} />
        </ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {exercise.name}
              </Typography>
              <Chip 
                label={category?.name || 'Senza categoria'} 
                size="small" 
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
              <Chip 
                label={exercise.bodyPart} 
                size="small" 
                color="secondary"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            </Box>
          }
          secondary={
            <Box>
              {/* Parametri con frecce di confronto */}
              <Box sx={{ mb: 1 }}>
                {Object.entries(entry.parameters).map(([param, value]) => {
                  const direction = getParameterDirection(
                    value,
                    entry.previousParameters?.[param]
                  );
                  return (
                    <Box key={param} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {param}:
                      </Typography>
                      {entry.previousParameters?.[param] && (
                        <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.disabled' }}>
                          {entry.previousParameters[param]}
                        </Typography>
                      )}
                      {direction === 'up' && <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1rem' }} />}
                      {direction === 'down' && <TrendingDownIcon sx={{ color: 'error.main', fontSize: '1rem' }} />}
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600, 
                          color: direction === 'up' ? 'success.main' : direction === 'down' ? 'error.main' : 'text.primary'
                        }}
                      >
                        {value}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
              
              {/* Commento se presente */}
              {entry.comment && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <CommentIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {entry.comment}
                  </Typography>
                </Box>
              )}
              
              {/* Data e ora */}
              <Typography variant="caption" color="text.secondary">
                {formatDateTime(entry.timestamp)}
              </Typography>
            </Box>
          }
        />
        <IconButton
          onClick={(e) => {
            setAnchorEl(e.currentTarget);
            setSelectedEntry(entry);
          }}
        >
          <MoreIcon />
        </IconButton>
      </ListItem>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
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
            <TimelineIcon sx={{ fontSize: '2rem' }} />
            Storico e Progressi
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 600 }}
          >
            Visualizza la timeline cronologica delle modifiche ai parametri degli esercizi 
            e monitora i tuoi progressi nel tempo.
          </Typography>
        </Box>

        {/* Filtri e ricerca */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                placeholder="Cerca esercizi, categorie o commenti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Filtra per esercizio</InputLabel>
                <Select
                  value={filterExercise}
                  onChange={(e) => setFilterExercise(e.target.value)}
                  label="Filtra per esercizio"
                >
                  <MenuItem value="">Tutti gli esercizi</MenuItem>
                  {exercises.map((exercise) => (
                    <MenuItem key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Filtra per data"
                value={filterDate}
                onChange={(newValue) => setFilterDate(newValue)}
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    fullWidth: true
                  } 
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setFilterExercise('');
                  setFilterDate(null);
                }}
                fullWidth
              >
                Pulisci Filtri
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Timeline dei progressi */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, pb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Timeline Progressi ({filteredHistory.length} voci)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Modifiche ai parametri degli esercizi in ordine cronologico
              </Typography>
            </Box>
            
            {Object.keys(groupedHistory).length > 0 ? (
              Object.entries(groupedHistory).map(([date, entries]) => (
                <Accordion key={date} defaultExpanded={Object.keys(groupedHistory).length <= 3}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CalendarIcon sx={{ color: 'primary.main' }} />
                      <Typography variant="h6">{date}</Typography>
                      <Chip label={`${entries.length} modifiche`} size="small" />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <List>
                      {entries.map((entry, index) => (
                        <React.Fragment key={entry.id}>
                          <HistoryEntry entry={entry} />
                          {index < entries.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  Nessuna voce trovata nello storico
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Menu contestuale */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem
            onClick={() => {
              setEditDialog({ open: true, entry: selectedEntry });
              setAnchorEl(null);
            }}
          >
            <ListItemIcon><EditIcon /></ListItemIcon>
            Modifica
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (selectedEntry) {
                handleDeleteEntry(selectedEntry.id, selectedEntry.exerciseId);
              }
              setAnchorEl(null);
            }}
          >
            <ListItemIcon><DeleteIcon /></ListItemIcon>
            Elimina
          </MenuItem>
        </Menu>

        {/* Dialog Aggiungi Documentazione */}
        <AddDocumentationDialog
          open={addDocDialog.open}
          exercises={exercises}
          categories={categories}
          onClose={() => setAddDocDialog({ open: false })}
          onSubmit={handleAddDocumentation}
        />

        {/* Dialog Modifica Voce */}
        <EditEntryDialog
          open={editDialog.open}
          entry={editDialog.entry}
          exercises={exercises}
          onClose={() => setEditDialog({ open: false, entry: null })}
          onSubmit={(updates) => {
            if (editDialog.entry) {
              handleEditEntry(editDialog.entry.id, editDialog.entry.exerciseId, updates);
            }
          }}
        />

        {/* Tasto flottante per aggiungere documentazione */}
        <Fab
          color="primary"
          aria-label="aggiungi documentazione"
          onClick={() => setAddDocDialog({ open: true })}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
        >
          <AddIcon />
        </Fab>

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
    </LocalizationProvider>
  );
}

// === COMPONENTI DIALOG ===

function AddDocumentationDialog({ open, exercises, categories, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    exerciseId: '',
    parameters: {},
    comment: ''
  });
  const [selectedExercise, setSelectedExercise] = useState(null);

  useEffect(() => {
    if (open) {
      setFormData({ exerciseId: '', parameters: {}, comment: '' });
      setSelectedExercise(null);
    }
  }, [open]);

  useEffect(() => {
    if (formData.exerciseId) {
      const exercise = exercises.find(ex => ex.id === formData.exerciseId);
      setSelectedExercise(exercise);
      if (exercise) {
        const initialParams = {};
        Object.keys(exercise.parameters || {}).forEach(param => {
          initialParams[param] = '';
        });
        setFormData(prev => ({ ...prev, parameters: initialParams }));
      }
    }
  }, [formData.exerciseId, exercises]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.exerciseId && Object.keys(formData.parameters).length > 0) {
      onSubmit(formData);
    }
  };

  const updateParameter = (param, value) => {
    setFormData(prev => ({
      ...prev,
      parameters: { ...prev.parameters, [param]: value }
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Aggiungi Documentazione</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth required sx={{ mb: 2 }}>
                <InputLabel>Esercizio</InputLabel>
                <Select
                  value={formData.exerciseId}
                  onChange={(e) => setFormData({ ...formData, exerciseId: e.target.value })}
                  label="Esercizio"
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

            {selectedExercise && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Parametri per {selectedExercise.name}
                  </Typography>
                </Grid>
                {Object.keys(selectedExercise.parameters || {}).map((param) => (
                  <Grid item xs={12} sm={6} key={param}>
                    <TextField
                      label={param}
                      value={formData.parameters[param] || ''}
                      onChange={(e) => updateParameter(param, e.target.value)}
                      fullWidth
                      required
                      placeholder="es. 70kg, 10 ripetizioni, 2x5kg..."
                    />
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <TextField
                    label="Commento (opzionale)"
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Aggiungi note o commenti su questo allenamento..."
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annulla</Button>
          <Button type="submit" variant="contained" disabled={!formData.exerciseId}>
            Aggiungi
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function EditEntryDialog({ open, entry, exercises, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    parameters: {},
    comment: ''
  });

  useEffect(() => {
    if (open && entry) {
      setFormData({
        parameters: { ...entry.parameters },
        comment: entry.comment || ''
      });
    }
  }, [open, entry]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const exercise = entry ? exercises.find(ex => ex.id === entry.exerciseId) : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          Modifica Voce - {exercise?.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {Object.entries(formData.parameters).map(([param, value]) => (
              <Grid item xs={12} sm={6} key={param}>
                <TextField
                  label={param}
                  value={value}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    parameters: { ...prev.parameters, [param]: e.target.value }
                  }))}
                  fullWidth
                  required
                />
              </Grid>
            ))}
            <Grid item xs={12}>
              <TextField
                label="Commento"
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annulla</Button>
          <Button type="submit" variant="contained">
            Salva
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default StoricoProgressi;

