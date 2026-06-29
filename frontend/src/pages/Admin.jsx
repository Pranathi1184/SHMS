import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';

const quickLinks = [
  { label: 'Doctors Directory', path: '/doctors' },
  { label: 'Wards Overview', path: '/wards' },
  { label: 'EHR Registry', path: '/ehr-list' },
  { label: 'Appointments + AI', path: '/appointments' },
  { label: 'Dashboard Reports', path: '/dashboard' },
  { label: 'Add Patient', path: '/patients/add' },
];

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState({
    totalPatients: 0,
    lowStockCount: 0,
    occupancyRate: 0,
  });

  const quickActions = [
    { label: 'Open Doctors', description: 'Search departments and manage the doctor roster.', path: '/doctors' },
    { label: 'Manage Patients', description: 'Create or update patient records from one place.', path: '/patients' },
    { label: 'Handle Appointments', description: 'Use appointment booking with embedded AI helpers.', path: '/appointments' },
    { label: 'Review Reports', description: 'Check filtered dashboards and operational trends.', path: '/dashboard' },
  ];

  useEffect(() => {
    const fetchAdminMetrics = async () => {
      try {
        setLoading(true);
        setError('');
        const [patients, inventory, occupancy] = await Promise.allSettled([
          reportService.getPatientStats(),
          reportService.getInventoryAlerts(),
          reportService.getOccupancyStats(),
        ]);

        setMetrics({
          totalPatients: patients.status === 'fulfilled' ? patients.value.data.totalPatients || 0 : 0,
          lowStockCount: inventory.status === 'fulfilled' ? inventory.value.data.lowStockCount || 0 : 0,
          occupancyRate: occupancy.status === 'fulfilled' ? Number(occupancy.value.data.occupancyRate || 0).toFixed(2) : 0,
        });
      } catch (err) {
        setError('Failed to load admin metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminMetrics();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #0f766e 0%, #0ea5a4 100%)', color: 'white' }}>
        <Typography variant="h4" fontWeight="bold" mb={1}>
          Admin Operations Hub
        </Typography>
        <Typography sx={{ opacity: 0.92 }}>
          Governance, cross-module visibility, and operational shortcuts in one place.
        </Typography>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary">Total Patients</Typography>
              <Typography variant="h4" fontWeight="bold">{metrics.totalPatients}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary">Low Stock Medicines</Typography>
              <Typography variant="h4" fontWeight="bold">{metrics.lowStockCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary">Occupancy Rate</Typography>
              <Typography variant="h4" fontWeight="bold">{metrics.occupancyRate}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={3}>
        {quickActions.map((action) => (
          <Grid key={action.path} size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={1}>
                  {action.label}
                </Typography>
                <Typography color="text.secondary" mb={2}>
                  {action.description}
                </Typography>
                <Button variant="outlined" onClick={() => navigate(action.path)}>
                  Open
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>Quick Access</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ flexWrap: 'wrap' }}>
          {quickLinks.map((link) => (
            <Button key={link.path} variant="contained" onClick={() => navigate(link.path)}>
              {link.label}
            </Button>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
};

export default Admin;

