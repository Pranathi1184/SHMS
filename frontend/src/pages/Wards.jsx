import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { wardManagementService } from '../services/wardManagementService';
import { readableId } from '../utils/formatters';

const Wards = () => {
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [wardData, bedData, admissionData] = await Promise.all([
          wardManagementService.getWards(),
          wardManagementService.getBeds(),
          wardManagementService.getAdmissions(),
        ]);
        setWards(wardData.data.wards || []);
        setBeds(bedData.data.beds || []);
        setAdmissions(admissionData.data.admissions || []);
      } catch (err) {
        setError('Failed to load ward overview');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const occupancy = useMemo(() => {
    const totalBeds = beds.length;
    const occupied = beds.filter((bed) => bed.status === 'Occupied').length;
    const admitted = admissions.filter((admission) => admission.status === 'Admitted').length;
    return {
      totalBeds,
      occupied,
      available: Math.max(totalBeds - occupied, 0),
      admitted,
      occupancyRate: totalBeds ? ((occupied / totalBeds) * 100).toFixed(1) : '0.0',
    };
  }, [beds, admissions]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={2}>Wards Overview</Typography>
      <Typography color="text.secondary" mb={2}>Live occupancy and capacity snapshot across all wards.</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card><CardContent><Typography color="text.secondary">Wards</Typography><Typography variant="h4" fontWeight="bold">{wards.length}</Typography></CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card><CardContent><Typography color="text.secondary">Total Beds</Typography><Typography variant="h4" fontWeight="bold">{occupancy.totalBeds}</Typography></CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card><CardContent><Typography color="text.secondary">Occupied Beds</Typography><Typography variant="h4" fontWeight="bold">{occupancy.occupied}</Typography></CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card><CardContent><Typography color="text.secondary">Occupancy Rate</Typography><Typography variant="h4" fontWeight="bold">{occupancy.occupancyRate}%</Typography></CardContent></Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ward ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Department</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {wards.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center">No wards found</TableCell></TableRow>
            ) : (
              wards.map((ward) => (
                <TableRow key={ward.id} hover>
                  <TableCell>{readableId('ward', ward.id, ward)}</TableCell>
                  <TableCell>{ward.name}</TableCell>
                  <TableCell>{ward.type}</TableCell>
                  <TableCell>{ward.department?.name || 'N/A'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Wards;

