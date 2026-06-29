import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Button,
  Stack,
  Grid,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  Download,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { predictionService } from '../services/predictionService';
import { useTheme } from '@mui/material/styles';

const DoctorWorkload = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forecasts, setForecasts] = useState([]);
  const [refreshTime, setRefreshTime] = useState(new Date());

  const allowedRoles = ['Administrator', 'Doctor'];

  useEffect(() => {
    if (!allowedRoles.includes(user?.role)) {
      setError('Unauthorized: Only Admin or Doctor can view this');
      setLoading(false);
      return;
    }

    fetchForecasts();
  }, [user]);

  const fetchForecasts = async () => {
    try {
      setLoading(true);
      const data = await predictionService.getDoctorLoadForecasts({ limit: 50 });
      setForecasts(data.data || []);
      setRefreshTime(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load doctor load forecasts');
    } finally {
      setLoading(false);
    }
  };

  const getLoadStatus = (appointments) => {
    if (appointments < 5) return { label: 'Light', color: 'success', severity: 'low' };
    if (appointments < 10) return { label: 'Moderate', color: 'warning', severity: 'medium' };
    return { label: 'Heavy', color: 'error', severity: 'high' };
  };

  const getLoadPercentage = (appointments) => {
    return Math.min((appointments / 15) * 100, 100);
  };

  if (error && loading) {
    return <Alert severity="error">{error}</Alert>;
  }

  const highLoadCount = forecasts.filter(f => f.predicted_appointments >= 10).length;
  const avgLoad = forecasts.length
    ? (forecasts.reduce((sum, f) => sum + f.predicted_appointments, 0) / forecasts.length).toFixed(1)
    : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
        👨‍⚕️ Doctor Workload Forecast
      </Typography>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Predicts daily doctor schedules to optimize staffing and prevent overload
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Total Doctors
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {forecasts.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Avg Appointments
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {avgLoad}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                High Load Doctors
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                {highLoadCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Last Updated
              </Typography>
              <Typography variant="caption">
                {refreshTime.toLocaleTimeString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: theme.palette.grey[50] }}>
        <Stack direction="row" spacing={2}>
          <Button
            startIcon={<Refresh />}
            onClick={fetchForecasts}
            variant="outlined"
            size="small"
          >
            Refresh
          </Button>
          <Button
            startIcon={<Download />}
            variant="outlined"
            size="small"
          >
            Export
          </Button>
        </Stack>
      </Paper>

      {loading && !forecasts.length ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : forecasts.length === 0 ? (
        <Alert severity="info">No forecast data available</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: theme.palette.grey[100] }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Doctor ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Forecast Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Predicted Appointments</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Load Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Workload %</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Recommendation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {forecasts.map((forecast, idx) => {
                const status = getLoadStatus(forecast.predicted_appointments);
                const percentage = getLoadPercentage(forecast.predicted_appointments);

                return (
                  <TableRow key={idx} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {forecast.doctor_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(forecast.forecast_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {forecast.predicted_appointments}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{ flex: 1, height: 8, borderRadius: 1 }}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          {percentage.toFixed(0)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {forecast.recommendation}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Alert severity="info" sx={{ mt: 3 }}>
        💡 <strong>How to Use:</strong> Use these forecasts to distribute patient load evenly, 
        manage doctor schedules, and call in additional staff for high-demand days.
      </Alert>
    </Box>
  );
};

export default DoctorWorkload;
