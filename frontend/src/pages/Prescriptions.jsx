import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
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
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { prescriptionService } from '../services/prescriptionService';
import { doctorService } from '../services/doctorService';
import { medicineService } from '../services/medicineService';
import { patientService } from '../services/patientService';
import { Controller, useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { readableId } from '../utils/formatters';

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [prescriptionToDelete, setPrescriptionToDelete] = useState(null);
  const [patientOptions, setPatientOptions] = useState([]);
  const [doctorOptions, setDoctorOptions] = useState([]);
  const [medicineOptions, setMedicineOptions] = useState([]);
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrator';
  const isDoctor = user?.role === 'Doctor';
  const isPharmacist = user?.role === 'Pharmacist';
  const canCreate = isAdmin || isDoctor;
  const canDispense = isAdmin || isPharmacist;
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    fetchPrescriptions();
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    try {
      const [patientsResponse, doctorsResponse, medicinesResponse] = await Promise.all([
        patientService.getAllPatients({ page: 1, limit: 200 }),
        doctorService.getDoctors({ page: 1, limit: 100 }),
        medicineService.getMedicines({ page: 1, limit: 200 }),
      ]);

      setPatientOptions(patientsResponse?.data?.patients || []);
      setDoctorOptions(doctorsResponse?.data?.doctors || []);
      setMedicineOptions(medicinesResponse?.data?.medicines || []);
    } catch (err) {
      setPatientOptions([]);
      setDoctorOptions([]);
      setMedicineOptions([]);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await prescriptionService.getPrescriptions();
      setPrescriptions(data.data.prescriptions || []);
    } catch (err) {
      setError('Failed to fetch prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingPrescription(null);
    reset({ status: 'Pending' });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (prescription) => {
    setEditingPrescription(prescription);
    reset({
      patientId: prescription.patientId,
      doctorId: prescription.doctorId,
      notes: prescription.notes || '',
      status: prescription.status || 'Pending',
    });
    setDialogOpen(true);
  };

  const patientLabel = (patient) => (patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : '');
  const doctorLabel = (doctor) => {
    if (!doctor) return '';
    const name = `${doctor.user?.firstName || ''} ${doctor.user?.lastName || ''}`.trim();
    return `${name} | ${doctor.specialization || 'General'} | ${doctor.department?.name || 'No department'}`;
  };
  const medicineLabel = (medicine) => {
    if (!medicine) return '';
    const code = medicine.medicineCode || readableId('medicine', medicine.id, medicine);
    return `${medicine.name || 'Medicine'} | ${code}`;
  };

  const handleSubmitPrescription = async (data) => {
    try {
      setError('');
      if (editingPrescription) {
        await prescriptionService.updatePrescription(editingPrescription.id, {
          notes: data.notes,
          status: data.status,
        });
        setSuccess('Prescription updated successfully');
      } else {
        await prescriptionService.createPrescription({
          patientId: data.patientId,
          doctorId: data.doctorId,
          notes: data.notes,
          items: [
            {
              medicineId: data.medicineId,
              dosage: data.dosage,
              frequency: data.frequency,
              duration: data.duration,
              quantity: Number(data.quantity),
              instructions: data.instructions,
            },
          ],
        });
        setSuccess('Prescription created successfully');
      }
      setDialogOpen(false);
      fetchPrescriptions();
    } catch (err) {
      setError('Failed to save prescription');
    }
  };

  const handleDispense = async (id) => {
    try {
      setError('');
      await prescriptionService.dispensePrescription(id);
      setSuccess('Prescription dispensed successfully');
      fetchPrescriptions();
    } catch (err) {
      setError('Failed to dispense prescription');
    }
  };

  const handleDeleteClick = (prescription) => {
    setPrescriptionToDelete(prescription);
    setDeleteDialogOpen(true);
  };

  const handleViewClick = (prescription) => {
    setSelectedPrescription(prescription);
    setViewDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setError('');
      await prescriptionService.deletePrescription(prescriptionToDelete.id);
      setSuccess('Prescription deleted successfully');
      setDeleteDialogOpen(false);
      fetchPrescriptions();
    } catch (err) {
      setError('Failed to delete prescription');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Prescriptions
        </Typography>
        {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenAddDialog}>
            Create Prescription
          </Button>
        )}
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prescriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No prescriptions found
                </TableCell>
              </TableRow>
            ) : (
              prescriptions.map((prescription) => (
                <TableRow key={prescription.id} hover>
                  <TableCell>{readableId('prescription', prescription.id, prescription)}</TableCell>
                  <TableCell>
                    {prescription.patient
                      ? `${prescription.patient.firstName || ''} ${prescription.patient.lastName || ''}`.trim()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {prescription.doctor?.user
                      ? `${prescription.doctor.user.firstName || ''} ${prescription.doctor.user.lastName || ''}`.trim()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {prescription.prescriptionDate ? new Date(prescription.prescriptionDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Box component="span" sx={{
                      px: 2, py: 1, borderRadius: 1,
                      bgcolor: prescription.status === 'Dispensed' ? 'success.light' :
                        prescription.status === 'Cancelled' ? 'error.light' : 'info.light',
                      color: prescription.status === 'Dispensed' ? 'success.dark' :
                        prescription.status === 'Cancelled' ? 'error.dark' : 'info.dark'
                    }}>
                      {prescription.status || 'Pending'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleViewClick(prescription)}>
                      <Visibility />
                    </IconButton>
                    {canCreate && prescription.status === 'Pending' && (
                      <IconButton
                        color="secondary"
                        onClick={() => handleOpenEditDialog(prescription)}
                      >
                        <Edit />
                      </IconButton>
                    )}
                    {canDispense && prescription.status === 'Pending' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleDispense(prescription.id)}
                      >
                        Dispense
                      </Button>
                    )}
                    {isAdmin && (
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(prescription)}
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

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingPrescription ? 'Edit Prescription' : 'Create Prescription'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(handleSubmitPrescription)} sx={{ mt: 2 }}>
            <Controller
              name="patientId"
              control={control}
              rules={{ required: 'Patient is required' }}
              render={({ field }) => (
                <Autocomplete
                  options={patientOptions}
                  disabled={!!editingPrescription}
                  getOptionLabel={patientLabel}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  value={patientOptions.find((patient) => patient.id === field.value) || null}
                  onChange={(_, value) => field.onChange(value?.id || '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      margin="normal"
                      fullWidth
                      label="Patient"
                      error={!!errors.patientId}
                      helperText={errors.patientId?.message}
                    />
                  )}
                />
              )}
            />
            <Controller
              name="doctorId"
              control={control}
              rules={{ required: 'Doctor is required' }}
              render={({ field }) => (
                <Autocomplete
                  options={doctorOptions}
                  disabled={!!editingPrescription}
                  getOptionLabel={doctorLabel}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  value={doctorOptions.find((doctor) => doctor.id === field.value) || null}
                  onChange={(_, value) => field.onChange(value?.id || '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      margin="normal"
                      fullWidth
                      label="Doctor"
                      error={!!errors.doctorId}
                      helperText={errors.doctorId?.message}
                    />
                  )}
                />
              )}
            />
            {!editingPrescription && (
              <>
                <Controller
                  name="medicineId"
                  control={control}
                  rules={{ required: 'Medicine is required' }}
                  render={({ field }) => (
                    <Autocomplete
                      options={medicineOptions}
                      getOptionLabel={medicineLabel}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      value={medicineOptions.find((medicine) => medicine.id === field.value) || null}
                      onChange={(_, value) => field.onChange(value?.id || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          margin="normal"
                          fullWidth
                          label="Medicine"
                          error={!!errors.medicineId}
                          helperText={errors.medicineId?.message}
                        />
                      )}
                    />
                  )}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label="Dosage"
                  {...register('dosage', { required: 'Dosage is required' })}
                  error={!!errors.dosage}
                  helperText={errors.dosage?.message}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label="Frequency"
                  {...register('frequency', { required: 'Frequency is required' })}
                  error={!!errors.frequency}
                  helperText={errors.frequency?.message}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label="Duration"
                  {...register('duration', { required: 'Duration is required' })}
                  error={!!errors.duration}
                  helperText={errors.duration?.message}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label="Quantity"
                  type="number"
                  {...register('quantity', { required: 'Quantity is required' })}
                  error={!!errors.quantity}
                  helperText={errors.quantity?.message}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label="Instructions"
                  {...register('instructions')}
                />
              </>
            )}
            <TextField
              margin="normal"
              fullWidth
              label="Notes"
              multiline
              rows={3}
              {...register('notes')}
            />
            <DialogActions sx={{ mt: 2, px: 0 }}>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained">
                {editingPrescription ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Prescription</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this prescription?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Prescription Details</DialogTitle>
        <DialogContent>
          <Typography><strong>Prescription ID:</strong> {selectedPrescription?.id || 'N/A'}</Typography>
          <Typography>
            <strong>Patient:</strong>{' '}
            {selectedPrescription?.patient
              ? `${selectedPrescription.patient.firstName || ''} ${selectedPrescription.patient.lastName || ''}`.trim()
              : 'N/A'}
          </Typography>
          <Typography>
            <strong>Doctor:</strong>{' '}
            {selectedPrescription?.doctor?.user
              ? `${selectedPrescription.doctor.user.firstName || ''} ${selectedPrescription.doctor.user.lastName || ''}`.trim()
              : 'N/A'}
          </Typography>
          <Typography><strong>Status:</strong> {selectedPrescription?.status || 'N/A'}</Typography>
          <Typography><strong>Date:</strong> {selectedPrescription?.prescriptionDate ? new Date(selectedPrescription.prescriptionDate).toLocaleDateString() : 'N/A'}</Typography>
          <Typography><strong>Notes:</strong> {selectedPrescription?.notes || 'N/A'}</Typography>
          <Typography><strong>Items:</strong> {selectedPrescription?.items?.length || 0}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Prescriptions;

