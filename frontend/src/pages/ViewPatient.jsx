import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Email,
  Phone,
  Home,
  Cake,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { patientService } from '../services/patientService';
import { readableId } from '../utils/formatters';

const ViewPatient = () => {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    try {
      const data = await patientService.getPatientById(id);
      setPatient(data.data);
    } catch (err) {
      setError('Failed to fetch patient');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/patients')} sx={{ mr: 2 }}>
          Back
        </Button>
        <Typography variant="h4" fontWeight="bold">
          Patient Details
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
          <Avatar sx={{ width: 100, height: 100, bgcolor: 'primary.main', fontSize: 40 }}>
            {patient?.firstName?.charAt(0)}{patient?.lastName?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {patient?.firstName} {patient?.lastName}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Patient ID: {readableId('patient', patient?.id, patient)}
            </Typography>
            <Chip label="Active" color="success" sx={{ mt: 1 }} />
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => navigate(`/patients/${id}/edit`)}
            >
              Edit Patient
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Personal Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Email />
                <Typography>{patient?.email}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Phone />
                <Typography>{patient?.phone}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Cake />
                <Typography>{patient?.dateOfBirth}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography fontWeight="bold">Gender:</Typography>
                <Typography>{patient?.gender}</Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Address
              </Typography>
              <Typography>{patient?.address || 'Not provided'}</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Medical History
              </Typography>
              <Typography>{patient?.medicalHistory || 'No medical history recorded'}</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ViewPatient;

