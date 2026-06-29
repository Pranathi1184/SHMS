import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { aiService } from '../services/aiService';
import { agentService } from '../services/agentService';
import { useAuth } from '../contexts/AuthContext';

const canRun = (role, key) => {
  const map = {
    scheduling: ['Administrator', 'Receptionist', 'Doctor', 'Nurse', 'Lab Technician', 'Pharmacist', 'Billing Staff', 'Patient'],
    followUp: ['Administrator', 'Nurse', 'Doctor'],
    inventory: ['Administrator', 'Pharmacist'],
    billing: ['Administrator', 'Billing Staff'],
  };
  return map[key]?.includes(role);
};

const AICenter = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [result, setResult] = useState('');

  const [patientId, setPatientId] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [chatQuery, setChatQuery] = useState('Summarize todays hospital priorities.');

  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleDoctorId, setScheduleDoctorId] = useState('');
  const [history, setHistory] = useState([]);
  const [schedules, setSchedules] = useState(null);

  const roleHints = useMemo(() => {
    if (role === 'Patient') return 'You can use chatbot and scheduling suggestions. Agent triggers are role-restricted.';
    if (role === 'Doctor') return 'You can run scheduling and follow-up agents, and use all AI assist actions.';
    if (role === 'Administrator') return 'You have access to all AI and agent controls including history and schedules.';
    return 'Use role-allowed AI actions below.';
  }, [role]);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const runAction = async (action, successMessage) => {
    try {
      clearMessages();
      setLoading(true);
      const output = await action();
      setResult(typeof output === 'string' ? output : JSON.stringify(output, null, 2));
      setSuccess(successMessage);
    } catch (err) {
      setError(err?.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const refreshAgentMeta = async () => {
    try {
      const [h, s] = await Promise.all([agentService.getExecutionHistory(30), agentService.getSchedules()]);
      setHistory(h?.data?.executions || []);
      setSchedules(s?.data || null);
    } catch {
      // Keep page usable even if metadata fetch fails.
    }
  };

  useEffect(() => {
    refreshAgentMeta();
  }, []);

  const renderGenAITab = () => (
    <Stack spacing={2}>
      <Typography color="text.secondary">{roleHints}</Typography>

      <Paper sx={{ p: 2 }}>
        <Typography fontWeight="bold" mb={1}>Patient Summary</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <TextField label="Patient ID" fullWidth value={patientId} onChange={(e) => setPatientId(e.target.value)} />
          <Button variant="contained" onClick={() => runAction(async () => {
            const res = await aiService.getPatientSummary(patientId);
            return res?.data?.summary || res;
          }, 'Patient summary generated')} disabled={!patientId || loading}>Generate</Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography fontWeight="bold" mb={1}>Medical Report</Typography>
        <TextField label="Doctor Notes" multiline minRows={3} fullWidth value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)} />
        <Button sx={{ mt: 1 }} variant="contained" onClick={() => runAction(async () => {
          const res = await aiService.getMedicalReport({ doctorNotes });
          return res?.data?.report || res;
        }, 'Medical report generated')} disabled={!doctorNotes || loading}>Generate</Button>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography fontWeight="bold" mb={1}>Appointment Reminder</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <TextField label="Appointment ID" fullWidth value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} />
          <Button variant="contained" onClick={() => runAction(async () => {
            const res = await aiService.getReminderMessage(appointmentId);
            return res?.data?.message || res;
          }, 'Reminder generated')} disabled={!appointmentId || loading}>Generate</Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography fontWeight="bold" mb={1}>Chatbot</Typography>
        <TextField label="Query" fullWidth value={chatQuery} onChange={(e) => setChatQuery(e.target.value)} />
        <Button sx={{ mt: 1 }} variant="contained" onClick={() => runAction(async () => {
          const res = await aiService.handleChatbotQuery(chatQuery);
          return res?.data?.response || res;
        }, 'Chatbot response received')} disabled={!chatQuery || loading}>Ask</Button>
      </Paper>
    </Stack>
  );

  const renderAgentsTab = () => (
    <Stack spacing={2}>
      <Paper sx={{ p: 2 }}>
        <Typography fontWeight="bold" mb={1}>Manual Agent Triggers</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <TextField type="date" label="Schedule Date" slotProps={{ inputLabel: { shrink: true } }} value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
          <TextField label="Doctor ID (optional)" value={scheduleDoctorId} onChange={(e) => setScheduleDoctorId(e.target.value)} />
          <Button variant="contained" disabled={!canRun(role, 'scheduling') || loading} onClick={() => runAction(async () => {
            const res = await agentService.getSchedulingSuggestions({ date: scheduleDate || undefined, doctorId: scheduleDoctorId || undefined });
            await refreshAgentMeta();
            return res?.data?.suggestions || res?.data || res;
          }, 'Scheduling agent executed')}>Run Scheduling</Button>
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 1 }}>
          <Button variant="contained" disabled={!canRun(role, 'followUp') || loading} onClick={() => runAction(async () => {
            const res = await agentService.triggerFollowUpAgent();
            await refreshAgentMeta();
            return res?.data?.followUpMessages || res?.data || res;
          }, 'Follow-up agent executed')}>Run Follow-up</Button>
          <Button variant="contained" disabled={!canRun(role, 'inventory') || loading} onClick={() => runAction(async () => {
            const res = await agentService.triggerInventoryAgent();
            await refreshAgentMeta();
            return res?.data?.recommendations || res?.data || res;
          }, 'Inventory agent executed')}>Run Inventory</Button>
          <Button variant="contained" disabled={!canRun(role, 'billing') || loading} onClick={() => runAction(async () => {
            const res = await agentService.triggerBillingAgent();
            await refreshAgentMeta();
            return res?.data?.billingInsights || res?.data || res;
          }, 'Billing agent executed')}>Run Billing</Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography fontWeight="bold" mb={1}>Scheduled Jobs</Typography>
        {!schedules ? <Typography color="text.secondary">No schedule metadata available.</Typography> : (
          <Stack spacing={0.5}>
            <Typography>Enabled: {String(schedules.enabled)}</Typography>
            <Typography>Follow-up: {schedules.schedules?.followUp}</Typography>
            <Typography>Inventory: {schedules.schedules?.inventory}</Typography>
            <Typography>Billing: {schedules.schedules?.billing}</Typography>
            <Typography>Appointment reminders: {schedules.schedules?.appointmentReminders}</Typography>
          </Stack>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography fontWeight="bold" mb={1}>Execution History</Typography>
        {history.length === 0 ? <Typography color="text.secondary">No agent runs logged yet.</Typography> : (
          <Stack spacing={1}>
            {history.map((item) => (
              <Paper key={item.id} variant="outlined" sx={{ p: 1 }}>
                <Typography fontWeight="bold">{item.entityId}</Typography>
                <Typography variant="body2" color="text.secondary">{item.action} | {new Date(item.createdAt).toLocaleString()} | {item.actor ? `${item.actor.firstName || ''} ${item.actor.lastName || ''}`.trim() : 'System'}</Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  );

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={2}>AI Center</Typography>
      <Typography color="text.secondary" mb={2}>Generative AI and Agentic AI controls with role-aware access.</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)}>
          <Tab label="Generative AI" />
          <Tab label="AI Agents" />
        </Tabs>
      </Paper>

      {loading && <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><CircularProgress size={18} /><Typography variant="body2">Processing...</Typography></Box>}

      {tab === 0 ? renderGenAITab() : renderAgentsTab()}

      {result && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography fontWeight="bold" mb={1}>Latest Result</Typography>
          <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', m: 0 }}>{result}</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default AICenter;
