import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { ehrService } from '../services/ehrService';
import { readableId } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';

const EHRList = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await ehrService.getEHRs({ page: 1, limit: 100 });
        setRecords(data.data.ehrs || []);
      } catch (err) {
        setError('Failed to load EHR registry');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  useEffect(() => {
    const key = `shms_filters_ehr_${user?.role || 'all'}`;
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    if (typeof saved.search === 'string') {
      setSearch(saved.search);
    }
  }, [user?.role]);

  useEffect(() => {
    const key = `shms_filters_ehr_${user?.role || 'all'}`;
    localStorage.setItem(key, JSON.stringify({ search }));
  }, [search, user?.role]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter((record) => {
      const patientName = record.patient
        ? `${record.patient.firstName || ''} ${record.patient.lastName || ''}`.trim()
        : '';
      const doctorName = record.doctor?.user
        ? `${record.doctor.user.firstName || ''} ${record.doctor.user.lastName || ''}`.trim()
        : '';
      const haystack = `${patientName} ${doctorName} ${record.diagnosis || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [records, search]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={2}>
        EHR Registry
      </Typography>
      <Typography color="text.secondary" mb={2}>
        Centralized index of patient health records for quick clinical lookup.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patient, doctor, or diagnosis"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            },
          }}
        />
        <Box sx={{ mt: 1 }}>
          <Typography
            component="button"
            onClick={() => setSearch('')}
            sx={{
              border: 'none',
              bgcolor: 'transparent',
              color: 'primary.main',
              cursor: 'pointer',
              p: 0,
              fontSize: 14,
            }}
          >
            Reset Filters
          </Typography>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Diagnosis</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">No EHR records found</TableCell>
              </TableRow>
            ) : (
              filtered.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>{readableId('ehr', record.id, record)}</TableCell>
                  <TableCell>
                    {record.patient
                      ? `${record.patient.firstName || ''} ${record.patient.lastName || ''}`.trim()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {record.doctor?.user
                      ? `${record.doctor.user.firstName || ''} ${record.doctor.user.lastName || ''}`.trim()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{record.diagnosis || 'N/A'}</TableCell>
                  <TableCell>{record.createdAt ? new Date(record.createdAt).toLocaleString() : 'N/A'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default EHRList;

