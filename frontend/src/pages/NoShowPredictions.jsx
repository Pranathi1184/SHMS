import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
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
  TextField,
  Button,
  Stack,
  Grid,
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  WarningAmber,
  Download,
  Refresh,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { predictionService } from '../services/predictionService';
import { useTheme } from '@mui/material/styles';

const NoShowPredictions = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [filter, setFilter] = useState('High');
  const [refreshTime, setRefreshTime] = useState(new Date());

  const allowedRoles = ['Administrator', 'Receptionist', 'Doctor'];

  useEffect(() => {
    if (!allowedRoles.includes(user?.role)) {
      setError('Unauthorized: Only Admin, Receptionist, or Doctor can view this');
      setLoading(false);
      return;
    }

    fetchPredictions();
  }, [user, filter]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const params = { riskLabel: filter, limit: 50 };
      const data = await predictionService.getNoShowPredictions(params);
      setPredictions(data.data || []);
      setRefreshTime(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (label) => {
    switch (label) {
      case 'High':
        return 'error';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getRiskIcon = (label) => {
    switch (label) {
      case 'High':
        return <WarningAmber sx={{ fontSize: 18 }} />;
      case 'Medium':
        return <Warning sx={{ fontSize: 18 }} />;
      case 'Low':
        return <CheckCircle sx={{ fontSize: 18 }} />;
      default:
        return null;
    }
  };

  if (error && loading) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
        📅 Appointment No-Show Predictions
      </Typography>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Identifies appointments with high cancellation risk based on historical patterns
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Total Predictions
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {predictions.length}
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

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: theme.palette.grey[50] }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Filter by Risk Level:
          </Typography>
          {['High', 'Medium', 'Low'].map((level) => (
            <Chip
              key={level}
              label={level}
              onClick={() => setFilter(level)}
              color={filter === level ? 'primary' : 'default'}
              variant={filter === level ? 'filled' : 'outlined'}
            />
          ))}
          <Button
            startIcon={<Refresh />}
            onClick={fetchPredictions}
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

      {loading && !predictions.length ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : predictions.length === 0 ? (
        <Alert severity="info">No predictions found for the selected filter</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: theme.palette.grey[100] }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Risk Level</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Risk Score</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Appointment Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Recommendation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {predictions.map((pred, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>
                    <Chip
                      icon={getRiskIcon(pred.risk_label)}
                      label={pred.risk_label}
                      color={getRiskColor(pred.risk_label)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {(pred.risk_score * 100).toFixed(1)}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {pred.appointment?.appointmentDate
                      ? new Date(pred.appointment.appointmentDate).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {pred.appointment?.startTime || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {pred.appointment?.status || 'Scheduled'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {pred.recommendation}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Alert severity="info" sx={{ mt: 3 }}>
        💡 <strong>How to Use:</strong> Review high-risk appointments and reach out to 
        patients proactively to reduce no-shows. Consider reminder calls 24-48 hours before appointment.
      </Alert>
    </Box>
  );
};

export default NoShowPredictions;
