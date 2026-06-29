import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  MenuItem,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { patientService } from '../services/patientService';
import { readableId } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TableSkeletonLoader from '../components/TableSkeletonLoader';

const PatientsList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [gender, setGender] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrator';

  useEffect(() => {
    const key = `shms_filters_patients_${user?.role || 'all'}`;
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    if (typeof saved.search === 'string') {
      setSearch(saved.search);
    }
    if (typeof saved.gender === 'string') setGender(saved.gender);
    if (typeof saved.bloodType === 'string') setBloodType(saved.bloodType);
    if (typeof saved.sortBy === 'string') setSortBy(saved.sortBy);
    if (typeof saved.sortOrder === 'string') setSortOrder(saved.sortOrder);
    if (Number.isInteger(saved.limit)) setLimit(saved.limit);
  }, [user?.role]);

  useEffect(() => {
    const key = `shms_filters_patients_${user?.role || 'all'}`;
    localStorage.setItem(key, JSON.stringify({ search, gender, bloodType, sortBy, sortOrder, limit }));
  }, [search, gender, bloodType, sortBy, sortOrder, limit, user?.role]);

  useEffect(() => {
    fetchPatients();
  }, [search, page, limit, gender, bloodType, sortBy, sortOrder]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await patientService.getAllPatients({
        search,
        page,
        limit,
        gender,
        bloodType,
        sortBy,
        sortOrder,
      });
      setPatients(data.data.patients || []);
      setPagination(data.data.pagination || { page: 1, totalPages: 1, totalItems: 0 });
    } catch (err) {
      setError('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (patient) => {
    setPatientToDelete(patient);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setError('');
      await patientService.deletePatient(patientToDelete.id);
      setSuccess('Patient deleted successfully');
      fetchPatients();
      setDeleteDialogOpen(false);
    } catch (err) {
      setError('Failed to delete patient');
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" fontWeight="bold" mb={3}>Patients</Typography>
        <Paper sx={{ p: 2, mb: 3 }}>
          <CircularProgress size={22} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Loading patients...</Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <TableSkeletonLoader rows={7} />
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Patients
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/patients/add')}
        >
          Add Patient
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Snackbar
          open={!!success}
          autoHideDuration={4000}
          onClose={() => setSuccess('')}
        >
          <Alert severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search patients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            },
          }}
        />
        <Box sx={{ mt: 2, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
          <TextField select label="Gender" value={gender} onChange={(e) => { setGender(e.target.value); setPage(1); }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </TextField>
          <TextField select label="Blood Type" value={bloodType} onChange={(e) => { setBloodType(e.target.value); setPage(1); }}>
            <MenuItem value="">All</MenuItem>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
              <MenuItem value={group} key={group}>{group}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Rows" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
            {[10, 20, 50, 100, 200].map((size) => (
              <MenuItem value={size} key={size}>{size}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Sort By" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <MenuItem value="createdAt">Created</MenuItem>
            <MenuItem value="firstName">First Name</MenuItem>
            <MenuItem value="lastName">Last Name</MenuItem>
            <MenuItem value="dateOfBirth">Date of Birth</MenuItem>
          </TextField>
          <TextField select label="Sort Order" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <MenuItem value="DESC">Descending</MenuItem>
            <MenuItem value="ASC">Ascending</MenuItem>
          </TextField>
        </Box>
        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="text" onClick={() => { setSearch(''); setGender(''); setBloodType(''); setSortBy('createdAt'); setSortOrder('DESC'); setPage(1); }}>Reset Filters</Button>
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
            Total patients: {pagination.totalItems || 0}
          </Typography>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No patients found
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.id} hover>
                  <TableCell>{readableId('patient', patient.id, patient)}</TableCell>
                  <TableCell>
                    {patient.firstName} {patient.lastName}
                  </TableCell>
                  <TableCell>{patient.email}</TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell>{patient.gender}</TableCell>
                  <TableCell>
                    <Chip
                      label="Active"
                      color="success"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      color="secondary"
                      onClick={() => navigate(`/patients/${patient.id}/edit`)}
                    >
                      <Edit />
                    </IconButton>
                    {isAdmin && (
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(patient)}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination
          count={pagination.totalPages || 1}
          page={page}
          onChange={(e, newPage) => setPage(newPage)}
        />
      </Box>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Patient</DialogTitle>
        <DialogContent>
          Are you sure you want to delete {patientToDelete?.firstName} {patientToDelete?.lastName}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientsList;

