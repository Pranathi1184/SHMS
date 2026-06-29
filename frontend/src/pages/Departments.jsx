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
} from '@mui/icons-material';
import { departmentService } from '../services/departmentService';
import { readableId } from '../utils/formatters';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrator';
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await departmentService.getDepartments();
      setDepartments(data.data.departments || []);
    } catch (err) {
      setError('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingDept(null);
    reset();
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (dept) => {
    setEditingDept(dept);
    reset(dept);
    setDialogOpen(true);
  };

  const handleSubmitDept = async (data) => {
    try {
      setError('');
      if (editingDept) {
        await departmentService.updateDepartment(editingDept.id, data);
        setSuccess('Department updated successfully');
      } else {
        await departmentService.createDepartment(data);
        setSuccess('Department created successfully');
      }
      setDialogOpen(false);
      fetchDepartments();
    } catch (err) {
      setError('Failed to save department');
    }
  };

  const handleDeleteClick = (dept) => {
    setDeptToDelete(dept);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setError('');
      await departmentService.deleteDepartment(deptToDelete.id);
      setSuccess('Department deleted successfully');
      setDeleteDialogOpen(false);
      fetchDepartments();
    } catch (err) {
      setError('Failed to delete department');
    }
  };

  if (!isAdmin) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        You are not authorized to access this page.
      </Alert>
    );
  }

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
          Departments
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAddDialog}>
          Add Department
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No departments found
                </TableCell>
              </TableRow>
            ) : (
              departments.map((dept) => (
                <TableRow key={dept.id} hover>
                  <TableCell>{readableId('department', dept.id, dept)}</TableCell>
                  <TableCell>{dept.name}</TableCell>
                  <TableCell>{dept.description || 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton
                      color="secondary"
                      onClick={() => handleOpenEditDialog(dept)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteClick(dept)}
                    >
                      <Delete />
                    </IconButton>
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
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingDept ? 'Edit Department' : 'Add Department'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(handleSubmitDept)} sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              fullWidth
              label="Department Name"
              {...register('name', { required: 'Name is required' })}
              error={!!errors.name}
              helperText={errors.name?.message}
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
                {editingDept ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Department</DialogTitle>
        <DialogContent>
          Are you sure you want to delete {deptToDelete?.name}?
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

export default Departments;

