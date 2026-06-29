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
import { laboratoryTestService } from '../services/laboratoryTestService';
import { readableId } from '../utils/formatters';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';

const Laboratory = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrator';
  const isDoctor = user?.role === 'Doctor';
  const isLabTech = user?.role === 'Lab Technician';
  const canCreate = isAdmin || isDoctor;
  const canEditResult = isAdmin || isLabTech;
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await laboratoryTestService.getLabTests();
      setTests(data.data.labTests || []);
    } catch (err) {
      setError('Failed to fetch lab tests');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingTest(null);
    reset();
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (test) => {
    setEditingTest(test);
    reset(test);
    setDialogOpen(true);
  };

  const handleSubmitTest = async (data) => {
    try {
      setError('');
      if (editingTest) {
        await laboratoryTestService.updateLabTest(editingTest.id, data);
        setSuccess('Lab test updated successfully');
      } else {
        await laboratoryTestService.createLabTest(data);
        setSuccess('Lab test created successfully');
      }
      setDialogOpen(false);
      fetchTests();
    } catch (err) {
      setError('Failed to save lab test');
    }
  };

  const handleDeleteClick = (test) => {
    setTestToDelete(test);
    setDeleteDialogOpen(true);
  };

  const handleViewClick = (test) => {
    setSelectedTest(test);
    setViewDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setError('');
      await laboratoryTestService.deleteLabTest(testToDelete.id);
      setSuccess('Lab test deleted successfully');
      setDeleteDialogOpen(false);
      fetchTests();
    } catch (err) {
      setError('Failed to delete lab test');
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
          Laboratory
        </Typography>
        {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenAddDialog}>
            Order Test
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
              <TableCell>Test Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ordered Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No lab tests found
                </TableCell>
              </TableRow>
            ) : (
              tests.map((test) => (
                <TableRow key={test.id} hover>
                  <TableCell>{readableId('laboratory', test.id, test)}</TableCell>
                  <TableCell>
                    {test.patient
                      ? `${test.patient.firstName || ''} ${test.patient.lastName || ''}`.trim()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{test.testName}</TableCell>
                  <TableCell>
                    <Box component="span" sx={{
                      px: 2, py: 1, borderRadius: 1,
                      bgcolor: test.status === 'Completed' ? 'success.light' :
                        test.status === 'Cancelled' ? 'error.light' : 'warning.light',
                      color: test.status === 'Completed' ? 'success.dark' :
                        test.status === 'Cancelled' ? 'error.dark' : 'warning.dark'
                    }}>
                      {test.status || 'Pending'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {test.orderDate ? new Date(test.orderDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleViewClick(test)}>
                      <Visibility />
                    </IconButton>
                    {canEditResult && test.status !== 'Completed' && test.status !== 'Cancelled' && (
                      <IconButton
                        color="secondary"
                        onClick={() => handleOpenEditDialog(test)}
                      >
                        <Edit />
                      </IconButton>
                    )}
                    {isAdmin && (
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(test)}
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
          {editingTest ? 'Update Lab Test' : 'Order Lab Test'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(handleSubmitTest)} sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              fullWidth
              label="Patient ID"
              placeholder="Patient UUID"
              disabled={!!editingTest}
              {...register('patientId', { required: 'Patient ID is required' })}
              error={!!errors.patientId}
              helperText={errors.patientId?.message}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Doctor ID"
              placeholder="Doctor UUID"
              disabled={!!editingTest}
              {...register('doctorId', { required: 'Doctor ID is required' })}
              error={!!errors.doctorId}
              helperText={errors.doctorId?.message}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Test Name"
              {...register('testName', { required: 'Test name is required' })}
              error={!!errors.testName}
              helperText={errors.testName?.message}
            />
            {canEditResult && (
              <TextField
                margin="normal"
                fullWidth
                label="Test Result"
                multiline
                rows={4}
                {...register('results')}
              />
            )}
            {canEditResult && (
              <TextField
                margin="normal"
                fullWidth
                select
                label="Status"
                {...register('status')}
              >
                <MenuItem value="Ordered">Ordered</MenuItem>
                <MenuItem value="Sample Collected">Sample Collected</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </TextField>
            )}
            <DialogActions sx={{ mt: 2, px: 0 }}>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained">
                {editingTest ? 'Update' : 'Order'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Lab Test</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this lab test?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Laboratory Test Details</DialogTitle>
        <DialogContent>
          <Typography><strong>Test ID:</strong> {selectedTest?.id || 'N/A'}</Typography>
          <Typography><strong>Test Name:</strong> {selectedTest?.testName || 'N/A'}</Typography>
          <Typography>
            <strong>Patient:</strong>{' '}
            {selectedTest?.patient
              ? `${selectedTest.patient.firstName || ''} ${selectedTest.patient.lastName || ''}`.trim()
              : 'N/A'}
          </Typography>
          <Typography><strong>Status:</strong> {selectedTest?.status || 'N/A'}</Typography>
          <Typography><strong>Order Date:</strong> {selectedTest?.orderDate ? new Date(selectedTest.orderDate).toLocaleString() : 'N/A'}</Typography>
          <Typography><strong>Result:</strong> {selectedTest?.results ? JSON.stringify(selectedTest.results) : 'N/A'}</Typography>
          <Typography><strong>Notes:</strong> {selectedTest?.notes || 'N/A'}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Laboratory;

