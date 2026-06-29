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
  LocalPharmacy,
  Warning,
  Refresh,
  Download,
  TrendingUp,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { predictionService } from '../services/predictionService';
import { useTheme } from '@mui/material/styles';

const MedicineDemand = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forecasts, setForecasts] = useState([]);
  const [refreshTime, setRefreshTime] = useState(new Date());

  const allowedRoles = ['Administrator', 'Pharmacist'];

  useEffect(() => {
    if (!allowedRoles.includes(user?.role)) {
      setError('Unauthorized: Only Admin or Pharmacist can view this');
      setLoading(false);
      return;
    }

    fetchForecasts();
  }, [user]);

  const fetchForecasts = async () => {
    try {
      setLoading(true);
      const data = await predictionService.getMedicineDemandForecasts({ limit: 100 });
      setForecasts(data.data || []);
      setRefreshTime(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load medicine demand forecasts');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyLevel = (confidence) => {
    if (confidence >= 0.8) return { label: 'High Confidence', color: 'success' };
    if (confidence >= 0.6) return { label: 'Medium Confidence', color: 'warning' };
    return { label: 'Low Confidence', color: 'error' };
  };

  const getUrgencyBadge = (quantity) => {
    if (quantity > 500) return { label: 'URGENT', color: 'error', severity: 'high' };
    if (quantity > 200) return { label: 'HIGH', color: 'warning', severity: 'medium' };
    return { label: 'NORMAL', color: 'success', severity: 'low' };
  };

  if (error && loading) {
    return <Alert severity="error">{error}</Alert>;
  }

  const urgentCount = forecasts.filter(f => f.predicted_quantity > 500).length;
  const totalDemand = forecasts.reduce((sum, f) => sum + f.predicted_quantity, 0);
  const avgConfidence = forecasts.length
    ? (forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length * 100).toFixed(1)
    : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
        💊 Medicine Demand Forecast
      </Typography>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Predicts monthly medicine demand for procurement planning and inventory management
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Total Medicine Types
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
                Total Forecasted Demand
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {totalDemand}
              </Typography>
              <Typography variant="caption">units</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Urgent Orders
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                {urgentCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Avg Confidence
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {avgConfidence}%
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
            Export for Procurement
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
                <TableCell sx={{ fontWeight: 'bold' }}>Medicine Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Forecast Month</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Predicted Qty</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Urgency</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Confidence</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Forecast %</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {forecasts.map((forecast, idx) => {
                const urgency = getUrgencyBadge(forecast.predicted_quantity);
                const confidence = getUrgencyLevel(forecast.confidence);
                const maxQuantity = Math.max(...forecasts.map(f => f.predicted_quantity), 1);
                const percentOfMax = (forecast.predicted_quantity / maxQuantity) * 100;

                return (
                  <TableRow
                    key={idx}
                    hover
                    sx={{
                      bgcolor: urgency.severity === 'high' ? theme.palette.error.light : 'inherit',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {forecast.medicine_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {forecast.month ? new Date(forecast.month).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {forecast.predicted_quantity}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={urgency.severity === 'high' ? <Warning /> : undefined}
                        label={urgency.label}
                        color={urgency.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={confidence.label}
                        color={confidence.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={percentOfMax}
                          sx={{ flex: 1, height: 8, borderRadius: 1 }}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          {percentOfMax.toFixed(0)}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Alert severity="success" sx={{ mt: 3 }}>
        ✅ <strong>Action:</strong> Export this forecast and use it for purchase orders 
        with suppliers. Prioritize urgent items (URGENT badge) for immediate procurement.
      </Alert>
    </Box>
  );
};

export default MedicineDemand;
