import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Fab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert,
  Snackbar,
  Menu,
  ListItemIcon,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  FitnessCenter as ExerciseIcon,
  Category as CategoryIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  History as HistoryIcon,
  BookmarkBorder as DiaryIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { categoryService, exerciseService, historyService, diaryService } from '../lib/firebaseService';
import { BODY_PARTS, formatDateTime, getParameterDirection } from '../lib/constants';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

function DatabaseEsercizi() {
  // Stati principali
  const [categories, setCategories] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  
  // Stati per dialoghi
  const [categoryDialog, setCategoryDialog] = useState({ open: false, mode: 'create', data: null });
  const [exerciseDialog, setExerciseDialog] = useState({ open: false, mode: 'create', data: null });
  const [exerciseDetailDialog, setExerciseDetailDialog] = useState({ open: false, exercise: null });
  const [diaryDialog, setDiaryDialog] = useState({ open: false, exerciseId: null });
  
  // Stati per menu e ricerca
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  
  // Stati per notifiche
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Stati per dettaglio esercizio
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [exerciseDiary, setExerciseDiary] = useState([]);
  const [detailTab, setDetailTab] = useState(0);

  // Caricamento dati iniziale
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, exercisesData] = await Promise.all([
        categoryService.getAll(),
        exerciseService.getAll()
      ]);
      setCategories(categoriesData);
      setExercises(exercisesData);
    } catch (error) {
      showSnackbar('Errore nel caricamento dei dati', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // === GESTIONE CATEGORIE ===
  const handleCategorySubmit = async (formData) => {
    try {
      if (categoryDialog.mode === 'create') {
        await categoryService.create(formData);
        showSnackbar('Categoria creata con successo');
      } else {
        await categoryService.update(categoryDialog.data.id, formData);
        showSnackbar('Categoria aggiornata con successo');
      }
      loadData();
      setCategoryDialog({ open: false, mode: 'create', data: null });
    } catch (error) {
      showSnackbar('Errore nell\'operazione', 'error');
    }
  };

  const handleCategoryDelete = async (categoryId) => {
    if (window.confirm('Sei sicuro di voler eliminare questa categoria? Tutti gli esercizi associati verranno eliminati.')) {
      try {
        // Elimina prima tutti gli esercizi della categoria
        const categoryExercises = exercises.filter(ex => ex.categoryId === categoryId);
        await Promise.all(categoryExercises.map(ex => exerciseService.delete(ex.id)));
        
        await categoryService.delete(categoryId);
        showSnackbar('Categoria eliminata con successo');
        loadData();
      } catch (error) {
        showSnackbar('Errore nell\'eliminazione', 'error');
      }
    }
  };

  // === GESTIONE ESERCIZI ===
  const handleExerciseSubmit = async (formData) => {
    try {
      if (exerciseDialog.mode === 'create') {
        await exerciseService.create(formData);
        showSnackbar('Esercizio creato con successo');
      } else {
        await exerciseService.update(exerciseDialog.data.id, formData);
        showSnackbar('Esercizio aggiornato con successo');
      }
      loadData();
      setExerciseDialog({ open: false, mode: 'create', data: null });
    } catch (error) {
      showSnackbar('Errore nell\'operazione', 'error');
    }
  };

  const handleExerciseDelete = async (exerciseId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo esercizio? Tutto lo storico e il diario verranno eliminati.')) {
      try {
        await exerciseService.delete(exerciseId);
        showSnackbar('Esercizio eliminato con successo');
        loadData();
      } catch (error) {
        showSnackbar('Errore nell\'eliminazione', 'error');
      }
    }
  };

  // === DETTAGLIO ESERCIZIO ===
  const handleExerciseDetail = async (exercise) => {
    try {
      const [history, diary] = await Promise.all([
        historyService.getByExercise(exercise.id),
        diaryService.getByExercise(exercise.id)
      ]);
      setExerciseHistory(history);
      setExerciseDiary(diary);
      setExerciseDetailDialog({ open: true, exercise });
      setDetailTab(0);
    } catch (error) {
      showSnackbar('Errore nel caricamento dettagli', 'error');
    }
  };

  // === DIARIO ===
  const handleDiarySubmit = async (comment) => {
    try {
      await diaryService.addEntry(diaryDialog.exerciseId, comment);
      showSnackbar('Nota aggiunta al diario');
      setDiaryDialog({ open: false, exerciseId: null });
      
      // Ricarica il diario se il modal dettaglio è aperto
      if (exerciseDetailDialog.open && exerciseDetailDialog.exercise.id === diaryDialog.exerciseId) {
        const diary = await diaryService.getByExercise(diaryDialog.exerciseId);
        setExerciseDiary(diary);
      }
    } catch (error) {
      showSnackbar('Errore nell\'aggiunta della nota', 'error');
    }
  };

  // Filtri e ordinamento
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredExercises = exercises.filter(ex => {
    const category = categories.find(cat => cat.id === ex.categoryId);
    return ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           ex.bodyPart.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (category && category.name.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // Preparazione dati per grafico
  const prepareChartData = (history, parameterName) => {
    return history
      .filter(entry => entry.parameters[parameterName] !== undefined)
      .map(entry => ({
        date: new Date(entry.timestamp).toLocaleDateString('it-IT'),
        value: parseFloat(entry.parameters[parameterName]) || 0,
        timestamp: entry.timestamp
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
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
          <ExerciseIcon sx={{ fontSize: '2rem' }} />
          Database Esercizi
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 600 }}
        >
          Gestisci le categorie e gli esercizi del tuo database. Crea, modifica ed elimina 
          categorie ed esercizi, visualizza lo storico dei progressi e aggiungi note al diario.
        </Typography>
      </Box>

      {/* Barra di ricerca e controlli */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Cerca categorie o esercizi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Ordina per</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Ordina per"
            >
              <MenuItem value="name">Nome</MenuItem>
              <MenuItem value="createdAt">Data creazione</MenuItem>
              <MenuItem value="updatedAt">Ultima modifica</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Tabs per categorie ed esercizi */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<CategoryIcon />}
            label="Categorie"
            iconPosition="start"
          />
          <Tab
            icon={<ExerciseIcon />}
            label="Esercizi"
            iconPosition="start"
          />
        </Tabs>

        {/* Tab Categorie */}
        <TabPanel value={currentTab} index={0}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Categorie ({filteredCategories.length})</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCategoryDialog({ open: true, mode: 'create', data: null })}
              >
                Nuova Categoria
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              {filteredCategories.map((category) => (
                <Grid item xs={12} sm={6} md={4} key={category.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {category.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setAnchorEl(e.currentTarget);
                            setSelectedItem({ type: 'category', data: category });
                          }}
                        >
                          <MoreIcon />
                        </IconButton>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {category.description}
                      </Typography>
                      <Chip
                        label={`${exercises.filter(ex => ex.categoryId === category.id).length} esercizi`}
                        size="small"
                        variant="outlined"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>

        {/* Tab Esercizi */}
        <TabPanel value={currentTab} index={1}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Esercizi ({filteredExercises.length})</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setExerciseDialog({ open: true, mode: 'create', data: null })}
              >
                Nuovo Esercizio
              </Button>
            </Box>
            
            <List>
              {filteredExercises.map((exercise) => {
                const category = categories.find(cat => cat.id === exercise.categoryId);
                return (
                  <Card key={exercise.id} sx={{ mb: 1 }}>
                    <ListItem
                      button
                      onClick={() => handleExerciseDetail(exercise)}
                      sx={{ py: 2 }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {exercise.name}
                            </Typography>
                            <Chip label={exercise.bodyPart} size="small" variant="outlined" />
                            {category && (
                              <Chip label={category.name} size="small" color="primary" variant="outlined" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            Parametri: {Object.keys(exercise.parameters || {}).join(', ') || 'Nessun parametro'}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setAnchorEl(e.currentTarget);
                            setSelectedItem({ type: 'exercise', data: exercise });
                          }}
                        >
                          <MoreIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </Card>
                );
              })}
            </List>
          </Box>
        </TabPanel>
      </Paper>

      {/* Menu contestuale */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            if (selectedItem?.type === 'category') {
              setCategoryDialog({ open: true, mode: 'edit', data: selectedItem.data });
            } else if (selectedItem?.type === 'exercise') {
              setExerciseDialog({ open: true, mode: 'edit', data: selectedItem.data });
            }
            setAnchorEl(null);
          }}
        >
          <ListItemIcon><EditIcon /></ListItemIcon>
          Modifica
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedItem?.type === 'category') {
              handleCategoryDelete(selectedItem.data.id);
            } else if (selectedItem?.type === 'exercise') {
              handleExerciseDelete(selectedItem.data.id);
            }
            setAnchorEl(null);
          }}
        >
          <ListItemIcon><DeleteIcon /></ListItemIcon>
          Elimina
        </MenuItem>
        {selectedItem?.type === 'exercise' && (
          <MenuItem
            onClick={() => {
              setDiaryDialog({ open: true, exerciseId: selectedItem.data.id });
              setAnchorEl(null);
            }}
          >
            <ListItemIcon><DiaryIcon /></ListItemIcon>
            Aggiungi al Diario
          </MenuItem>
        )}
      </Menu>

      {/* Dialog Categoria */}
      <CategoryDialog
        open={categoryDialog.open}
        mode={categoryDialog.mode}
        data={categoryDialog.data}
        onClose={() => setCategoryDialog({ open: false, mode: 'create', data: null })}
        onSubmit={handleCategorySubmit}
      />

      {/* Dialog Esercizio */}
      <ExerciseDialog
        open={exerciseDialog.open}
        mode={exerciseDialog.mode}
        data={exerciseDialog.data}
        categories={categories}
        onClose={() => setExerciseDialog({ open: false, mode: 'create', data: null })}
        onSubmit={handleExerciseSubmit}
      />

      {/* Dialog Dettaglio Esercizio */}
      <ExerciseDetailDialog
        open={exerciseDetailDialog.open}
        exercise={exerciseDetailDialog.exercise}
        history={exerciseHistory}
        diary={exerciseDiary}
        categories={categories}
        onClose={() => setExerciseDetailDialog({ open: false, exercise: null })}
      />

      {/* Dialog Diario */}
      <DiaryDialog
        open={diaryDialog.open}
        onClose={() => setDiaryDialog({ open: false, exerciseId: null })}
        onSubmit={handleDiarySubmit}
      />

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

function CategoryDialog({ open, mode, data, onClose, onSubmit }) {
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    if (open) {
      setFormData(data ? { name: data.name, description: data.description } : { name: '', description: '' });
    }
  }, [open, data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === 'create' ? 'Nuova Categoria' : 'Modifica Categoria'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome Categoria"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Descrizione Categoria"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annulla</Button>
          <Button type="submit" variant="contained">
            {mode === 'create' ? 'Crea' : 'Salva'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function ExerciseDialog({ open, mode, data, categories, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    bodyPart: '',
    parameters: {}
  });
  const [newParameter, setNewParameter] = useState('');

  useEffect(() => {
    if (open) {
      setFormData(data ? {
        name: data.name,
        categoryId: data.categoryId,
        bodyPart: data.bodyPart,
        parameters: data.parameters || {}
      } : {
        name: '',
        categoryId: '',
        bodyPart: '',
        parameters: {}
      });
    }
  }, [open, data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name.trim() && formData.categoryId && formData.bodyPart) {
      onSubmit(formData);
    }
  };

  const addParameter = () => {
    if (newParameter.trim()) {
      setFormData({
        ...formData,
        parameters: { ...formData.parameters, [newParameter]: '' }
      });
      setNewParameter('');
    }
  };

  const removeParameter = (paramName) => {
    const newParams = { ...formData.parameters };
    delete newParams[paramName];
    setFormData({ ...formData, parameters: newParams });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === 'create' ? 'Nuovo Esercizio' : 'Modifica Esercizio'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                label="Nome Esercizio"
                fullWidth
                variant="outlined"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  label="Categoria"
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Zona di Allenamento</InputLabel>
                <Select
                  value={formData.bodyPart}
                  onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })}
                  label="Zona di Allenamento"
                >
                  {BODY_PARTS.map((part) => (
                    <MenuItem key={part} value={part}>
                      {part}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>Parametri Esercizio</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  label="Nuovo parametro"
                  value={newParameter}
                  onChange={(e) => setNewParameter(e.target.value)}
                  size="small"
                  placeholder="es. Peso, Ripetizioni, Durata..."
                />
                <Button variant="outlined" onClick={addParameter}>
                  Aggiungi
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Object.keys(formData.parameters).map((param) => (
                  <Chip
                    key={param}
                    label={param}
                    onDelete={() => removeParameter(param)}
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annulla</Button>
          <Button type="submit" variant="contained">
            {mode === 'create' ? 'Crea' : 'Salva'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function ExerciseDetailDialog({ open, exercise, history, diary, categories, onClose }) {
  const [detailTab, setDetailTab] = useState(0);

  if (!exercise) return null;

  const category = categories.find(cat => cat.id === exercise.categoryId);
  const parameters = Object.keys(exercise.parameters || {});

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ExerciseIcon />
          <Box>
            <Typography variant="h6">{exercise.name}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Chip label={exercise.bodyPart} size="small" />
              {category && <Chip label={category.name} size="small" color="primary" />}
            </Box>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Tabs
          value={detailTab}
          onChange={(e, newValue) => setDetailTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab icon={<HistoryIcon />} label="Storico" iconPosition="start" />
          <Tab icon={<TrendingUpIcon />} label="Grafici" iconPosition="start" />
          <Tab icon={<DiaryIcon />} label="Diario" iconPosition="start" />
        </Tabs>

        <TabPanel value={detailTab} index={0}>
          <Typography variant="h6" sx={{ mb: 2 }}>Storico Progressi</Typography>
          {history.length > 0 ? (
            <List>
              {history.map((entry) => (
                <ListItem key={entry.id} divider>
                  <ListItemText
                    primary={formatDateTime(entry.timestamp)}
                    secondary={
                      <Box>
                        {Object.entries(entry.parameters).map(([param, value]) => {
                          const direction = getParameterDirection(
                            value,
                            entry.previousParameters?.[param]
                          );
                          return (
                            <Box key={param} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">
                                {param}: {value}
                              </Typography>
                              {direction === 'up' && <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1rem' }} />}
                              {direction === 'down' && <TrendingUpIcon sx={{ color: 'error.main', fontSize: '1rem', transform: 'rotate(180deg)' }} />}
                            </Box>
                          );
                        })}
                        {entry.comment && (
                          <Typography variant="caption" color="text.secondary">
                            {entry.comment}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary">Nessun dato nello storico</Typography>
          )}
        </TabPanel>

        <TabPanel value={detailTab} index={1}>
          <Typography variant="h6" sx={{ mb: 2 }}>Grafici Progressi</Typography>
          {parameters.length > 0 && history.length > 0 ? (
            parameters.map((param) => {
              const chartData = history
                .filter(entry => entry.parameters[param] !== undefined)
                .map(entry => ({
                  date: new Date(entry.timestamp).toLocaleDateString('it-IT'),
                  value: parseFloat(entry.parameters[param]) || 0,
                  timestamp: entry.timestamp
                }))
                .sort((a, b) => a.timestamp - b.timestamp);

              if (chartData.length === 0) return null;

              return (
                <Box key={param} sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>{param}</Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#6750a4" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              );
            })
          ) : (
            <Typography color="text.secondary">Nessun dato per i grafici</Typography>
          )}
        </TabPanel>

        <TabPanel value={detailTab} index={2}>
          <Typography variant="h6" sx={{ mb: 2 }}>Diario</Typography>
          {diary.length > 0 ? (
            <List>
              {diary.map((entry) => (
                <ListItem key={entry.id} divider>
                  <ListItemText
                    primary={entry.comment}
                    secondary={formatDateTime(entry.timestamp)}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary">Nessuna nota nel diario</Typography>
          )}
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Chiudi</Button>
      </DialogActions>
    </Dialog>
  );
}

function DiaryDialog({ open, onClose, onSubmit }) {
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      onSubmit(comment);
      setComment('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Aggiungi Nota al Diario</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nota"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annulla</Button>
          <Button type="submit" variant="contained">
            Aggiungi
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default DatabaseEsercizi;

