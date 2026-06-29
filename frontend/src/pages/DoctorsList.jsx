import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add, Search, Schedule } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { doctorService } from '../services/doctorService';
import { departmentService } from '../services/departmentService';
import { readableId } from '../utils/formatters';
import { useForm } from 'react-hook-form';

const DoctorsList = () => {
  const { user } = useAuth();
  const canCreate = ['Administrator', 'Receptionist'].includes(user?.role);
  const canManageTimings = ['Administrator', 'Receptionist', 'Doctor'].includes(user?.role);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
  const [selectedDoctorForAvailability, setSelectedDoctorForAvailability] = useState(null);
  const [saving, setSaving] = useState(false);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [clinicModeSavingByDoctor, setClinicModeSavingByDoctor] = useState({});
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();
  const {
    register: registerAvailability,
    handleSubmit: handleSubmitAvailability,
    formState: { errors: availabilityErrors },
    reset: resetAvailability,
  } = useForm({
    defaultValues: {
      availableFrom: '09:00',
      availableTo: '17:00',
      slotDurationMinutes: 30,
      availableDays: [1, 2, 3, 4, 5],
    },
  });

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError('');
      const [doctorResponse, departmentResponse] = await Promise.all([
        doctorService.getDoctors({ page: 1, limit: 100, search, departmentId: departmentFilter }),
        departmentService.getDepartments({ page: 1, limit: 100 }),
      ]);
      setDoctors(doctorResponse.data.doctors || []);
      setDepartments(departmentResponse.data.departments || []);
    } catch (err) {
      setError('Failed to load doctor directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [search, departmentFilter]);

  useEffect(() => {
    const key = `shms_filters_doctors_${user?.role || 'all'}`;
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    if (typeof saved.search === 'string') setSearch(saved.search);
    if (typeof saved.departmentFilter === 'string') setDepartmentFilter(saved.departmentFilter);
  }, [user?.role]);

  useEffect(() => {
    const key = `shms_filters_doctors_${user?.role || 'all'}`;
    localStorage.setItem(key, JSON.stringify({ search, departmentFilter }));
  }, [search, departmentFilter, user?.role]);

  const departmentCount = useMemo(() => {
    const unique = new Set(doctors.map((doctor) => doctor.department?.id).filter(Boolean));
    return unique.size;
  }, [doctors]);

  const sortedDoctors = useMemo(() => {
    return [...doctors].sort((a, b) => {
      const aName = `${a.user?.firstName || ''} ${a.user?.lastName || ''}`.trim().toLowerCase();
      const bName = `${b.user?.firstName || ''} ${b.user?.lastName || ''}`.trim().toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [doctors]);

  const handleOpenDialog = () => {
    reset({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      departmentId: '',
      specialization: '',
      licenseNumber: '',
      consultationFee: 0,
    });
    setDialogOpen(true);
  };

  const handleCreateDoctor = async (data) => {
    try {
      setSaving(true);
      setError('');
      await doctorService.createDoctor({
        ...data,
        consultationFee: Number(data.consultationFee),
        slotDurationMinutes: Number(data.slotDurationMinutes),
        availableDays: (data.availableDays || []).map((day) => Number(day)),
      });
      setSuccess('Doctor created successfully');
      setDialogOpen(false);
      await fetchDoctors();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create doctor');
    } finally {
      setSaving(false);
    }
  };

  const formatSchedule = (doctor) => {
    const schedule = doctor.doctorSchedule || {};
    const from = String(schedule.availableFrom || '09:00').slice(0, 5);
    const to = String(schedule.availableTo || '17:00').slice(0, 5);
    const duration = Number(schedule.slotDurationMinutes || 30);
    const rawDays = Array.isArray(schedule.availableDays) && schedule.availableDays.length ? schedule.availableDays : [1, 2, 3, 4, 5];
    const days = rawDays
      .map((day) => dayLabels[Number(day)])
      .filter(Boolean)
      .join(', ');
    return `${days} | ${from} - ${to} | ${duration} min`; 
  };

  const openAvailabilityDialog = (doctor) => {
    setSelectedDoctorForAvailability(doctor);
    const schedule = doctor.doctorSchedule || {};
    resetAvailability({
      availableFrom: String(schedule.availableFrom || '09:00').slice(0, 5),
      availableTo: String(schedule.availableTo || '17:00').slice(0, 5),
      slotDurationMinutes: Number(schedule.slotDurationMinutes || 30),
      availableDays: (Array.isArray(schedule.availableDays) && schedule.availableDays.length ? schedule.availableDays : [1, 2, 3, 4, 5]).map((day) => Number(day)),
    });
    setAvailabilityDialogOpen(true);
  };

  const canEditDoctorSchedule = (doctor) => {
    if (!canManageTimings) return false;
    if (user?.role !== 'Doctor') return true;
    return doctor.user?.id === user?.id;
  };

  const handleUpdateAvailability = async (formData) => {
    if (!selectedDoctorForAvailability) return;
    try {
      setAvailabilitySaving(true);
      setError('');
      await doctorService.updateDoctorAvailability(selectedDoctorForAvailability.id, {
        availableFrom: formData.availableFrom,
        availableTo: formData.availableTo,
        slotDurationMinutes: Number(formData.slotDurationMinutes),
        availableDays: (formData.availableDays || []).map((day) => Number(day)),
      });
      setSuccess('Doctor timings updated successfully');
      setAvailabilityDialogOpen(false);
      await fetchDoctors();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update doctor timings');
    } finally {
      setAvailabilitySaving(false);
    }
  };

  const handleClinicModeToggle = async (doctor, runningLate) => {
    try {
      setClinicModeSavingByDoctor((prev) => ({ ...prev, [doctor.id]: true }));
      setError('');
      await doctorService.updateClinicMode(doctor.id, {
        runningLate,
        delayMinutes: runningLate ? 15 : 0,
      });
      setSuccess(runningLate ? 'Adaptive clinic mode enabled (15 min delay)' : 'Clinic mode set to on-time');
      await fetchDoctors();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update clinic mode');
    } finally {
      setClinicModeSavingByDoctor((prev) => ({ ...prev, [doctor.id]: false }));
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Doctors Directory
          </Typography>
          <Typography color="text.secondary">
            Search by name, email, or department and manage clinical staffing.
          </Typography>
        </Box>
        {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenDialog}>
            Add Doctor
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Doctors Visible</Typography>
              <Typography variant="h4" fontWeight="bold">{doctors.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Departments</Typography>
              <Typography variant="h4" fontWeight="bold">{departmentCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Access Level</Typography>
              <Typography variant="h4" fontWeight="bold">{user?.role || 'Guest'}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 7 }}>
            <TextField
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by doctor name, email, or specialization"
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
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              select
              label="Department"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <MenuItem value="">All departments</MenuItem>
              {departments.map((department) => (
                <MenuItem key={department.id} value={department.id}>
                  {department.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Button
              variant="text"
              onClick={() => {
                setSearch('');
                setDepartmentFilter('');
              }}
            >
              Reset Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Doctor</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Specialization</TableCell>
              <TableCell>Timings</TableCell>
              <TableCell>Fee</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedDoctors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No doctors found
                </TableCell>
              </TableRow>
            ) : (
              sortedDoctors.map((doctor) => (
                <TableRow key={doctor.id} hover>
                  <TableCell>
                    <Box>
                      <Typography fontWeight="medium">
                        {doctor.user?.firstName || ''} {doctor.user?.lastName || ''}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {readableId('doctor', doctor.id, doctor)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{doctor.department?.name || 'N/A'}</TableCell>
                  <TableCell>{doctor.specialization || 'N/A'}</TableCell>
                  <TableCell>{formatSchedule(doctor)}</TableCell>
                  <TableCell>${Number(doctor.consultationFee || 0).toFixed(2)}</TableCell>
                  <TableCell>{doctor.user?.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {canEditDoctorSchedule(doctor) ? (
                        <Button size="small" startIcon={<Schedule />} onClick={() => openAvailabilityDialog(doctor)}>
                          Edit Timings
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary">Read only</Typography>
                      )}
                      {canEditDoctorSchedule(doctor) && (
                        <Button
                          size="small"
                          color={(doctor.doctorSchedule?.runningLate ? 'success' : 'warning')}
                          variant="outlined"
                          disabled={!!clinicModeSavingByDoctor[doctor.id]}
                          onClick={() => handleClinicModeToggle(doctor, !doctor.doctorSchedule?.runningLate)}
                        >
                          {doctor.doctorSchedule?.runningLate ? 'Set On-Time' : 'Running Late +15m'}
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar open={!!success} autoHideDuration={3500} onClose={() => setSuccess('')}>
        <Alert severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Doctor</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(handleCreateDoctor)} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  {...register('firstName', { required: 'First name is required' })}
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Last Name"
                  {...register('lastName', { required: 'Last name is required' })}
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  {...register('email', { required: 'Email is required' })}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Phone"
                  {...register('phone', { required: 'Phone is required' })}
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  {...register('password', { required: 'Password is required' })}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Department"
                  defaultValue=""
                  {...register('departmentId', { required: 'Department is required' })}
                  error={!!errors.departmentId}
                  helperText={errors.departmentId?.message}
                >
                  {departments.map((department) => (
                    <MenuItem key={department.id} value={department.id}>
                      {department.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Specialization"
                  {...register('specialization', { required: 'Specialization is required' })}
                  error={!!errors.specialization}
                  helperText={errors.specialization?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="License Number"
                  {...register('licenseNumber', { required: 'License number is required' })}
                  error={!!errors.licenseNumber}
                  helperText={errors.licenseNumber?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Consultation Fee"
                  {...register('consultationFee', { required: 'Consultation fee is required' })}
                  error={!!errors.consultationFee}
                  helperText={errors.consultationFee?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="time"
                  label="Available From"
                  defaultValue="09:00"
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...register('availableFrom')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="time"
                  label="Available To"
                  defaultValue="17:00"
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...register('availableTo')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Slot Duration (mins)"
                  defaultValue={30}
                  {...register('slotDurationMinutes')}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  select
                  label="Available Days"
                  defaultValue={[1, 2, 3, 4, 5]}
                  slotProps={{
                    select: {
                      multiple: true,
                    },
                  }}
                  {...register('availableDays')}
                >
                  {dayLabels.map((label, index) => (
                    <MenuItem key={label} value={index}>{label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            <DialogActions sx={{ px: 0, pb: 0, pt: 3 }}>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Saving...' : 'Create Doctor'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={availabilityDialogOpen} onClose={() => setAvailabilityDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Doctor Timings</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmitAvailability(handleUpdateAvailability)} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="time"
                  label="Available From"
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...registerAvailability('availableFrom', { required: 'Available from is required' })}
                  error={!!availabilityErrors.availableFrom}
                  helperText={availabilityErrors.availableFrom?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="time"
                  label="Available To"
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...registerAvailability('availableTo', { required: 'Available to is required' })}
                  error={!!availabilityErrors.availableTo}
                  helperText={availabilityErrors.availableTo?.message}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Slot Duration (mins)"
                  {...registerAvailability('slotDurationMinutes', { required: 'Slot duration is required' })}
                  error={!!availabilityErrors.slotDurationMinutes}
                  helperText={availabilityErrors.slotDurationMinutes?.message}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  select
                  label="Available Days"
                  slotProps={{
                    select: {
                      multiple: true,
                    },
                  }}
                  {...registerAvailability('availableDays', { required: 'At least one day is required' })}
                  error={!!availabilityErrors.availableDays}
                  helperText={availabilityErrors.availableDays?.message}
                >
                  {dayLabels.map((label, index) => (
                    <MenuItem key={label} value={index}>{label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            <DialogActions sx={{ px: 0, pb: 0, pt: 3 }}>
              <Button onClick={() => setAvailabilityDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={availabilitySaving}>
                {availabilitySaving ? 'Saving...' : 'Save Timings'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DoctorsList;
