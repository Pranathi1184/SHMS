import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { appointmentService } from '../services/appointmentService';
import { readableId } from '../utils/formatters';

const getPatientName = (appointment) => {
  const patient = appointment?.patient;
  if (!patient) return 'N/A';
  return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'N/A';
};

const getDoctorName = (appointment) => {
  const doctorUser = appointment?.doctor?.user;
  if (doctorUser) {
    return `${doctorUser.firstName || ''} ${doctorUser.lastName || ''}`.trim() || 'N/A';
  }
  return 'N/A';
};

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await appointmentService.getAppointmentById(id);
        setAppointment(data.data || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load appointment details');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/appointments')} sx={{ mb: 2 }}>
          Back to Appointments
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/appointments')} sx={{ mb: 2 }}>
        Back to Appointments
      </Button>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight="bold" mb={3}>
          Appointment Details
        </Typography>

        <Stack spacing={1.5}>
          <Typography><strong>ID:</strong> {readableId('appointment', appointment?.id, appointment)}</Typography>
          <Typography><strong>Patient:</strong> {getPatientName(appointment)}</Typography>
          <Typography><strong>Doctor:</strong> {getDoctorName(appointment)}</Typography>
          <Typography>
            <strong>Date:</strong>{' '}
            {appointment?.appointmentDate
              ? new Date(appointment.appointmentDate).toLocaleDateString()
              : 'N/A'}
          </Typography>
          <Typography><strong>Start Time:</strong> {appointment?.startTime || 'N/A'}</Typography>
          <Typography><strong>End Time:</strong> {appointment?.endTime || 'N/A'}</Typography>
          <Typography><strong>Status:</strong> {appointment?.status || 'N/A'}</Typography>
          <Typography><strong>Notes:</strong> {appointment?.notes || 'N/A'}</Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default AppointmentDetails;

