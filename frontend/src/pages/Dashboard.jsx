import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Avatar,
  Paper,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  People,
  LocalPharmacy,
  Apartment,
  Hotel,
  TrendingUp,
  Download,
  PictureAsPdf,
  EventBusy,
  AssignmentLate,
  TaskAlt,
  ReceiptLong,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { reportService } from '../services/reportService';
import { analyticsService } from '../services/analyticsService';
import { patientService } from '../services/patientService';
import { appointmentService } from '../services/appointmentService';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isTabletOrLower = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
  });
  const [patientProfile, setPatientProfile] = useState(null);
  const [reports, setReports] = useState({
    revenue: null,
    patients: null,
    departments: null,
    inventory: null,
    occupancy: null,
  });
  const [isUsingEtlAnalytics, setIsUsingEtlAnalytics] = useState(false);
  const [capacityHeatmap, setCapacityHeatmap] = useState([]);
  const [capacityRecommendations, setCapacityRecommendations] = useState([]);
  const [preVisitQueue, setPreVisitQueue] = useState([]);
  const isPatient = user?.role === 'Patient';

  useEffect(() => {
    if (isPatient) {
      fetchPatientDashboard();
      return;
    }

    fetchReports();
  }, [isPatient]);

  const fetchPatientDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await patientService.getMyProfile();
      setPatientProfile(response?.data || null);
    } catch (err) {
      setError('Failed to load patient dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async (forcedParams) => {
    try {
      setLoading(true);
      setError('');

      const role = user?.role;
      const canSeeAnalyticsSummary = ['Administrator', 'Doctor', 'Nurse', 'Receptionist', 'Billing Staff', 'Pharmacist'].includes(role);
      const canSeeRevenue = ['Administrator', 'Billing Staff', 'Receptionist'].includes(role);
      const canSeePatientStats = ['Administrator', 'Receptionist', 'Doctor', 'Nurse'].includes(role);
      const canSeeDepartmentStats = ['Administrator', 'Receptionist', 'Doctor'].includes(role);
      const canSeeInventory = ['Administrator', 'Pharmacist'].includes(role);
      const canSeeOccupancy = ['Administrator', 'Nurse', 'Receptionist', 'Doctor'].includes(role);

      let analyticsRevenue = null;
      let analyticsPatients = null;

      const params = forcedParams || {};
      if (!forcedParams) {
        if (filters.fromDate) params.fromDate = filters.fromDate;
        if (filters.toDate) params.toDate = filters.toDate;
      }
      const hasDateFilter = Boolean(params.fromDate || params.toDate);

      if (!hasDateFilter && canSeeAnalyticsSummary) {
        try {
          const analytics = await analyticsService.getSummary();
          const analyticsData = analytics?.data || {};

          analyticsRevenue = analyticsData.revenue || null;
          analyticsPatients = analyticsData.patients || null;
          setIsUsingEtlAnalytics(true);
        } catch (analyticsError) {
          setIsUsingEtlAnalytics(false);
        }
      } else {
        setIsUsingEtlAnalytics(false);
      }

      const results = await Promise.allSettled([
        canSeeRevenue ? reportService.getRevenueStats(params) : Promise.resolve(null),
        canSeePatientStats ? reportService.getPatientStats(params) : Promise.resolve(null),
        canSeeDepartmentStats ? reportService.getDepartmentStats(params) : Promise.resolve(null),
        canSeeInventory ? reportService.getInventoryAlerts(params) : Promise.resolve(null),
        canSeeOccupancy ? reportService.getOccupancyStats(params) : Promise.resolve(null),
      ]);

      const canSeeHeatmap = ['Administrator', 'Receptionist', 'Doctor'].includes(user?.role);
      const canSeeReadiness = ['Nurse', 'Doctor', 'Receptionist', 'Administrator'].includes(user?.role);

      const [heatmapResult, readinessResult] = await Promise.allSettled([
        canSeeHeatmap ? analyticsService.getCapacityHeatmap(params.fromDate ? { date: params.fromDate } : {}) : Promise.resolve(null),
        canSeeReadiness ? appointmentService.getPreVisitReadiness(params.fromDate ? { date: params.fromDate } : {}) : Promise.resolve(null),
      ]);

      if (heatmapResult.status === 'fulfilled' && heatmapResult.value?.data) {
        setCapacityHeatmap(heatmapResult.value.data.heatmap || []);
        setCapacityRecommendations(heatmapResult.value.data.recommendations || []);
      } else {
        setCapacityHeatmap([]);
        setCapacityRecommendations([]);
      }

      if (readinessResult.status === 'fulfilled' && readinessResult.value?.data) {
        setPreVisitQueue(readinessResult.value.data.queue || []);
      } else {
        setPreVisitQueue([]);
      }

      const revenueData = results[0].status === 'fulfilled' ? results[0].value?.data || null : null;
      const patientStatsData = results[1].status === 'fulfilled' ? results[1].value?.data || {} : {};
      const departmentsData = results[2].status === 'fulfilled' ? results[2].value?.data || null : null;
      const inventoryData = results[3].status === 'fulfilled' ? results[3].value?.data || null : null;
      const occupancyData = results[4].status === 'fulfilled' ? results[4].value?.data || null : null;

      setReports({
        revenue: analyticsRevenue || revenueData,
        patients: {
          ...patientStatsData,
          ...(analyticsPatients || {}),
        },
        departments: departmentsData,
        inventory: inventoryData,
        occupancy: occupancyData,
      });

      const attemptedResults = results.filter((_, idx) => {
        if (idx === 0) return canSeeRevenue;
        if (idx === 1) return canSeePatientStats;
        if (idx === 2) return canSeeDepartmentStats;
        if (idx === 3) return canSeeInventory;
        if (idx === 4) return canSeeOccupancy;
        return false;
      });

      const allFailed = attemptedResults.length > 0 && attemptedResults.every((r) => r.status === 'rejected');
      if (allFailed) {
        setError('Unable to load reports for your role or current filters.');
      }
    } catch (err) {
      setError('Failed to load dashboard reports');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (rows, fileName) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? '')).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = (title, rows) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const table = `
      <table border="1" cellspacing="0" cellpadding="6" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 12px;">
        <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows
            .map((row) => `<tr>${headers.map((h) => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`)
            .join('')}
        </tbody>
      </table>
    `;

    const popup = window.open('', '_blank');
    popup.document.write(`<html><head><title>${title}</title></head><body><h2>${title}</h2>${table}</body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const renderBarChart = (title, rows, labelKey, valueKey) => {
    const max = Math.max(...rows.map((row) => Number(row[valueKey] || 0)), 1);
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>{title}</Typography>
        <Stack spacing={1.2}>
          {rows.length === 0 && <Typography color="text.secondary">No data available</Typography>}
          {rows.map((row, idx) => {
            const value = Number(row[valueKey] || 0);
            const percent = Math.max((value / max) * 100, 2);
            return (
              <Box key={`${row[labelKey]}-${idx}`}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{row[labelKey]}</Typography>
                  <Typography variant="body2" fontWeight="bold">{value}</Typography>
                </Box>
                <Box sx={{ height: 10, bgcolor: 'grey.200', borderRadius: 10, overflow: 'hidden' }}>
                  <Box sx={{ width: `${percent}%`, height: '100%', bgcolor: 'primary.main' }} />
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Paper>
    );
  };

  const totalRevenue = reports.revenue?.summary?.totalRevenue || 0;
  const totalPatients = reports.patients?.totalPatients || 0;
  const departmentCount = reports.departments?.departments?.length || 0;
  const lowStockCount = reports.inventory?.lowStockCount || 0;
  const occupancyRate = Number(reports.occupancy?.occupancyRate || 0).toFixed(2);

  const statCards = [
    { label: 'Revenue (Filtered)', value: `$${Number(totalRevenue).toFixed(2)}`, icon: <TrendingUp />, color: 'success' },
    { label: 'Total Patients', value: totalPatients, icon: <People />, color: 'primary' },
    { label: 'Departments', value: departmentCount, icon: <Apartment />, color: 'secondary' },
    { label: 'Low Stock Medicines', value: lowStockCount, icon: <LocalPharmacy />, color: 'error' },
    { label: 'Occupancy Rate', value: `${occupancyRate}%`, icon: <Hotel />, color: 'warning' },
  ];

  const roleTaskQueues = {
    Doctor: [
      { label: 'Pre-visit readiness alerts', value: preVisitQueue.length || 0, icon: <AssignmentLate />, color: 'warning.main', action: () => navigate('/appointments') },
      { label: 'Capacity rebalance flags', value: capacityRecommendations.length || 0, icon: <EventBusy />, color: 'error.main', action: () => navigate('/appointments') },
      { label: 'Patients in report scope', value: reports.patients?.totalPatients || 0, icon: <People />, color: 'secondary.main', action: () => navigate('/patients') },
    ],
    Receptionist: [
      { label: 'Arrivals to process', value: reports.departments?.departments?.reduce((acc, d) => acc + Number(d.appointmentCount || 0), 0) || 0, icon: <TaskAlt />, color: 'primary.main', action: () => navigate('/appointments') },
      { label: 'Potential booking conflicts', value: reports.occupancy?.bedStatusBreakdown?.length || 0, icon: <EventBusy />, color: 'error.main', action: () => navigate('/appointments') },
      { label: 'Patients in queue', value: reports.patients?.totalPatients || 0, icon: <People />, color: 'secondary.main', action: () => navigate('/patients') },
    ],
    'Billing Staff': [
      { label: 'Outstanding collections', value: reports.revenue?.summary?.totalTransactions || 0, icon: <ReceiptLong />, color: 'warning.main', action: () => navigate('/billing') },
      { label: 'Insurance workflows', value: reports.departments?.departments?.length || 0, icon: <TaskAlt />, color: 'primary.main', action: () => navigate('/insurance') },
      { label: 'Revenue snapshot', value: `$${Number(totalRevenue || 0).toFixed(0)}`, icon: <TrendingUp />, color: 'success.main', action: () => navigate('/billing') },
    ],
  };

  const activeQueue = roleTaskQueues[user?.role] || [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  if (isPatient) {
    const appointments = patientProfile?.appointments || [];
    const prescriptions = patientProfile?.prescriptions || [];
    const bills = patientProfile?.bills || [];

    const upcomingAppointments = appointments.filter((apt) => {
      if (!apt.appointmentDate) return false;
      return apt.status !== 'Cancelled' && new Date(apt.appointmentDate) >= new Date();
    });

    const pendingPrescriptions = prescriptions.filter((rx) => rx.status === 'Pending');
    const pendingBills = bills.filter((bill) => bill.status !== 'Paid');

    return (
      <Box>
        <Typography variant="h4" fontWeight="bold" mb={4}>
          Welcome back, {user?.firstName}!
        </Typography>

        <Grid container spacing={3} mb={4}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">Upcoming Appointments</Typography>
                <Typography variant="h4" fontWeight="bold">{upcomingAppointments.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">Pending Prescriptions</Typography>
                <Typography variant="h4" fontWeight="bold">{pendingPrescriptions.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">Outstanding Bills</Typography>
                <Typography variant="h4" fontWeight="bold">{pendingBills.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>Next Appointments</Typography>
              {(upcomingAppointments || []).slice(0, 5).map((apt) => (
                <Box key={apt.id} sx={{ mb: 1.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography fontWeight="medium">
                    {apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : 'N/A'}
                    {' '}
                    {apt.startTime ? `at ${apt.startTime}` : ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Doctor: {apt.doctor?.user ? `${apt.doctor.user.firstName || ''} ${apt.doctor.user.lastName || ''}`.trim() : 'N/A'}
                  </Typography>
                </Box>
              ))}
              {upcomingAppointments.length === 0 && (
                <Box>
                  <Typography color="text.secondary" mb={1}>No upcoming appointments.</Typography>
                  <Button size="small" variant="outlined" onClick={() => navigate('/appointments')}>Book Appointment</Button>
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>Prescription Summary</Typography>
              {(prescriptions || []).slice(0, 5).map((rx) => (
                <Box key={rx.id} sx={{ mb: 1.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography fontWeight="medium">{rx.status || 'Pending'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Date: {rx.prescriptionDate ? new Date(rx.prescriptionDate).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>
              ))}
              {prescriptions.length === 0 && (
                <Box>
                  <Typography color="text.secondary" mb={1}>No prescriptions available.</Typography>
                  <Button size="small" variant="outlined" onClick={() => navigate('/prescriptions')}>View Prescription Center</Button>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Welcome back, {user?.firstName}!
      </Typography>

      {isUsingEtlAnalytics && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Dashboard is using ETL analytics aggregates for faster reporting.
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>Report Filters</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', md: 'center' } }}>
          <TextField
            label="From"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={filters.fromDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
          />
          <TextField
            label="To"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={filters.toDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
          />
          <Button variant="contained" onClick={() => fetchReports()}>Apply Filters</Button>
          <Button
            variant="outlined"
            onClick={() => {
              setFilters({ fromDate: '', toDate: '' });
              fetchReports({});
            }}
          >
            Reset
          </Button>
        </Stack>
      </Paper>

      {activeQueue.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>{user.role} Task Queue</Typography>
          <Grid container spacing={2}>
            {activeQueue.map((item) => (
              <Grid key={item.label} size={{ xs: 12, md: 4 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Avatar sx={{ bgcolor: item.color }}>{item.icon}</Avatar>
                      <Typography fontWeight="bold">{item.label}</Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" mb={1}>{item.value}</Typography>
                    <Button variant="outlined" size="small" onClick={item.action}>Open</Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      <Grid container spacing={3} mb={4}>
        {statCards.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: `${stat.color}.main`, width: 56, height: 56 }}>
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {user?.role === 'Administrator' && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>Capacity Heatmap (Doctor Time Blocks)</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Department</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Time Block</TableCell>
                  <TableCell>Utilization</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {capacityHeatmap.slice(0, 24).map((row, idx) => (
                  <TableRow key={`${row.doctorId}-${row.blockStart}-${idx}`}>
                    <TableCell>{row.departmentName}</TableCell>
                    <TableCell>{row.doctorName}</TableCell>
                    <TableCell>{row.blockStart} - {row.blockEnd}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={`${row.utilizationPercent}%`}
                        color={row.utilizationPercent >= 100 ? 'error' : 'success'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {capacityHeatmap.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No heatmap data available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold">Auto Recommendations</Typography>
            {capacityRecommendations.slice(0, 5).map((item) => (
              <Typography key={`${item.doctorId}-${item.utilizationPercent}`} variant="body2" color="text.secondary">
                {item.doctorName} ({item.department}): {item.recommendation}
              </Typography>
            ))}
            {capacityRecommendations.length === 0 && (
              <Typography variant="body2" color="text.secondary">No rebalance actions needed.</Typography>
            )}
          </Box>
        </Paper>
      )}

      {user?.role === 'Nurse' && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>Pre-Visit Readiness Queue</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Missing Items</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {preVisitQueue.slice(0, 20).map((item) => (
                  <TableRow key={item.appointmentId}>
                    <TableCell>{item.patientName || 'N/A'}</TableCell>
                    <TableCell>{item.doctorName || 'N/A'}</TableCell>
                    <TableCell>{item.time}</TableCell>
                    <TableCell>
                      <Chip size="small" color={item.readiness === 'Ready' ? 'success' : 'warning'} label={item.readiness} />
                    </TableCell>
                    <TableCell>{item.missingItems?.join(', ') || '-'}</TableCell>
                  </TableRow>
                ))}
                {preVisitQueue.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No readiness alerts</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          {renderBarChart(
            'Revenue by Day',
            (reports.revenue?.dailyRevenue || []).map((d) => ({ date: d.date, revenue: Number(d.totalRevenue || 0) })),
            'date',
            'revenue'
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          {renderBarChart(
            'Patients by Gender',
            (reports.patients?.patientsByGender || []).map((d) => ({ gender: d.gender || 'Unknown', count: Number(d.count || 0) })),
            'gender',
            'count'
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          {renderBarChart(
            'Department Workload (Appointments)',
            (reports.departments?.departments || []).map((d) => ({
              department: d.name,
              appointments: Number(d.appointmentCount || 0),
            })),
            'department',
            'appointments'
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          {renderBarChart(
            'Occupancy by Bed Status',
            (reports.occupancy?.bedStatusBreakdown || []).map((d) => ({
              status: d.status,
              count: Number(d.count || 0),
            })),
            'status',
            'count'
          )}
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" fontWeight="bold">Inventory Report</Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => exportToCSV(reports.inventory?.lowStockMedicines || [], 'inventory-low-stock.csv')}
                >
                  Export CSV
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PictureAsPdf />}
                  onClick={() => exportToPDF('Inventory Low Stock', reports.inventory?.lowStockMedicines || [])}
                >
                  Export PDF
                </Button>
              </Stack>
            </Box>
            {isTabletOrLower ? (
              <Stack spacing={1}>
                {(reports.inventory?.lowStockMedicines || []).slice(0, 15).map((med) => (
                  <Paper key={med.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Typography fontWeight="bold">{med.name}</Typography>
                    <Typography variant="body2" color="text.secondary">Qty: {med.quantity} | Reorder: {med.reorderLevel}</Typography>
                    <Typography variant="caption" color="text.secondary">Expiry: {med.expiryDate || 'N/A'}</Typography>
                  </Paper>
                ))}
                {(reports.inventory?.lowStockMedicines || []).length === 0 && (
                  <Box>
                    <Typography color="text.secondary" mb={1}>No low stock medicines.</Typography>
                    <Button size="small" variant="outlined" onClick={() => navigate('/pharmacy')}>Open Pharmacy</Button>
                  </Box>
                )}
              </Stack>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Medicine</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Reorder Level</TableCell>
                      <TableCell>Expiry Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(reports.inventory?.lowStockMedicines || []).slice(0, 15).map((med) => (
                      <TableRow key={med.id}>
                        <TableCell>{med.name}</TableCell>
                        <TableCell>{med.quantity}</TableCell>
                        <TableCell>{med.reorderLevel}</TableCell>
                        <TableCell>{med.expiryDate}</TableCell>
                      </TableRow>
                    ))}
                    {(reports.inventory?.lowStockMedicines || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No low stock medicines</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" fontWeight="bold">Revenue Report</Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => exportToCSV(reports.revenue?.dailyRevenue || [], 'revenue-daily.csv')}
                >
                  Export CSV
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PictureAsPdf />}
                  onClick={() => exportToPDF('Revenue Daily', reports.revenue?.dailyRevenue || [])}
                >
                  Export PDF
                </Button>
              </Stack>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Filtered transactions: {reports.revenue?.summary?.totalTransactions || 0}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>Patient Report Export</Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => exportToCSV(reports.patients?.patientsCreatedByDate || [], 'patient-trends.csv')}
              >
                CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdf />}
                onClick={() => exportToPDF('Patient Trends', reports.patients?.patientsCreatedByDate || [])}
              >
                PDF
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>Department Report Export</Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => exportToCSV(reports.departments?.departments || [], 'department-stats.csv')}
              >
                CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdf />}
                onClick={() => exportToPDF('Department Stats', reports.departments?.departments || [])}
              >
                PDF
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>Occupancy Report Export</Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => exportToCSV(reports.occupancy?.bedStatusBreakdown || [], 'occupancy-status.csv')}
              >
                CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdf />}
                onClick={() => exportToPDF('Occupancy Status', reports.occupancy?.bedStatusBreakdown || [])}
              >
                PDF
              </Button>
            </Stack>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
};

export default Dashboard;

