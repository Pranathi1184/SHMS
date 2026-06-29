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
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Visibility,
  Cancel,
} from '@mui/icons-material';
import { appointmentService } from '../services/appointmentService';
import { doctorService } from '../services/doctorService';
import { patientService } from '../services/patientService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { readableId } from '../utils/formatters';
import TableSkeletonLoader from '../components/TableSkeletonLoader';
import { toUserFriendlyError } from '../utils/errorMessages';
import { analyticsService } from '../services/analyticsService';

const AppointmentsList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [doctorOptions, setDoctorOptions] = useState([]);
  const [availableDoctorOptions, setAvailableDoctorOptions] = useState([]);
  const [patientOptions, setPatientOptions] = useState([]);
  const [availabilityHint, setAvailabilityHint] = useState('');
  const [availabilitySeverity, setAvailabilitySeverity] = useState('info');
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [checkingDoctors, setCheckingDoctors] = useState(false);
  const [onlyAvailableDoctors, setOnlyAvailableDoctors] = useState(true);
  const [slotFinderLoading, setSlotFinderLoading] = useState(false);
  const [fastSlots, setFastSlots] = useState([]);
  const [suggestedSlots, setSuggestedSlots] = useState([]);
  const [riskByAppointmentId, setRiskByAppointmentId] = useState({});
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPatient = user?.role === 'Patient';
  const canEdit = ['Administrator', 'Doctor', 'Receptionist', 'Nurse'].includes(user?.role);
  const canBook = canEdit || isPatient;
  const canCancel = canEdit || isPatient;
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm();

  const watchedDoctorId = watch('doctorId');
  const watchedDate = watch('appointmentDate');
  const watchedStart = watch('startTime');
  const watchedEnd = watch('endTime');

  const toMinutes = (value) => {
    if (!value) return 0;
    const [hours, minutes] = value.split(':').map(Number);
    return (hours * 60) + minutes;
  };

  useEffect(() => {
    fetchAppointments();
  }, [search, statusFilter, page]);

  useEffect(() => {
    const key = `shms_filters_appointments_${user?.role || 'all'}`;
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    if (saved.search) {
      setSearch(saved.search);
    }
    if (typeof saved.statusFilter === 'string') {
      setStatusFilter(saved.statusFilter);
    }
  }, [user?.role]);

  useEffect(() => {
    const key = `shms_filters_appointments_${user?.role || 'all'}`;
    localStorage.setItem(key, JSON.stringify({ search, statusFilter }));
  }, [search, statusFilter, user?.role]);

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const doctorsResponse = await doctorService.getDoctors({ page: 1, limit: 100 });
        const loadedDoctors = doctorsResponse?.data?.doctors || [];
        setDoctorOptions(loadedDoctors);
        setAvailableDoctorOptions(loadedDoctors);

        if (!isPatient) {
          const patientsResponse = await patientService.getAllPatients({ page: 1, limit: 200 });
          setPatientOptions(patientsResponse?.data?.patients || []);
        }
      } catch (err) {
        // Keep selectors empty if reference data fails; form-level errors will still guide users.
      }
    };

    loadReferenceData();
  }, [isPatient]);

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    if (!watchedDate || !watchedStart || !watchedEnd) {
      setAvailableDoctorOptions(doctorOptions);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingDoctors(true);
        const response = await appointmentService.getAvailableDoctors({
          date: watchedDate,
          startTime: watchedStart,
          endTime: watchedEnd,
        });
        const available = response?.data?.doctors || [];

        if (editingAppointment?.doctorId && !available.some((doctor) => doctor.id === editingAppointment.doctorId)) {
          const currentDoctor = doctorOptions.find((doctor) => doctor.id === editingAppointment.doctorId);
          if (currentDoctor) {
            setAvailableDoctorOptions([currentDoctor, ...available]);
            return;
          }
        }

        setAvailableDoctorOptions(available);
      } catch (err) {
        setAvailableDoctorOptions(doctorOptions);
      } finally {
        setCheckingDoctors(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [dialogOpen, watchedDate, watchedStart, watchedEnd, doctorOptions, editingAppointment]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await appointmentService.getAppointments({ search, status: statusFilter || undefined, page });
      const loadedAppointments = data.data.appointments || [];
      setAppointments(loadedAppointments);
      setTotalPages(data.data.pagination?.totalPages || 1);

      try {
        const ids = loadedAppointments.map((item) => item.id);
        const riskResponse = await analyticsService.getNoShowRisk(ids);
        setRiskByAppointmentId(riskResponse?.data?.byAppointmentId || {});
      } catch (riskError) {
        setRiskByAppointmentId({});
      }
    } catch (err) {
      setError('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingAppointment(null);
    setAvailabilityHint('');
    setSuggestedSlots([]);
    setFastSlots([]);
    reset();
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (appointment) => {
    setEditingAppointment(appointment);
      setAvailabilityHint('');
      setSuggestedSlots([]);
      setFastSlots([]);
      reset({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentDate: appointment.appointmentDate
          ? new Date(appointment.appointmentDate).toISOString().split('T')[0]
          : '',
        startTime: appointment.startTime || '',
        endTime: appointment.endTime || '',
        notes: appointment.notes || '',
      });
    setDialogOpen(true);
  };

  useEffect(() => {
    const hasCoreValues = dialogOpen && watchedDoctorId && watchedDate && watchedStart && watchedEnd;
    if (!hasCoreValues) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingAvailability(true);
        const response = await appointmentService.checkAvailability({
          doctorId: watchedDoctorId,
          date: watchedDate,
          startTime: watchedStart,
          endTime: watchedEnd,
        });
        const payload = response?.data || {};
        setSuggestedSlots(payload.suggestedSlots || []);
        setAvailabilityHint(payload.message || 'Availability checked.');
        setAvailabilitySeverity(payload.available ? 'success' : 'error');
      } catch (err) {
        const backendSuggestions = err?.response?.data?.data?.suggestedSlots || [];
        setSuggestedSlots(backendSuggestions);
        setAvailabilityHint(err?.response?.data?.message || 'Could not verify availability right now.');
        setAvailabilitySeverity('warning');
      } finally {
        setCheckingAvailability(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [dialogOpen, watchedDoctorId, watchedDate, watchedStart, watchedEnd, editingAppointment]);

  const handleSubmitAppointment = async (data) => {
    try {
      setError('');
      if (editingAppointment) {
        await appointmentService.updateAppointment(editingAppointment.id, data);
        setSuccess('Appointment updated successfully');
      } else {
        await appointmentService.createAppointment(data);
        setSuccess('Appointment created successfully');
      }
      setDialogOpen(false);
      fetchAppointments();
    } catch (err) {
      setError(toUserFriendlyError(err, 'Unable to save appointment right now.'));
    }
  };

  const handleFindBestSlots = async () => {
    if (!watchedDate || !watchedStart || !watchedEnd) {
      setFastSlots([]);
      return;
    }

    try {
      setSlotFinderLoading(true);
      const duration = Math.max(toMinutes(watchedEnd) - toMinutes(watchedStart), 30);
      const response = await appointmentService.findBestSlots({
        date: watchedDate,
        fromTime: watchedStart,
        toTime: watchedEnd,
        durationMinutes: duration,
        preferredDoctorId: watchedDoctorId || undefined,
      });
      setFastSlots(response?.data?.slots || []);
    } catch (err) {
      setFastSlots([]);
    } finally {
      setSlotFinderLoading(false);
    }
  };

  const handleCancelClick = (appointment) => {
    setAppointmentToCancel(appointment);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    try {
      setError('');
      await appointmentService.cancelAppointment(appointmentToCancel.id);
      setSuccess('Appointment cancelled successfully');
      setCancelDialogOpen(false);
      fetchAppointments();
    } catch (err) {
      setError(toUserFriendlyError(err, 'Unable to cancel appointment right now.'));
    }
  };

  const activeDoctorOptions = (watchedDate && watchedStart && watchedEnd && onlyAvailableDoctors)
    ? availableDoctorOptions
    : doctorOptions;

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" fontWeight="bold" mb={3}>Appointments</Typography>
        <Paper sx={{ p: 2, mb: 3 }}>
          <CircularProgress size={22} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Loading appointments...</Typography>
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
          Appointments
        </Typography>
        {canBook && (
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenAddDialog}>
            Book Appointment
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

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search appointments..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
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
        <Box sx={{ mt: 1.5, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr auto auto' } }}>
          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="Scheduled">Scheduled</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
            <MenuItem value="Rescheduled">Rescheduled</MenuItem>
          </TextField>
          <Button variant="text" onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}>
            Reset Filters
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
            Page {page} of {totalPages}
          </Typography>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>No-Show Risk</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography fontWeight="bold" mb={0.5}>No appointments found</Typography>
                  <Typography variant="body2" color="text.secondary" mb={1.5}>
                    Try changing your search or create a new booking.
                  </Typography>
                  {canBook && (
                    <Button size="small" variant="outlined" onClick={handleOpenAddDialog}>Book first appointment</Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((appointment) => (
                <TableRow key={appointment.id} hover>
                  <TableCell>{readableId('appointment', appointment.id, appointment)}</TableCell>
                  <TableCell>
                    {appointment.patient
                      ? `${appointment.patient.firstName || ''} ${appointment.patient.lastName || ''}`.trim()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {appointment.doctor?.user
                      ? `${appointment.doctor.user.firstName || ''} ${appointment.doctor.user.lastName || ''}`.trim()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : 'N/A'}
                    {' '}
                    {appointment.startTime && appointment.endTime
                      ? `(${appointment.startTime} - ${appointment.endTime})`
                      : ''}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={appointment.status || 'Scheduled'}
                      color={appointment.status === 'Cancelled' ? 'error' : 'primary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {riskByAppointmentId[appointment.id] ? (
                      <Chip
                        size="small"
                        label={`${riskByAppointmentId[appointment.id].riskLabel || 'Low'} (${Number(riskByAppointmentId[appointment.id].riskScore || 0).toFixed(2)})`}
                        color={
                          riskByAppointmentId[appointment.id].riskLabel === 'High'
                            ? 'error'
                            : riskByAppointmentId[appointment.id].riskLabel === 'Medium'
                              ? 'warning'
                              : 'success'
                        }
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">N/A</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => navigate(`/appointments/${appointment.id}`)}
                    >
                      <Visibility />
                    </IconButton>
                    {canEdit && appointment.status !== 'Cancelled' && (
                      <IconButton
                        color="secondary"
                        onClick={() => handleOpenEditDialog(appointment)}
                      >
                        <Edit />
                      </IconButton>
                    )}
                    {canCancel && appointment.status !== 'Cancelled' && (
                      <IconButton
                        color="error"
                        onClick={() => handleCancelClick(appointment)}
                      >
                        <Cancel />
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
          count={totalPages}
          page={page}
          onChange={(e, newPage) => setPage(newPage)}
        />
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingAppointment ? 'Edit Appointment' : 'Book Appointment'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(handleSubmitAppointment)} sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              fullWidth
              label="Patient"
              select
              defaultValue=""
              disabled={isPatient}
              {...register('patientId', { required: isPatient ? false : 'Patient ID is required' })}
              error={!!errors.patientId}
              helperText={isPatient ? 'Automatically linked from your account' : (errors.patientId?.message || 'Select patient')}
            >
              <MenuItem value="">Select patient</MenuItem>
              {patientOptions.map((patient) => (
                <MenuItem key={patient.id} value={patient.id}>
                  {`${readableId('patient', patient.id, patient)} - ${patient.firstName || ''} ${patient.lastName || ''}`.trim()}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              margin="normal"
              fullWidth
              label="Doctor"
              select
              defaultValue=""
              {...register('doctorId', { required: 'Doctor ID is required' })}
              error={!!errors.doctorId}
              helperText={errors.doctorId?.message || (checkingDoctors ? 'Filtering available doctors...' : 'Select doctor')}
            >
              <MenuItem value="">Select doctor</MenuItem>
              {activeDoctorOptions.map((doctor) => (
                <MenuItem key={doctor.id} value={doctor.id}>
                  {`${readableId('doctor', doctor.id, doctor)} - ${(doctor.user?.firstName || '')} ${(doctor.user?.lastName || '')} (${String(doctor.doctorSchedule?.availableFrom || '09:00').slice(0, 5)}-${String(doctor.doctorSchedule?.availableTo || '17:00').slice(0, 5)})`.trim()}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
              <FormControlLabel
                control={<Switch size="small" checked={onlyAvailableDoctors} onChange={(e) => setOnlyAvailableDoctors(e.target.checked)} />}
                label="Only available doctors"
              />
              {onlyAvailableDoctors && watchedDate && watchedStart && watchedEnd && (
                <Chip size="small" color="info" label="Only available doctors" />
              )}
            </Box>
            {onlyAvailableDoctors && watchedDate && watchedStart && watchedEnd && !checkingDoctors && activeDoctorOptions.length === 0 && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                No doctor available at this time. Try suggested slots below.
              </Alert>
            )}
            <TextField
              margin="normal"
              fullWidth
              label="Appointment Date"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              {...register('appointmentDate', { required: 'Date & time is required' })}
              error={!!errors.appointmentDate}
              helperText={errors.appointmentDate?.message}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Start Time"
              type="time"
              slotProps={{ inputLabel: { shrink: true } }}
              {...register('startTime', { required: 'Start time is required' })}
              error={!!errors.startTime}
              helperText={errors.startTime?.message}
            />
            <TextField
              margin="normal"
              fullWidth
              label="End Time"
              type="time"
              slotProps={{ inputLabel: { shrink: true } }}
              {...register('endTime', { required: 'End time is required' })}
              error={!!errors.endTime}
              helperText={errors.endTime?.message}
            />
            {checkingAvailability && (
              <Typography variant="caption" color="text.secondary">Checking doctor availability...</Typography>
            )}
            {!checkingAvailability && availabilityHint && (
              <Alert severity={availabilitySeverity} sx={{ mt: 1 }}>{availabilityHint}</Alert>
            )}
            {!checkingAvailability && suggestedSlots.length > 0 && (
              <Paper variant="outlined" sx={{ mt: 1.25, p: 1.25, bgcolor: 'background.default' }}>
                <Typography variant="caption" color="text.secondary">Best next slots</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.75 }}>
                  {suggestedSlots.map((slot) => (
                    <Chip
                      key={`${slot.date || watchedDate}-${slot.start}-${slot.end}`}
                      label={`${slot.date || watchedDate} ${slot.start} - ${slot.end}`}
                      size="small"
                      color="success"
                      onClick={() => {
                        reset({
                          ...watch(),
                          appointmentDate: slot.date || watchedDate,
                          startTime: slot.start,
                          endTime: slot.end,
                        });
                      }}
                    />
                  ))}
                </Box>
              </Paper>
            )}

            <Paper variant="outlined" sx={{ mt: 1.25, p: 1.25, bgcolor: 'background.default' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary">Fast Slot Finder (Top 3)</Typography>
                <Button size="small" variant="outlined" onClick={handleFindBestSlots} disabled={slotFinderLoading || !watchedDate || !watchedStart || !watchedEnd}>
                  {slotFinderLoading ? 'Finding...' : 'Suggest Top 3'}
                </Button>
              </Box>
              {fastSlots.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.75 }}>
                  {fastSlots.map((slot) => (
                    <Chip
                      key={`${slot.date}-${slot.start}-${slot.end}-${slot.doctorId}`}
                      label={`${slot.doctorName}: ${slot.date} ${slot.start}-${slot.end}`}
                      size="small"
                      color={slot.preferredMatch ? 'primary' : 'default'}
                      onClick={() => {
                        reset({
                          ...watch(),
                          doctorId: slot.doctorId,
                          appointmentDate: slot.date,
                          startTime: slot.start,
                          endTime: slot.end,
                        });
                      }}
                    />
                  ))}
                </Box>
              )}
            </Paper>
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
                {editingAppointment ? 'Update' : 'Book'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Appointment</DialogTitle>
        <DialogContent>
          Are you sure you want to cancel this appointment?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>No</Button>
          <Button onClick={handleCancelConfirm} color="error" variant="contained">
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentsList;

