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
  MenuItem,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { medicineService } from '../services/medicineService';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { readableId } from '../utils/formatters';

const Pharmacy = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [viewingMed, setViewingMed] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [medToDelete, setMedToDelete] = useState(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrator';
  const isPharmacist = user?.role === 'Pharmacist';
  const canEdit = isAdmin || isPharmacist;
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await medicineService.getMedicines();
      setMedicines(data.data.medicines || []);
    } catch (err) {
      setError('Failed to fetch medicines');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingMed(null);
    reset();
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (med) => {
    setEditingMed(med);
    reset(med);
    setDialogOpen(true);
  };

  const handleSubmitMed = async (data) => {
    try {
      setError('');
      if (editingMed) {
        await medicineService.updateMedicine(editingMed.id, data);
        setSuccess('Medicine updated successfully');
      } else {
        await medicineService.createMedicine(data);
        setSuccess('Medicine created successfully');
      }
      setDialogOpen(false);
      fetchMedicines();
    } catch (err) {
      setError('Failed to save medicine');
    }
  };

  const handleDeleteClick = (med) => {
    setMedToDelete(med);
    setDeleteDialogOpen(true);
  };

  const handleViewClick = (med) => {
    setViewingMed(med);
    setViewDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setError('');
      await medicineService.deleteMedicine(medToDelete.id);
      setSuccess('Medicine deleted successfully');
      setDeleteDialogOpen(false);
      fetchMedicines();
    } catch (err) {
      setError('Failed to delete medicine');
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
          Pharmacy
        </Typography>
        {canEdit && (
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenAddDialog}>
            Add Medicine
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
              <TableCell>Name</TableCell>
              <TableCell>Generic Name</TableCell>
              <TableCell>Dosage</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Expiry Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {medicines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No medicines found
                </TableCell>
              </TableRow>
            ) : (
              medicines.map((med) => (
                <TableRow key={med.id} hover>
                  <TableCell>{readableId('med', med.id, med)}</TableCell>
                  <TableCell>{med.name}</TableCell>
                  <TableCell>{med.genericName || 'N/A'}</TableCell>
                  <TableCell>{[med.dosageForm, med.strength].filter(Boolean).join(' ') || 'N/A'}</TableCell>
                  <TableCell>{med.quantity || 0}</TableCell>
                  <TableCell>
                    {med.expiryDate ? new Date(med.expiryDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Box component="span" sx={{
                      px: 2, py: 1, borderRadius: 1,
                      bgcolor: med.quantity > 10 ? 'success.light' : 'warning.light',
                      color: med.quantity > 10 ? 'success.dark' : 'warning.dark'
                    }}>
                      {med.quantity > 10 ? 'In Stock' : 'Low Stock'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleViewClick(med)}>
                      <Visibility />
                    </IconButton>
                    {canEdit && (
                      <IconButton
                        color="secondary"
                        onClick={() => handleOpenEditDialog(med)}
                      >
                        <Edit />
                      </IconButton>
                    )}
                    {isAdmin && (
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(med)}
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
          {editingMed ? 'Edit Medicine' : 'Add Medicine'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(handleSubmitMed)} sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              fullWidth
              label="Medicine Name"
              {...register('name', { required: 'Name is required' })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Generic Name"
              {...register('genericName')}
            />
            <TextField
              margin="normal"
              fullWidth
              select
              label="Dosage Form"
              defaultValue={editingMed?.dosageForm || 'Tablet'}
              {...register('dosageForm', { required: 'Dosage form is required' })}
              error={!!errors.dosageForm}
              helperText={errors.dosageForm?.message}
            >
              <MenuItem value="Tablet">Tablet</MenuItem>
              <MenuItem value="Capsule">Capsule</MenuItem>
              <MenuItem value="Syrup">Syrup</MenuItem>
              <MenuItem value="Injection">Injection</MenuItem>
              <MenuItem value="Ointment">Ointment</MenuItem>
              <MenuItem value="Cream">Cream</MenuItem>
              <MenuItem value="Drops">Drops</MenuItem>
              <MenuItem value="Inhaler">Inhaler</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
            <TextField
              margin="normal"
              fullWidth
              label="Strength"
              {...register('strength', { required: 'Strength is required' })}
              error={!!errors.strength}
              helperText={errors.strength?.message}
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
              label="Unit Price"
              type="number"
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              {...register('unitPrice', { required: 'Unit price is required' })}
              error={!!errors.unitPrice}
              helperText={errors.unitPrice?.message}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Reorder Level"
              type="number"
              slotProps={{ htmlInput: { min: 0 } }}
              {...register('reorderLevel')}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Expiry Date"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              {...register('expiryDate', { required: 'Expiry date is required' })}
              error={!!errors.expiryDate}
              helperText={errors.expiryDate?.message}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Description"
              multiline
              rows={3}
              {...register('description')}
            />
            <DialogActions sx={{ mt: 2, px: 0 }}>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained">
                {editingMed ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Medicine Details</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}><strong>ID:</strong> {readableId('med', viewingMed?.id, viewingMed)}</Typography>
          <Typography sx={{ mb: 1 }}><strong>Name:</strong> {viewingMed?.name || 'N/A'}</Typography>
          <Typography sx={{ mb: 1 }}><strong>Generic Name:</strong> {viewingMed?.genericName || 'N/A'}</Typography>
          <Typography sx={{ mb: 1 }}><strong>Dosage:</strong> {[viewingMed?.dosageForm, viewingMed?.strength].filter(Boolean).join(' ') || 'N/A'}</Typography>
          <Typography sx={{ mb: 1 }}><strong>Quantity:</strong> {viewingMed?.quantity ?? 0}</Typography>
          <Typography sx={{ mb: 1 }}><strong>Reorder Level:</strong> {viewingMed?.reorderLevel ?? 'N/A'}</Typography>
          <Typography sx={{ mb: 1 }}><strong>Expiry Date:</strong> {viewingMed?.expiryDate ? new Date(viewingMed.expiryDate).toLocaleDateString() : 'N/A'}</Typography>
          <Typography sx={{ mb: 1 }}><strong>Description:</strong> {viewingMed?.description || 'N/A'}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Medicine</DialogTitle>
        <DialogContent>
          Are you sure you want to delete {medToDelete?.name}?
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

export default Pharmacy;

