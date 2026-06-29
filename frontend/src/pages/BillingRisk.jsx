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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  AttachMoney,
  Refresh,
  Download,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { predictionService } from '../services/predictionService';
import { useTheme } from '@mui/material/styles';

const BillingRisk = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scores, setScores] = useState([]);
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [selectedScore, setSelectedScore] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const allowedRoles = ['Administrator', 'Billing Staff'];

  useEffect(() => {
    if (!allowedRoles.includes(user?.role)) {
      setError('Unauthorized: Only Admin or Billing Staff can view this');
      setLoading(false);
      return;
    }

    fetchScores();
  }, [user]);

  const fetchScores = async () => {
    try {
      setLoading(true);
      const data = await predictionService.getBillingRiskScores({ limit: 100 });
      setScores(data.data || []);
      setRefreshTime(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load billing risk scores');
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
        return <Warning sx={{ fontSize: 18 }} />;
      case 'Low':
        return <CheckCircle sx={{ fontSize: 18 }} />;
      default:
        return null;
    }
  };

  const handleDialogOpen = (score) => {
    setSelectedScore(score);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  if (error && loading) {
    return <Alert severity="error">{error}</Alert>;
  }

  const highRiskCount = scores.filter(s => s.risk_label === 'High').length;
  const mediumRiskCount = scores.filter(s => s.risk_label === 'Medium').length;
  const avgRiskScore = scores.length
    ? (scores.reduce((sum, s) => sum + s.risk_score, 0) / scores.length * 100).toFixed(1)
    : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
        💳 Billing Payment Risk Score
      </Typography>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Identifies high-risk bills for collection and follow-up activities
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Total Bills Analyzed
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {scores.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                High Risk Bills
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                {highRiskCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Medium Risk Bills
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.warning.main }}>
                {mediumRiskCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Average Risk Score
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {avgRiskScore}%
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
            onClick={fetchScores}
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
            Export for Collection
          </Button>
        </Stack>
      </Paper>

      {loading && !scores.length ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : scores.length === 0 ? (
        <Alert severity="info">No billing data available</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: theme.palette.grey[100] }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Bill ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Assessment Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Risk Score</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Risk Level</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Recommendation</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scores.map((score, idx) => (
                <TableRow
                  key={idx}
                  hover
                  sx={{
                    bgcolor:
                      score.risk_label === 'High'
                        ? theme.palette.error.light
                        : score.risk_label === 'Medium'
                        ? theme.palette.warning.light
                        : 'inherit',
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {score.bill_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(score.score_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {(score.risk_score * 100).toFixed(1)}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getRiskIcon(score.risk_label)}
                      label={score.risk_label}
                      color={getRiskColor(score.risk_label)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {score.recommendation}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleDialogOpen(score)}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Details Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Bill Risk Details</DialogTitle>
        <DialogContent>
          {selectedScore && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Bill ID:</strong> {selectedScore.bill_id}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Risk Score:</strong> {(selectedScore.risk_score * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Assessment Date:</strong>{' '}
                {new Date(selectedScore.score_date).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Risk Level:</strong>
                <Chip
                  label={selectedScore.risk_label}
                  color={getRiskColor(selectedScore.risk_label)}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                <strong>Recommendation:</strong>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {selectedScore.recommendation}
                </Typography>
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Alert severity="success" sx={{ mt: 3 }}>
        ✅ <strong>Collection Strategy:</strong> Prioritize high-risk bills (High Risk) for 
        immediate collection efforts. Contact patients with medium-risk bills for payment plans.
      </Alert>
    </Box>
  );
};

export default BillingRisk;
