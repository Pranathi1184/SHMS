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
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { ehrService } from '../services/ehrService';
import { appointmentService } from '../services/appointmentService';
import { doctorService } from '../services/doctorService';
import { patientService } from '../services/patientService';
import { Controller, useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { readableId } from '../utils/formatters';

const EHR = () => {
  const [ehrs, setEhrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEhr, setEditingEhr] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedEhr, setSelectedEhr] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ehrToDelete, setEhrToDelete] = useState(null);
  const [patientOptions, setPatientOptions] = useState([]);
  const [doctorOptions, setDoctorOptions] = useState([]);
  const [appointmentOptions, setAppointmentOptions] = useState([]);
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrator';
  const canEdit = isAdmin || user?.role === 'Doctor';
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    fetchEHRs();
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    try {
      const [patientsResponse, doctorsResponse, appointmentsResponse] = await Promise.all([
        patientService.getAllPatients({ page: 1, limit: 200 }),
        doctorService.getDoctors({ page: 1, limit: 100 }),
        appointmentService.getAppointments({ page: 1, limit: 200 }),
      ]);

      setPatientOptions(patientsResponse?.data?.patients || []);
      setDoctorOptions(doctorsResponse?.data?.doctors || []);
      setAppointmentOptions(appointmentsResponse?.data?.appointments || []);
    } catch (err) {
      setPatientOptions([]);
      setDoctorOptions([]);
      setAppointmentOptions([]);
    }
  };

  const fetchEHRs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await ehrService.getEHRs();
      setEhrs(data.data.ehrs || []);
    } catch (err) {
      setError('Failed to fetch EHRs');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingEhr(null);
    reset();
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (ehr) => {
    setEditingEhr(ehr);
    reset({
      patientId: ehr.patientId || '',
      doctorId: ehr.doctorId || '',
      appointmentId: ehr.appointmentId || '',
      diagnosis: ehr.diagnosis || '',
      treatmentPlan: ehr.treatmentPlan || '',
      notes: ehr.notes || '',
    });
    setDialogOpen(true);
  };

  const patientLabel = (patient) => (patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : '');
  const doctorLabel = (doctor) => {
    if (!doctor) return '';
    const name = `${doctor.user?.firstName || ''} ${doctor.user?.lastName || ''}`.trim();
    return `${name} | ${doctor.specialization || 'General'} | ${doctor.department?.name || 'No department'}`;
  };
  const appointmentLabel = (appointment) => {
    if (!appointment) return '';
    const patientName = appointment.patient ? `${appointment.patient.firstName || ''} ${appointment.patient.lastName || ''}`.trim() : 'Unknown patient';
    const date = appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : 'No date';
    return `${patientName} | ${date} ${appointment.startTime || ''}-${appointment.endTime || ''}`.trim();
  };

  const handleSubmitEhr = async (data) => {
    try {
      setError('');
      if (editingEhr) {
        await ehrService.updateEHR(editingEhr.id, data);
        setSuccess('EHR updated successfully');
      } else {
        await ehrService.createEHR(data);
        setSuccess('EHR created successfully');
      }
      setDialogOpen(false);
      fetchEHRs();
    } catch (err) {
      setError('Failed to save EHR');
    }
  };

  const handleDeleteClick = (ehr) => {
    setEhrToDelete(ehr);
    setDeleteDialogOpen(true);
  };

  const handleViewClick = (ehr) => {
    setSelectedEhr(ehr);
    setViewDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setError('');
      await ehrService.deleteEHR(ehrToDelete.id);
      setSuccess('EHR deleted successfully');
      setDeleteDialogOpen(false);
      fetchEHRs();
    } catch (err) {
      setError('Failed to delete EHR');
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
          Electronic Health Records
        </Typography>
        {canEdit && (
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenAddDialog}>
            Add EHR
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
              <TableCell>Diagnosis</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ehrs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No EHRs found
                </TableCell>
              </TableRow>
            ) : (
              ehrs.map((ehr) => (
                <TableRow key={ehr.id} hover>
                  <TableCell>{readableId('ehr', ehr.id, ehr)}</TableCell>
                  <TableCell>
                    {ehr.patient
                      ? `${ehr.patient.firstName || ''} ${ehr.patient.lastName || ''}`.trim()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {ehr.doctor?.user
                      ? `${ehr.doctor.user.firstName || ''} ${ehr.doctor.user.lastName || ''}`.trim()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {ehr.ehrDate ? new Date(ehr.ehrDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>{ehr.diagnosis || 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleViewClick(ehr)}>
                      <Visibility />
                    </IconButton>
                    {canEdit && (
                      <IconButton
                        color="secondary"
                        onClick={() => handleOpenEditDialog(ehr)}
                      >
                        <Edit />
                      </IconButton>
                    )}
                    {isAdmin && (
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(ehr)}
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
          {editingEhr ? 'Edit EHR' : 'Add EHR'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(handleSubmitEhr)} sx={{ mt: 2 }}>
            <Controller
              name="patientId"
              control={control}
              rules={{ required: 'Patient is required' }}
              render={({ field }) => (
                <Autocomplete
                  options={patientOptions}
                  disabled={!!editingEhr}
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
                  disabled={!!editingEhr}
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
            <Controller
              name="appointmentId"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={appointmentOptions}
                  disabled={!!editingEhr}
                  getOptionLabel={appointmentLabel}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  value={appointmentOptions.find((appointment) => appointment.id === field.value) || null}
                  onChange={(_, value) => field.onChange(value?.id || '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      margin="normal"
                      fullWidth
                      label="Appointment (Optional)"
                    />
                  )}
                />
              )}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Diagnosis"
              multiline
              rows={3}
              {...register('diagnosis', { required: 'Diagnosis is required' })}
              error={!!errors.diagnosis}
              helperText={errors.diagnosis?.message}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Treatment Plan"
              multiline
              rows={4}
              {...register('treatmentPlan')}
            />
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
                {editingEhr ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete EHR</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this EHR?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>EHR Details</DialogTitle>
        <DialogContent>
          <Typography><strong>EHR ID:</strong> {selectedEhr?.id || 'N/A'}</Typography>
          <Typography>
            <strong>Patient:</strong>{' '}
            {selectedEhr?.patient
              ? `${selectedEhr.patient.firstName || ''} ${selectedEhr.patient.lastName || ''}`.trim()
              : 'N/A'}
          </Typography>
          <Typography>
            <strong>Doctor:</strong>{' '}
            {selectedEhr?.doctor?.user
              ? `${selectedEhr.doctor.user.firstName || ''} ${selectedEhr.doctor.user.lastName || ''}`.trim()
              : 'N/A'}
          </Typography>
          <Typography><strong>Date:</strong> {selectedEhr?.createdAt ? new Date(selectedEhr.createdAt).toLocaleString() : 'N/A'}</Typography>
          <Typography><strong>Diagnosis:</strong> {selectedEhr?.diagnosis || 'N/A'}</Typography>
          <Typography><strong>Treatment Plan:</strong> {selectedEhr?.treatmentPlan || 'N/A'}</Typography>
          <Typography><strong>Notes:</strong> {selectedEhr?.notes || 'N/A'}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EHR;

