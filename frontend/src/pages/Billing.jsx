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
import { billService } from '../services/billService';
import { patientService } from '../services/patientService';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { readableId } from '../utils/formatters';

const Billing = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);
  const [patientOptions, setPatientOptions] = useState([]);
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
    fetchBills();
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await patientService.getAllPatients({ page: 1, limit: 200 });
      setPatientOptions(response?.data?.patients || []);
    } catch (err) {
      setPatientOptions([]);
    }
  };

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await billService.getBills();
      setBills(data.data.bills || []);
    } catch (err) {
      setError('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingBill(null);
    reset();
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (bill) => {
    setEditingBill(bill);
    reset({
      patientId: bill.patientId,
      billNumber: bill.billNumber,
      totalAmount: bill.totalAmount,
      billDate: bill.billDate ? new Date(bill.billDate).toISOString().split('T')[0] : '',
      paymentStatus: bill.paymentStatus || 'Pending',
      paymentMode: bill.paymentMode || 'Cash',
      notes: bill.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmitBill = async (data) => {
    try {
      setError('');
      const payload = {
        patientId: data.patientId,
        billNumber: data.billNumber,
        totalAmount: Number(data.totalAmount),
        billDate: data.billDate,
        paymentStatus: data.paymentStatus,
        paymentMode: data.paymentMode,
        notes: data.notes,
      };

      if (editingBill) {
        await billService.updateBill(editingBill.id, payload);
        setSuccess('Bill updated successfully');
      } else {
        await billService.createBill({
          ...payload,
          items: [
            {
              description: data.itemDescription,
              quantity: Number(data.itemQuantity),
              unitPrice: Number(data.itemUnitPrice),
            },
          ],
        });
        setSuccess('Bill created successfully');
      }
      setDialogOpen(false);
      fetchBills();
    } catch (err) {
      setError('Failed to save bill');
    }
  };

  const handleDeleteClick = (bill) => {
    setBillToDelete(bill);
    setDeleteDialogOpen(true);
  };

  const handleViewClick = (bill) => {
    setSelectedBill(bill);
    setViewDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setError('');
      await billService.deleteBill(billToDelete.id);
      setSuccess('Bill deleted successfully');
      setDeleteDialogOpen(false);
      fetchBills();
    } catch (err) {
      setError('Failed to delete bill');
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
          Billing
        </Typography>
        {canEdit && (
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenAddDialog}>
            Create Bill
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
              <TableCell>Amount</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No bills found
                </TableCell>
              </TableRow>
            ) : (
              bills.map((bill) => (
                <TableRow key={bill.id} hover>
                  <TableCell>{readableId('bill', bill.id, bill)}</TableCell>
                  <TableCell>
                    {bill.patient
                      ? `${bill.patient.firstName || ''} ${bill.patient.lastName || ''}`.trim()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>${Number(bill.totalAmount || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    {bill.billDate ? new Date(bill.billDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Box component="span" sx={{
                      px: 2, py: 1, borderRadius: 1,
                      bgcolor: bill.paymentStatus === 'Paid' ? 'success.light' :
                        bill.paymentStatus === 'Cancelled' ? 'error.light' : 'warning.light',
                      color: bill.paymentStatus === 'Paid' ? 'success.dark' :
                        bill.paymentStatus === 'Cancelled' ? 'error.dark' : 'warning.dark'
                    }}>
                      {bill.paymentStatus || 'Pending'}
                    </Box>
                  </TableCell>
                  <TableCell>{bill.paymentMode || 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton aria-label="view-bill-details" color="primary" onClick={() => handleViewClick(bill)}>
                      <Visibility />
                    </IconButton>
                    {canEdit && bill.paymentStatus !== 'Paid' && (
                      <IconButton
                        color="secondary"
                        onClick={() => handleOpenEditDialog(bill)}
                      >
                        <Edit />
                      </IconButton>
                    )}
                    {isAdmin && (
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(bill)}
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
          {editingBill ? 'Edit Bill' : 'Create Bill'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(handleSubmitBill)} sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              fullWidth
              label="Patient"
              select
              defaultValue=""
              {...register('patientId', { required: 'Patient ID is required' })}
              error={!!errors.patientId}
              helperText={errors.patientId?.message || 'Select patient'}
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
              label="Bill Number"
              disabled={!!editingBill}
              {...register('billNumber', { required: 'Bill number is required' })}
              error={!!errors.billNumber}
              helperText={errors.billNumber?.message}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Total Amount"
              type="number"
              step="0.01"
              {...register('totalAmount', { required: 'Total amount is required' })}
              error={!!errors.totalAmount}
              helperText={errors.totalAmount?.message}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Bill Date"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              {...register('billDate', { required: 'Bill date is required' })}
              error={!!errors.billDate}
              helperText={errors.billDate?.message}
            />
            <TextField
              margin="normal"
              fullWidth
              select
              label="Payment Status"
              {...register('paymentStatus')}
            >
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Partially Paid">Partially Paid</MenuItem>
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </TextField>
            <TextField
              margin="normal"
              fullWidth
              select
              label="Payment Mode"
              {...register('paymentMode')}
            >
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Card">Card</MenuItem>
              <MenuItem value="UPI">UPI</MenuItem>
              <MenuItem value="Insurance">Insurance</MenuItem>
              <MenuItem value="Net Banking">Net Banking</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>

            {!editingBill && (
              <>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Item Description"
                  {...register('itemDescription', { required: 'Item description is required' })}
                  error={!!errors.itemDescription}
                  helperText={errors.itemDescription?.message}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label="Item Quantity"
                  type="number"
                  {...register('itemQuantity', { required: 'Item quantity is required' })}
                  error={!!errors.itemQuantity}
                  helperText={errors.itemQuantity?.message}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label="Item Unit Price"
                  type="number"
                  step="0.01"
                  {...register('itemUnitPrice', { required: 'Item unit price is required' })}
                  error={!!errors.itemUnitPrice}
                  helperText={errors.itemUnitPrice?.message}
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
                {editingBill ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Bill</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this bill?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bill Details</DialogTitle>
        <DialogContent>
          <Typography><strong>Bill ID:</strong> {selectedBill?.id || 'N/A'}</Typography>
          <Typography><strong>Bill Number:</strong> {selectedBill?.billNumber || 'N/A'}</Typography>
          <Typography>
            <strong>Patient:</strong>{' '}
            {selectedBill?.patient
              ? `${selectedBill.patient.firstName || ''} ${selectedBill.patient.lastName || ''}`.trim()
              : 'N/A'}
          </Typography>
          <Typography><strong>Total Amount:</strong> ${Number(selectedBill?.totalAmount || 0).toFixed(2)}</Typography>
          <Typography><strong>Payment Status:</strong> {selectedBill?.paymentStatus || 'N/A'}</Typography>
          <Typography><strong>Payment Mode:</strong> {selectedBill?.paymentMode || 'N/A'}</Typography>
          <Typography><strong>Date:</strong> {selectedBill?.billDate ? new Date(selectedBill.billDate).toLocaleDateString() : 'N/A'}</Typography>
          <Typography><strong>Notes:</strong> {selectedBill?.notes || 'N/A'}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Billing;

