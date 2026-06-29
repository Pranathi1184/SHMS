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
  LocalHospital,
  Refresh,
  Download,
  WarningAmber,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { predictionService } from '../services/predictionService';
import { useTheme } from '@mui/material/styles';

const BedOccupancy = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forecasts, setForecasts] = useState([]);
  const [refreshTime, setRefreshTime] = useState(new Date());

  const allowedRoles = ['Administrator', 'Nurse'];

  useEffect(() => {
    if (!allowedRoles.includes(user?.role)) {
      setError('Unauthorized: Only Admin or Nurse can view this');
      setLoading(false);
      return;
    }

    fetchForecasts();
  }, [user]);

  const fetchForecasts = async () => {
    try {
      setLoading(true);
      const data = await predictionService.getBedOccupancyForecasts({ limit: 50 });
      setForecasts(data.data || []);
      setRefreshTime(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load bed occupancy forecasts');
    } finally {
      setLoading(false);
    }
  };

  const getOccupancyStatus = (rate) => {
    if (rate >= 90) return { label: 'Critical', color: 'error', severity: 'critical' };
    if (rate >= 75) return { label: 'High', color: 'warning', severity: 'high' };
    if (rate >= 50) return { label: 'Moderate', color: 'info', severity: 'moderate' };
    return { label: 'Low', color: 'success', severity: 'low' };
  };

  if (error && loading) {
    return <Alert severity="error">{error}</Alert>;
  }

  const criticalWards = forecasts.filter(f => f.predicted_occupancy_rate >= 90).length;
  const avgOccupancy = forecasts.length
    ? (forecasts.reduce((sum, f) => sum + f.predicted_occupancy_rate, 0) / forecasts.length).toFixed(1)
    : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
        🏥 Ward Bed Occupancy Forecast
      </Typography>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Predicts bed availability across wards to optimize patient flow and capacity planning
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Total Wards
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
                Average Occupancy
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {avgOccupancy}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Critical Wards
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                {criticalWards}
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
            Export Report
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
                <TableCell sx={{ fontWeight: 'bold' }}>Ward Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Forecast Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Occupancy Rate</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {forecasts.map((forecast, idx) => {
                const status = getOccupancyStatus(forecast.predicted_occupancy_rate);

                return (
                  <TableRow
                    key={idx}
                    hover
                    sx={{
                      bgcolor:
                        status.severity === 'critical'
                          ? theme.palette.error.light
                          : status.severity === 'high'
                          ? theme.palette.warning.light
                          : 'inherit',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {forecast.ward_type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {forecast.date ? new Date(forecast.date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {forecast.predicted_occupancy_rate.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={
                          status.severity === 'critical' ? (
                            <WarningAmber sx={{ fontSize: 18 }} />
                          ) : undefined
                        }
                        label={status.label}
                        color={status.color}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Alert severity="warning" sx={{ mt: 3 }}>
        ⚠️ <strong>Critical Alert:</strong> If any ward shows Critical occupancy (≥90%), 
        coordinate with administration to discharge stable patients or transfer to other facilities 
        to prevent overcrowding and ensure quality patient care.
      </Alert>
    </Box>
  );
};

export default BedOccupancy;
