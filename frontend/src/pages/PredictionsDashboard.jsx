import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Paper,
  Divider,
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  TrendingUp,
  LocalPharmacy,
  LocalHospital,
  AttachMoney,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { predictionService } from '../services/predictionService';
import { useTheme } from '@mui/material/styles';

const PredictionsDashboard = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    // Only admins can view this
    if (user?.role !== 'Administrator') {
      setError('Unauthorized: Only Admins can view this dashboard');
      setLoading(false);
      return;
    }

    const fetchSummary = async () => {
      try {
        setLoading(true);
        const data = await predictionService.getPredictionSummary();
        setSummary(data.summary);
      } catch (err) {
        setError(err.message || 'Failed to load predictions summary');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [user]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const getSeverityColor = (count, highThreshold = 5) => {
    if (count === 0) return theme.palette.success.main;
    if (count < highThreshold) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const PredictionCard = ({ icon: Icon, title, count, color, description }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {count}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {description}
            </Typography>
          </Box>
          <Icon sx={{ fontSize: 40, color: color, opacity: 0.7 }} />
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        🎯 Predictions Dashboard
      </Typography>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Real-time overview of all AI-generated predictions and risk assessments
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <PredictionCard
            icon={Warning}
            title="High-Risk No-Shows"
            count={summary?.no_show_high_risk || 0}
            color={getSeverityColor(summary?.no_show_high_risk || 0, 3)}
            description="Appointments at risk"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <PredictionCard
            icon={TrendingUp}
            title="Overbooked Doctors"
            count={summary?.doctor_high_load || 0}
            color={getSeverityColor(summary?.doctor_high_load || 0, 2)}
            description="High workload forecast"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <PredictionCard
            icon={LocalPharmacy}
            title="Urgent Medicine Orders"
            count={summary?.medicine_urgent || 0}
            color={getSeverityColor(summary?.medicine_urgent || 0, 5)}
            description="Need immediate restock"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <PredictionCard
            icon={LocalHospital}
            title="High Bed Occupancy"
            count={summary?.occupancy_high || 0}
            color={getSeverityColor(summary?.occupancy_high || 0, 2)}
            description="Wards at capacity"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <PredictionCard
            icon={AttachMoney}
            title="High-Risk Bills"
            count={summary?.billing_high_risk || 0}
            color={getSeverityColor(summary?.billing_high_risk || 0, 5)}
            description="Payment risk detected"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <PredictionCard
            icon={CheckCircle}
            title="Total High-Risk Alerts"
            count={
              (summary?.no_show_high_risk || 0)
              + (summary?.doctor_high_load || 0)
              + (summary?.medicine_urgent || 0)
              + (summary?.occupancy_high || 0)
              + (summary?.billing_high_risk || 0)
            }
            color={theme.palette.success.main}
            description="Cross-domain risk count"
          />
        </Grid>
      </Grid>

      {/* Information Section */}
      <Paper sx={{ p: 3, bgcolor: theme.palette.info.light, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          📊 Prediction Models Overview
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={1}>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip label="No-Show Predictor" size="small" color="warning" />
            <Typography variant="body2">
              Identifies appointments with high cancellation risk
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip label="Doctor Load Forecaster" size="small" color="warning" />
            <Typography variant="body2">
              Predicts daily doctor workload and availability
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip label="Medicine Demand Forecast" size="small" color="warning" />
            <Typography variant="body2">
              Estimates inventory needs for procurement planning
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip label="Bed Occupancy Predictor" size="small" color="warning" />
            <Typography variant="body2">
              Forecasts ward utilization rates
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip label="Billing Risk Scorer" size="small" color="warning" />
            <Typography variant="body2">
              Detects high-risk bills for follow-up
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Alert severity="info" sx={{ mt: 3 }}>
        💡 <strong>Tip:</strong> All predictions are updated daily via the ETL pipeline. 
        Click on specific categories to view detailed analysis.
      </Alert>
    </Box>
  );
};

export default PredictionsDashboard;
