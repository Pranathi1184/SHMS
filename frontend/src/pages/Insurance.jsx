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
import { insuranceService } from '../services/insuranceService';
import { readableId } from '../utils/formatters';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';

const Insurance = () => {
  const [insurances, setInsurances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [insuranceToDelete, setInsuranceToDelete] = useState(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrator';
  const isReceptionist = user?.role === 'Receptionist';
  const isBillingStaff = user?.role === 'Billing Staff';
  const canEdit = isAdmin || isReceptionist || isBillingStaff;
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    fetchInsurances();
  }, []);

  const fetchInsurances = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await insuranceService.getInsurance();
      setInsurances(data.data.insuranceRecords || []);
    } catch (err) {
      setError('Failed to fetch insurance records');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingInsurance(null);
    reset();
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (insurance) => {
    setEditingInsurance(insurance);
    reset({
      patientId: insurance.patientId,
      providerName: insurance.providerName || '',
      policyNumber: insurance.policyNumber || '',
      policyHolderName: insurance.policyHolderName || '',
      relationshipToPatient: insurance.relationshipToPatient || '',
      coverageStartDate: insurance.coverageStartDate || '',
      coverageEndDate: insurance.coverageEndDate || '',
      coverageDetails: insurance.coverageDetails || '',
    });
    setDialogOpen(true);
  };

  const handleSubmitInsurance = async (data) => {
    try {
      setError('');
      if (editingInsurance) {
        await insuranceService.updateInsurance(editingInsurance.id, data);
        setSuccess('Insurance updated successfully');
      } else {
        await insuranceService.createInsurance(data);
        setSuccess('Insurance created successfully');
      }
      setDialogOpen(false);
      fetchInsurances();
    } catch (err) {
      setError('Failed to save insurance');
    }
  };

  const handleDeleteClick = (insurance) => {
    setInsuranceToDelete(insurance);
    setDeleteDialogOpen(true);
  };

  const handleViewClick = (insurance) => {
    setSelectedInsurance(insurance);
    setViewDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setError('');
      await insuranceService.deleteInsurance(insuranceToDelete.id);
      setSuccess('Insurance deleted successfully');
      setDeleteDialogOpen(false);
      fetchInsurances();
    } catch (err) {
      setError('Failed to delete insurance');
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
          Insurance
        </Typography>
        {canEdit && (
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenAddDialog}>
            Add Insurance
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
              <TableCell>Provider</TableCell>
              <TableCell>Policy Number</TableCell>
              <TableCell>Coverage Start</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {insurances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No insurance records found
                </TableCell>
              </TableRow>
            ) : (
              insurances.map((insurance) => (
                <TableRow key={insurance.id} hover>
                  <TableCell>{readableId('insurance', insurance.id, insurance)}</TableCell>
                  <TableCell>
                    {insurance.patient
                      ? `${insurance.patient.firstName || ''} ${insurance.patient.lastName || ''}`.trim()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{insurance.providerName}</TableCell>
                  <TableCell>{insurance.policyNumber}</TableCell>
                  <TableCell>{insurance.coverageStartDate || 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton aria-label="view-insurance-details" color="primary" onClick={() => handleViewClick(insurance)}>
                      <Visibility />
                    </IconButton>
                    {canEdit && (
                      <IconButton
                        color="secondary"
                        onClick={() => handleOpenEditDialog(insurance)}
                      >
                        <Edit />
                      </IconButton>
                    )}
                    {isAdmin && (
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(insurance)}
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
          {editingInsurance ? 'Edit Insurance' : 'Add Insurance'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(handleSubmitInsurance)} sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              fullWidth
              label="Patient ID"
              placeholder="UUID"
              {...register('patientId', { required: 'Patient ID is required' })}
              error={!!errors.patientId}
              helperText={errors.patientId?.message}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Provider Name"
              {...register('providerName', { required: 'Provider name is required' })}
              error={!!errors.providerName}
              helperText={errors.providerName?.message}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Policy Number"
              {...register('policyNumber', { required: 'Policy number is required' })}
              error={!!errors.policyNumber}
              helperText={errors.policyNumber?.message}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Policy Holder Name"
              {...register('policyHolderName', { required: 'Policy holder name is required' })}
              error={!!errors.policyHolderName}
              helperText={errors.policyHolderName?.message}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Relationship To Patient"
              {...register('relationshipToPatient')}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Coverage Start Date"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              {...register('coverageStartDate', { required: 'Coverage start date is required' })}
              error={!!errors.coverageStartDate}
              helperText={errors.coverageStartDate?.message}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Coverage End Date"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              {...register('coverageEndDate')}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Coverage Details"
              multiline
              rows={3}
              {...register('coverageDetails')}
            />
            <DialogActions sx={{ mt: 2, px: 0 }}>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained">
                {editingInsurance ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Insurance</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this insurance record?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Insurance Details</DialogTitle>
        <DialogContent>
          <Typography><strong>Insurance ID:</strong> {selectedInsurance?.id || 'N/A'}</Typography>
          <Typography>
            <strong>Patient:</strong>{' '}
            {selectedInsurance?.patient
              ? `${selectedInsurance.patient.firstName || ''} ${selectedInsurance.patient.lastName || ''}`.trim()
              : 'N/A'}
          </Typography>
          <Typography><strong>Provider:</strong> {selectedInsurance?.providerName || 'N/A'}</Typography>
          <Typography><strong>Policy Number:</strong> {selectedInsurance?.policyNumber || 'N/A'}</Typography>
          <Typography><strong>Policy Holder:</strong> {selectedInsurance?.policyHolderName || 'N/A'}</Typography>
          <Typography><strong>Coverage Start:</strong> {selectedInsurance?.coverageStartDate || 'N/A'}</Typography>
          <Typography><strong>Coverage End:</strong> {selectedInsurance?.coverageEndDate || 'N/A'}</Typography>
          <Typography><strong>Coverage Details:</strong> {selectedInsurance?.coverageDetails || 'N/A'}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Insurance;

