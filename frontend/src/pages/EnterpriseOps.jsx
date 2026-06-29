import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { enterpriseService } from '../services/enterpriseService';
import { patientService } from '../services/patientService';
import { insuranceService } from '../services/insuranceService';
import { billService } from '../services/billService';
import { analyticsService } from '../services/analyticsService';
import { readableId } from '../utils/formatters';
import { toUserFriendlyError } from '../utils/errorMessages';

const claimStatuses = ['Submitted', 'Under Verification', 'Approved', 'Rejected', 'Paid'];
const dischargeStatuses = ['In Progress', 'Ready for Discharge', 'Discharged'];
const commChannels = ['SMS', 'Email', 'InApp'];
const commCategories = ['Appointment Reminder', 'Bill Reminder', 'Lab Result', 'General'];

const EnterpriseOps = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [patients, setPatients] = useState([]);
  const [insurances, setInsurances] = useState([]);
  const [bills, setBills] = useState([]);

  const [claims, setClaims] = useState([]);
  const [pathways, setPathways] = useState([]);
  const [communications, setCommunications] = useState([]);

  const [qualityResult, setQualityResult] = useState(null);
  const [kpiDrilldown, setKpiDrilldown] = useState([]);

  const [claimForm, setClaimForm] = useState({
    patientId: '',
    insuranceId: '',
    billId: '',
    claimNumber: '',
    claimAmount: '',
    status: 'Submitted',
  });

  const [pathwayForm, setPathwayForm] = useState({
    admissionId: '',
    expectedDischargeDate: '',
    status: 'In Progress',
  });

  const [commForm, setCommForm] = useState({
    patientId: '',
    channel: 'InApp',
    category: 'General',
    subject: '',
    content: '',
  });

  const [statusDialog, setStatusDialog] = useState({ open: false, claimId: '', status: 'Submitted', approvedAmount: '', rejectionReason: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        patientsRes,
        insuranceRes,
        billsRes,
        claimsRes,
        pathwaysRes,
        commsRes,
        kpiRes,
      ] = await Promise.all([
        patientService.getAllPatients({ limit: 200 }),
        insuranceService.getInsurance({ limit: 200 }),
        billService.getBills({ limit: 200 }),
        enterpriseService.getClaims({ limit: 100 }),
        enterpriseService.getDischargePathways({ limit: 100 }),
        enterpriseService.getCommunications({ limit: 100 }),
        analyticsService.getKpiDrilldown('revenue'),
      ]);

      setPatients(patientsRes?.data?.patients || []);
      setInsurances(insuranceRes?.data?.insuranceRecords || insuranceRes?.data?.insurances || []);
      setBills(billsRes?.data?.bills || []);
      setClaims(claimsRes?.data?.claims || []);
      setPathways(pathwaysRes?.data?.pathways || []);
      setCommunications(commsRes?.data?.communications || []);
      setKpiDrilldown(kpiRes?.data?.rows || []);
    } catch (err) {
      setError(toUserFriendlyError(err, 'Unable to load enterprise operations right now.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const submitClaim = async (event) => {
    event.preventDefault();
    try {
      setError('');
      await enterpriseService.createClaim({
        ...claimForm,
        claimAmount: Number(claimForm.claimAmount || 0),
        billId: claimForm.billId || null,
      });
      setSuccess('Claim created successfully.');
      setClaimForm((prev) => ({ ...prev, claimNumber: '', claimAmount: '' }));
      await loadData();
    } catch (err) {
      setError(toUserFriendlyError(err, 'Unable to create claim.'));
    }
  };

  const submitPathway = async (event) => {
    event.preventDefault();
    try {
      setError('');
      await enterpriseService.saveDischargePathway({
        admissionId: pathwayForm.admissionId,
        status: pathwayForm.status,
        expectedDischargeDate: pathwayForm.expectedDischargeDate || null,
      });
      setSuccess('Discharge pathway saved.');
      setPathwayForm((prev) => ({ ...prev, admissionId: '' }));
      await loadData();
    } catch (err) {
      setError(toUserFriendlyError(err, 'Unable to save discharge pathway.'));
    }
  };

  const submitCommunication = async (event) => {
    event.preventDefault();
    try {
      setError('');
      await enterpriseService.sendCommunication(commForm);
      setSuccess('Communication sent successfully.');
      setCommForm((prev) => ({ ...prev, subject: '', content: '' }));
      await loadData();
    } catch (err) {
      setError(toUserFriendlyError(err, 'Unable to send communication.'));
    }
  };

  const runQualityChecks = async () => {
    try {
      setError('');
      const response = await analyticsService.runDataQualityChecks();
      setQualityResult(response?.data || null);
      setSuccess('Data quality checks completed.');
    } catch (err) {
      setError(toUserFriendlyError(err, 'Unable to run quality checks.'));
    }
  };

  const openStatusDialog = (claim) => {
    setStatusDialog({
      open: true,
      claimId: claim.id,
      status: claim.status || 'Submitted',
      approvedAmount: claim.approvedAmount || '',
      rejectionReason: claim.rejectionReason || '',
    });
  };

  const closeStatusDialog = () => {
    setStatusDialog({ open: false, claimId: '', status: 'Submitted', approvedAmount: '', rejectionReason: '' });
  };

  const updateClaimStatus = async () => {
    try {
      setError('');
      await enterpriseService.updateClaimStatus(statusDialog.claimId, {
        status: statusDialog.status,
        approvedAmount: statusDialog.approvedAmount ? Number(statusDialog.approvedAmount) : null,
        rejectionReason: statusDialog.rejectionReason || null,
      });
      setSuccess('Claim status updated.');
      closeStatusDialog();
      await loadData();
    } catch (err) {
      setError(toUserFriendlyError(err, 'Unable to update claim status.'));
    }
  };

  const renderClaims = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, lg: 5 }}>
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight="bold" mb={1.5}>Create Claim</Typography>
          <Box component="form" onSubmit={submitClaim}>
            <TextField
              select
              label="Patient"
              fullWidth
              margin="normal"
              value={claimForm.patientId}
              onChange={(e) => setClaimForm((prev) => ({ ...prev, patientId: e.target.value }))}
              required
            >
              {patients.map((patient) => (
                <MenuItem key={patient.id} value={patient.id}>
                  {`${readableId('patient', patient.id, patient)} - ${patient.firstName || ''} ${patient.lastName || ''}`.trim()}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Insurance"
              fullWidth
              margin="normal"
              value={claimForm.insuranceId}
              onChange={(e) => setClaimForm((prev) => ({ ...prev, insuranceId: e.target.value }))}
              required
            >
              {insurances.map((insurance) => (
                <MenuItem key={insurance.id} value={insurance.id}>
                  {`${readableId('insurance', insurance.id, insurance)} - ${insurance.providerName || insurance.provider || 'Provider'}`}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Bill (Optional)"
              fullWidth
              margin="normal"
              value={claimForm.billId}
              onChange={(e) => setClaimForm((prev) => ({ ...prev, billId: e.target.value }))}
            >
              <MenuItem value="">No linked bill</MenuItem>
              {bills.map((bill) => (
                <MenuItem key={bill.id} value={bill.id}>
                  {`${readableId('bill', bill.id, bill)} - ${bill.status || 'N/A'}`}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Claim Number"
              fullWidth
              margin="normal"
              value={claimForm.claimNumber}
              onChange={(e) => setClaimForm((prev) => ({ ...prev, claimNumber: e.target.value }))}
              required
            />

            <TextField
              label="Claim Amount"
              type="number"
              fullWidth
              margin="normal"
              value={claimForm.claimAmount}
              onChange={(e) => setClaimForm((prev) => ({ ...prev, claimAmount: e.target.value }))}
              required
            />

            <TextField
              select
              label="Initial Status"
              fullWidth
              margin="normal"
              value={claimForm.status}
              onChange={(e) => setClaimForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              {claimStatuses.map((status) => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </TextField>

            <Button type="submit" variant="contained" sx={{ mt: 1.5 }}>Create Claim</Button>
          </Box>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, lg: 7 }}>
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight="bold" mb={1.5}>Claims Queue</Typography>
          <Stack spacing={1.25}>
            {claims.map((claim) => (
              <Card key={claim.id} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography fontWeight="bold">{claim.claimNumber}</Typography>
                    <Chip label={claim.status} size="small" color={claim.status === 'Rejected' ? 'error' : claim.status === 'Approved' || claim.status === 'Paid' ? 'success' : 'warning'} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" mt={0.75}>
                    Patient: {claim.patient ? `${claim.patient.firstName || ''} ${claim.patient.lastName || ''}`.trim() : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Insurance: {claim.insurance?.providerName || claim.insurance?.provider || 'N/A'} | Amount: {claim.claimAmount}
                  </Typography>
                  <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={() => openStatusDialog(claim)}>Update Status</Button>
                </CardContent>
              </Card>
            ))}
            {claims.length === 0 && <Typography color="text.secondary">No claims yet.</Typography>}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderDischargePathways = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, lg: 5 }}>
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight="bold" mb={1.5}>Discharge Pathway</Typography>
          <Box component="form" onSubmit={submitPathway}>
            <TextField
              label="Admission ID"
              fullWidth
              margin="normal"
              value={pathwayForm.admissionId}
              onChange={(e) => setPathwayForm((prev) => ({ ...prev, admissionId: e.target.value }))}
              required
            />
            <TextField
              label="Expected Discharge Date"
              type="date"
              fullWidth
              margin="normal"
              value={pathwayForm.expectedDischargeDate}
              onChange={(e) => setPathwayForm((prev) => ({ ...prev, expectedDischargeDate: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              select
              label="Status"
              fullWidth
              margin="normal"
              value={pathwayForm.status}
              onChange={(e) => setPathwayForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              {dischargeStatuses.map((status) => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </TextField>
            <Button type="submit" variant="contained" sx={{ mt: 1.5 }}>Save Pathway</Button>
          </Box>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, lg: 7 }}>
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight="bold" mb={1.5}>Recent Pathways</Typography>
          <Stack spacing={1.25}>
            {pathways.map((pathway) => (
              <Card key={pathway.id} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography fontWeight="bold">Admission {readableId('admission', pathway.admissionId, pathway)}</Typography>
                    <Chip label={pathway.status} size="small" color={pathway.status === 'Discharged' ? 'success' : pathway.status === 'Ready for Discharge' ? 'warning' : 'default'} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" mt={0.75}>
                    Patient: {pathway.admission?.patient ? `${pathway.admission.patient.firstName || ''} ${pathway.admission.patient.lastName || ''}`.trim() : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Expected discharge: {pathway.expectedDischargeDate ? new Date(pathway.expectedDischargeDate).toLocaleDateString() : 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            ))}
            {pathways.length === 0 && <Typography color="text.secondary">No discharge pathways created yet.</Typography>}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderCommunications = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, lg: 5 }}>
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight="bold" mb={1.5}>Send Communication</Typography>
          <Box component="form" onSubmit={submitCommunication}>
            <TextField
              select
              label="Patient"
              fullWidth
              margin="normal"
              value={commForm.patientId}
              onChange={(e) => setCommForm((prev) => ({ ...prev, patientId: e.target.value }))}
              required
            >
              {patients.map((patient) => (
                <MenuItem key={patient.id} value={patient.id}>
                  {`${readableId('patient', patient.id, patient)} - ${patient.firstName || ''} ${patient.lastName || ''}`.trim()}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Channel"
              fullWidth
              margin="normal"
              value={commForm.channel}
              onChange={(e) => setCommForm((prev) => ({ ...prev, channel: e.target.value }))}
            >
              {commChannels.map((channel) => (
                <MenuItem key={channel} value={channel}>{channel}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Category"
              fullWidth
              margin="normal"
              value={commForm.category}
              onChange={(e) => setCommForm((prev) => ({ ...prev, category: e.target.value }))}
            >
              {commCategories.map((category) => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Subject"
              fullWidth
              margin="normal"
              value={commForm.subject}
              onChange={(e) => setCommForm((prev) => ({ ...prev, subject: e.target.value }))}
            />
            <TextField
              label="Message"
              fullWidth
              margin="normal"
              multiline
              minRows={4}
              value={commForm.content}
              onChange={(e) => setCommForm((prev) => ({ ...prev, content: e.target.value }))}
              required
            />
            <Button type="submit" variant="contained" sx={{ mt: 1.5 }}>Send</Button>
          </Box>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, lg: 7 }}>
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight="bold" mb={1.5}>Communication Log</Typography>
          <Stack spacing={1.25}>
            {communications.map((comm) => (
              <Card key={comm.id} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography fontWeight="bold">{comm.category || 'General'}</Typography>
                    <Chip label={`${comm.channel} • ${comm.status}`} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" mt={0.75}>
                    Patient: {comm.patient ? `${comm.patient.firstName || ''} ${comm.patient.lastName || ''}`.trim() : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">{comm.subject || 'No subject'}</Typography>
                  <Typography variant="body2" mt={0.5}>{comm.content}</Typography>
                </CardContent>
              </Card>
            ))}
            {communications.length === 0 && <Typography color="text.secondary">No communications yet.</Typography>}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderDataQuality = () => (
    <Paper sx={{ p: 2.5 }}>
      <Typography variant="h6" fontWeight="bold" mb={1.5}>Data Quality and KPI Drilldown</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2}>
        <Button variant="contained" onClick={runQualityChecks}>Run Data Quality Checks</Button>
      </Stack>

      {qualityResult && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Missing phones: {qualityResult.missingPatientPhones} | Invalid appointments: {qualityResult.invalidAppointments} | Duplicate emails: {qualityResult.duplicatePatientEmails?.length || 0}
        </Alert>
      )}

      <Typography variant="subtitle1" fontWeight="bold" mb={1}>Revenue KPI Trend</Typography>
      <Stack spacing={1}>
        {kpiDrilldown.slice(-12).map((row, idx) => (
          <Box key={`${row.date}-${idx}`} sx={{ display: 'flex', justifyContent: 'space-between', p: 1, borderRadius: 1, bgcolor: 'background.default' }}>
            <Typography variant="body2">{row.date}</Typography>
            <Typography variant="body2" fontWeight="bold">{Number(row.value || 0).toFixed(2)}</Typography>
          </Box>
        ))}
        {kpiDrilldown.length === 0 && <Typography color="text.secondary">No KPI data from ETL yet.</Typography>}
      </Stack>
    </Paper>
  );

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" fontWeight="bold" mb={2}>Enterprise Operations</Typography>
        <Typography color="text.secondary">Loading enterprise modules...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={2}>Enterprise Operations</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Claims" />
          <Tab label="Discharge" />
          <Tab label="Communication" />
          <Tab label="Quality + KPI" />
        </Tabs>
      </Paper>

      {activeTab === 0 && renderClaims()}
      {activeTab === 1 && renderDischargePathways()}
      {activeTab === 2 && renderCommunications()}
      {activeTab === 3 && renderDataQuality()}

      <Dialog open={statusDialog.open} onClose={closeStatusDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Update Claim Status</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Status"
            fullWidth
            margin="normal"
            value={statusDialog.status}
            onChange={(e) => setStatusDialog((prev) => ({ ...prev, status: e.target.value }))}
          >
            {claimStatuses.map((status) => (
              <MenuItem key={status} value={status}>{status}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Approved Amount"
            type="number"
            fullWidth
            margin="normal"
            value={statusDialog.approvedAmount}
            onChange={(e) => setStatusDialog((prev) => ({ ...prev, approvedAmount: e.target.value }))}
          />
          <TextField
            label="Rejection Reason"
            fullWidth
            multiline
            minRows={2}
            margin="normal"
            value={statusDialog.rejectionReason}
            onChange={(e) => setStatusDialog((prev) => ({ ...prev, rejectionReason: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeStatusDialog}>Cancel</Button>
          <Button variant="contained" onClick={updateClaimStatus}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnterpriseOps;
