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
  Tab,
  Tabs,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { departmentService } from '../services/departmentService';
import { doctorService } from '../services/doctorService';
import { patientService } from '../services/patientService';
import { wardManagementService } from '../services/wardManagementService';
import { Controller, useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { readableId } from '../utils/formatters';

const WardManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [data, setData] = useState({ wards: [], beds: [], admissions: [] });
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [wardOptions, setWardOptions] = useState([]);
  const [bedOptions, setBedOptions] = useState([]);
  const [patientOptions, setPatientOptions] = useState([]);
  const [doctorOptions, setDoctorOptions] = useState([]);
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrator';
  const isReceptionist = user?.role === 'Receptionist';
  const isNurse = user?.role === 'Nurse';
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    fetchData();
    loadReferenceData();
  }, [activeTab]);

  const loadReferenceData = async () => {
    try {
      const [departmentsResponse, wardsResponse, bedsResponse, patientsResponse, doctorsResponse] = await Promise.all([
        departmentService.getDepartments({ page: 1, limit: 200 }),
        wardManagementService.getWards({ page: 1, limit: 200 }),
        wardManagementService.getBeds({ page: 1, limit: 200 }),
        patientService.getAllPatients({ page: 1, limit: 200 }),
        doctorService.getDoctors({ page: 1, limit: 100 }),
      ]);

      setDepartmentOptions(departmentsResponse?.data?.departments || []);
      setWardOptions(wardsResponse?.data?.wards || []);
      setBedOptions(bedsResponse?.data?.beds || []);
      setPatientOptions(patientsResponse?.data?.patients || []);
      setDoctorOptions(doctorsResponse?.data?.doctors || []);
    } catch (err) {
      setDepartmentOptions([]);
      setWardOptions([]);
      setBedOptions([]);
      setPatientOptions([]);
      setDoctorOptions([]);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      if (activeTab === 0) {
        const wardData = await wardManagementService.getWards();
        setData(prev => ({ ...prev, wards: wardData.data.wards || [] }));
      } else if (activeTab === 1) {
        const bedData = await wardManagementService.getBeds();
        setData(prev => ({ ...prev, beds: bedData.data.beds || [] }));
      } else {
        const admissionData = await wardManagementService.getAdmissions();
        setData(prev => ({ ...prev, admissions: admissionData.data.admissions || [] }));
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingItem(null);
    reset({ status: activeTab === 1 ? 'Available' : undefined });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (item) => {
    setEditingItem(item);
    if (activeTab === 0) {
      reset({
        name: item.name || '',
        departmentId: item.departmentId || '',
        type: item.type || 'General',
        description: item.description || '',
      });
    } else if (activeTab === 1) {
      reset({
        wardId: item.wardId || '',
        bedNumber: item.bedNumber || '',
        status: item.status || 'Available',
        pricePerDay: item.pricePerDay || 0,
      });
    } else {
      reset({
        patientId: item.patientId || '',
        doctorId: item.doctorId || '',
        bedId: item.bedId || '',
        reasonForAdmission: item.reasonForAdmission || '',
        notes: item.notes || '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmitItem = async (formData) => {
    try {
      setError('');
      if (activeTab === 0) {
        if (editingItem) {
          await wardManagementService.updateWard(editingItem.id, formData);
          setSuccess('Ward updated successfully');
        } else {
          await wardManagementService.createWard(formData);
          setSuccess('Ward created successfully');
        }
      } else if (activeTab === 1) {
        if (editingItem) {
          await wardManagementService.updateBed(editingItem.id, formData);
          setSuccess('Bed updated successfully');
        } else {
          await wardManagementService.createBed(formData);
          setSuccess('Bed created successfully');
        }
      } else {
        if (editingItem) {
          await wardManagementService.updateAdmission(editingItem.id, formData);
          setSuccess('Admission updated successfully');
        } else {
          await wardManagementService.createAdmission(formData);
          setSuccess('Admission created successfully');
        }
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      setError('Failed to save item');
    }
  };

  const handleDischarge = async (id) => {
    try {
      setError('');
      await wardManagementService.dischargePatient(id);
      setSuccess('Patient discharged successfully');
      fetchData();
    } catch (err) {
      setError('Failed to discharge patient');
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setError('');
      if (activeTab === 0) {
        await wardManagementService.deleteWard(itemToDelete.id);
        setSuccess('Ward deleted successfully');
      } else if (activeTab === 1) {
        await wardManagementService.deleteBed(itemToDelete.id);
        setSuccess('Bed deleted successfully');
      } else {
        await wardManagementService.deleteAdmission(itemToDelete.id);
        setSuccess('Admission deleted successfully');
      }
      setDeleteDialogOpen(false);
      fetchData();
    } catch (err) {
      setError('Failed to delete item');
    }
  };

  const departmentLabel = (department) => (department ? department.name || '' : '');
  const wardLabel = (ward) => {
    if (!ward) return '';
    return `${ward.name || 'Ward'} | ${ward.type || 'General'}`;
  };
  const bedLabel = (bed) => {
    if (!bed) return '';
    const wardName = bed.ward?.name || 'No ward';
    return `${bed.bedNumber || readableId('bed', bed.id, bed)} | ${wardName} | ${bed.status || 'Unknown'}`;
  };
  const patientLabel = (patient) => (patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : '');
  const doctorLabel = (doctor) => {
    if (!doctor) return '';
    const name = `${doctor.user?.firstName || ''} ${doctor.user?.lastName || ''}`.trim();
    return `${name} | ${doctor.specialization || 'General'} | ${doctor.department?.name || 'No department'}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const renderTable = () => {
    if (activeTab === 0) {
      return (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.wards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">No wards found</TableCell>
                </TableRow>
              ) : (
                data.wards.map(ward => (
                  <TableRow key={ward.id} hover>
                    <TableCell>{readableId('ward', ward.id, ward)}</TableCell>
                    <TableCell>{ward.name}</TableCell>
                    <TableCell>{ward.type}</TableCell>
                    <TableCell>
                      {isAdmin && (
                        <IconButton color="secondary" onClick={() => handleOpenEditDialog(ward)}>
                          <Edit />
                        </IconButton>
                      )}
                      {isAdmin && (
                        <IconButton color="error" onClick={() => handleDeleteClick(ward)}>
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
      );
    } else if (activeTab === 1) {
      return (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Number</TableCell>
                <TableCell>Ward</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.beds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">No beds found</TableCell>
                </TableRow>
              ) : (
                data.beds.map(bed => (
                  <TableRow key={bed.id} hover>
                    <TableCell>{readableId('bed', bed.id, bed)}</TableCell>
                    <TableCell>{bed.bedNumber}</TableCell>
                    <TableCell>{bed.ward?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Box component="span" sx={{
                        px: 2, py: 1, borderRadius: 1,
                        bgcolor: bed.status === 'Available' ? 'success.light' : 'error.light',
                        color: bed.status === 'Available' ? 'success.dark' : 'error.dark'
                      }}>
                        {bed.status || 'Occupied'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {(isAdmin || isNurse || isReceptionist) && (
                        <IconButton color="secondary" onClick={() => handleOpenEditDialog(bed)}>
                          <Edit />
                        </IconButton>
                      )}
                      {isAdmin && (
                        <IconButton color="error" onClick={() => handleDeleteClick(bed)}>
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
      );
    } else {
      return (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Bed</TableCell>
                <TableCell>Admission Date</TableCell>
                <TableCell>Discharge Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.admissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">No admissions found</TableCell>
                </TableRow>
              ) : (
                data.admissions.map(admission => (
                  <TableRow key={admission.id} hover>
                    <TableCell>{readableId('admission', admission.id, admission)}</TableCell>
                    <TableCell>
                      {admission.patient
                        ? `${admission.patient.firstName || ''} ${admission.patient.lastName || ''}`.trim()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{admission.bed?.bedNumber || 'N/A'}</TableCell>
                    <TableCell>
                      {admission.admissionDate ? new Date(admission.admissionDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {admission.dischargeDate ? new Date(admission.dischargeDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box component="span" sx={{
                        px: 2, py: 1, borderRadius: 1,
                        bgcolor: admission.status === 'Admitted' ? 'success.light' : 'info.light',
                        color: admission.status === 'Admitted' ? 'success.dark' : 'info.dark'
                      }}>
                        {admission.status || 'Admitted'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton color="primary">
                        <Visibility />
                      </IconButton>
                      {(isAdmin || isNurse || isReceptionist) && admission.status === 'Admitted' && (
                        <IconButton color="secondary" onClick={() => handleOpenEditDialog(admission)}>
                          <Edit />
                        </IconButton>
                      )}
                      {(isAdmin || isNurse || isReceptionist) && admission.status === 'Admitted' && (
                        <Button size="small" variant="contained" color="warning" onClick={() => handleDischarge(admission.id)}>
                          Discharge
                        </Button>
                      )}
                      {isAdmin && (
                        <IconButton color="error" onClick={() => handleDeleteClick(admission)}>
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
      );
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Ward Management
        </Typography>
        {((activeTab === 0 && isAdmin) ||
          (activeTab === 1 && (isAdmin || isNurse || isReceptionist)) ||
          (activeTab === 2 && (isAdmin || isNurse || isReceptionist))) && (
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenAddDialog}>
            {activeTab === 0 ? 'Add Ward' : activeTab === 1 ? 'Add Bed' : 'Admit Patient'}
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

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="Wards" />
        <Tab label="Beds" />
        <Tab label="Admissions" />
      </Tabs>

      {renderTable()}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? 'Edit' : 'Add New'}{' '}
          {activeTab === 0 ? 'Ward' : activeTab === 1 ? 'Bed' : 'Admission'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(handleSubmitItem)} sx={{ mt: 2 }}>
            {activeTab === 0 && (
              <>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Name"
                  {...register('name', { required: 'Name is required' })}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
                <Controller
                  name="departmentId"
                  control={control}
                  rules={{ required: 'Department is required' }}
                  render={({ field }) => (
                    <Autocomplete
                      options={departmentOptions}
                      getOptionLabel={departmentLabel}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      value={departmentOptions.find((department) => department.id === field.value) || null}
                      onChange={(_, value) => field.onChange(value?.id || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          margin="normal"
                          fullWidth
                          label="Department"
                          error={!!errors.departmentId}
                          helperText={errors.departmentId?.message}
                        />
                      )}
                    />
                  )}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  select
                  label="Type"
                  {...register('type', { required: 'Type is required' })}
                  error={!!errors.type}
                  helperText={errors.type?.message}
                >
                  <MenuItem value="General">General</MenuItem>
                  <MenuItem value="Private">Private</MenuItem>
                  <MenuItem value="Semi-Private">Semi-Private</MenuItem>
                  <MenuItem value="ICU">ICU</MenuItem>
                  <MenuItem value="Emergency">Emergency</MenuItem>
                </TextField>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  {...register('description')}
                />
              </>
            )}

            {activeTab === 1 && (
              <>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Bed Number"
                  {...register('bedNumber', { required: 'Bed number is required' })}
                  error={!!errors.bedNumber}
                  helperText={errors.bedNumber?.message}
                />
                <Controller
                  name="wardId"
                  control={control}
                  rules={{ required: 'Ward is required' }}
                  render={({ field }) => (
                    <Autocomplete
                      options={wardOptions}
                      getOptionLabel={wardLabel}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      value={wardOptions.find((ward) => ward.id === field.value) || null}
                      onChange={(_, value) => field.onChange(value?.id || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          margin="normal"
                          fullWidth
                          label="Ward"
                          error={!!errors.wardId}
                          helperText={errors.wardId?.message}
                        />
                      )}
                    />
                  )}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label="Price Per Day"
                  type="number"
                  step="0.01"
                  {...register('pricePerDay', { required: 'Price per day is required' })}
                  error={!!errors.pricePerDay}
                  helperText={errors.pricePerDay?.message}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  select
                  label="Status"
                  {...register('status')}
                >
                  <MenuItem value="Available">Available</MenuItem>
                  <MenuItem value="Occupied">Occupied</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="Cleaning">Cleaning</MenuItem>
                </TextField>
              </>
            )}

            {activeTab === 2 && (
              <>
                <Controller
                  name="patientId"
                  control={control}
                  rules={{ required: 'Patient is required' }}
                  render={({ field }) => (
                    <Autocomplete
                      options={patientOptions}
                      disabled={!!editingItem}
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
                  name="bedId"
                  control={control}
                  rules={{ required: 'Bed is required' }}
                  render={({ field }) => (
                    <Autocomplete
                      options={bedOptions}
                      getOptionLabel={bedLabel}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      value={bedOptions.find((bed) => bed.id === field.value) || null}
                      onChange={(_, value) => field.onChange(value?.id || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          margin="normal"
                          fullWidth
                          label="Bed"
                          error={!!errors.bedId}
                          helperText={errors.bedId?.message}
                        />
                      )}
                    />
                  )}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label="Reason For Admission"
                  {...register('reasonForAdmission', { required: 'Reason for admission is required' })}
                  error={!!errors.reasonForAdmission}
                  helperText={errors.reasonForAdmission?.message}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  {...register('notes')}
                />
              </>
            )}

            <DialogActions sx={{ mt: 2, px: 0 }}>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained">
                {editingItem ? 'Update' : 'Save'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete {activeTab === 0 ? 'Ward' : activeTab === 1 ? 'Bed' : 'Admission'}</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this {activeTab === 0 ? 'ward' : activeTab === 1 ? 'bed' : 'admission'}?
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

export default WardManagement;

