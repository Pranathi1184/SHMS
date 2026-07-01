import React, { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Fab,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';
import { AutoAwesome, Close, Send, SmartToy } from '@mui/icons-material';
import { aiService } from '../services/aiService';
import { agentService } from '../services/agentService';
import { useAuth } from '../contexts/AuthContext';

const roleSets = {
  scheduling: ['Administrator', 'Receptionist', 'Doctor', 'Nurse', 'Lab Technician', 'Pharmacist', 'Billing Staff', 'Patient'],
  followUp: ['Administrator', 'Nurse', 'Doctor'],
  inventory: ['Administrator', 'Pharmacist'],
  billing: ['Administrator', 'Billing Staff'],
};

const canUse = (role, key) => roleSets[key].includes(role);

const asText = (value) => {
  if (!value) return 'No response received.';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

const parseScheduleCommand = (message) => {
  const dateMatch = message.match(/\b\d{4}-\d{2}-\d{2}\b/);
  const uuidMatch = message.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  const licenseMatch = message.match(/\bDOC-[A-Z0-9-]{3,}\b/i);

  return {
    date: dateMatch?.[0],
    doctorId: uuidMatch?.[0] || licenseMatch?.[0],
    context: message.replace(dateMatch?.[0] || '', '').replace(uuidMatch?.[0] || licenseMatch?.[0] || '', '').trim(),
  };
};

const AIFloatingAssistant = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  const role = user?.role;

  const assistantIntro = useMemo(() => {
    if (role === 'Administrator') {
      return 'Hi Admin. I can provide hospital-wide operational insights and run admin-approved agents.';
    }
    if (role === 'Doctor') {
      return 'Hi Doctor. I can help with your schedule, follow-ups, and doctor-scoped patient guidance.';
    }
    if (role === 'Patient') {
      return 'Hi. I can help with your own appointments, prescriptions, and next-step guidance.';
    }
    return 'Hi, I am your SHMS copilot. Ask hospital workflow questions or trigger role-approved agent actions.';
  }, [role]);

  const quickHints = useMemo(() => {
    const hints = ['Ask: summarize todays priorities'];
    if (role === 'Patient') {
      hints.push('Ask: summarize my upcoming appointments');
      hints.push('Ask: what should I prepare for my next visit');
    } else {
      hints.push('Ask: patient communication draft');
    }
    if (canUse(role, 'scheduling')) hints.push('Run scheduling for 2026-07-01');
    if (canUse(role, 'followUp')) hints.push('Run follow up agent');
    if (canUse(role, 'inventory')) hints.push('Run inventory check');
    if (canUse(role, 'billing')) hints.push('Run billing insights');
    return hints;
  }, [role]);

  const addMessage = (roleName, text) => {
    setMessages((prev) => [...prev, { role: roleName, text }]);
  };

  const userContext = useMemo(() => ({
    role: user?.role,
    userId: user?.id,
    email: user?.email,
    firstName: user?.firstName,
    lastName: user?.lastName,
  }), [user]);

  const runByIntent = async (rawMessage) => {
    const message = rawMessage.toLowerCase();

    if ((message.includes('schedule') || message.includes('slot')) && canUse(role, 'scheduling')) {
      const { date, doctorId, context } = parseScheduleCommand(rawMessage);
      if (!date) {
        return 'Please provide a schedule date in YYYY-MM-DD format before I run scheduling. Example: Run scheduling for 2026-07-02.';
      }
      const response = await agentService.getSchedulingSuggestions({ date, doctorId, context: context || undefined });
      const data = response?.data || {};
      return asText(data.suggestions || data);
    }

    if ((message.includes('follow up') || message.includes('follow-up')) && canUse(role, 'followUp')) {
      if (rawMessage.trim().split(/\s+/).length < 4) {
        return 'Please add follow-up details first. Example: Run follow up agent for discharged cardiac patients from yesterday.';
      }
      const response = await agentService.triggerFollowUpAgent({ context: rawMessage.trim() });
      return asText(response?.data?.followUpMessages || response?.data || response);
    }

    if ((message.includes('inventory') || message.includes('stock')) && canUse(role, 'inventory')) {
      if (rawMessage.trim().split(/\s+/).length < 4) {
        return 'Please add inventory focus details first. Example: Run inventory check for ICU medicines and low stock risk.';
      }
      const response = await agentService.triggerInventoryAgent({ context: rawMessage.trim() });
      return asText(response?.data?.recommendations || response?.data || response);
    }

    if ((message.includes('billing') || message.includes('pending bill') || message.includes('dues')) && canUse(role, 'billing')) {
      if (rawMessage.trim().split(/\s+/).length < 4) {
        return 'Please add billing scope details first. Example: Run billing insights for pending bills older than 30 days.';
      }
      const response = await agentService.triggerBillingAgent({ context: rawMessage.trim() });
      return asText(response?.data?.billingInsights || response?.data || response);
    }

    const response = await aiService.handleChatbotQuery(rawMessage, undefined, userContext);
    return asText(response?.data?.response || response?.message || response);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    addMessage('user', text);
    setInput('');

    try {
      setLoading(true);
      const reply = await runByIntent(text);
      addMessage('assistant', reply);
    } catch (error) {
      const status = error?.response?.status;
      const serverMessage = error?.response?.data?.message;

      if (status === 403) {
        addMessage('assistant', 'Your role is not allowed for that agent action. I can still answer general hospital questions.');
      } else if (status === 404) {
        addMessage('assistant', 'Agent endpoint was not found. Backend routes may not be updated yet.');
      } else {
        addMessage('assistant', serverMessage || 'I could not process that request right now. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Tooltip title="AI Assistant" placement="left">
        <Badge color="secondary" variant="dot" overlap="circular" invisible={open}>
          <Fab
            color="primary"
            aria-label="Open AI assistant"
            onClick={() => setOpen((prev) => !prev)}
            sx={{
              position: 'fixed',
              right: 24,
              bottom: 24,
              zIndex: 1400,
              boxShadow: '0 10px 24px rgba(15, 118, 110, 0.35)',
            }}
          >
            <SmartToy />
          </Fab>
        </Badge>
      </Tooltip>

      {open && (
        <Paper
          elevation={10}
          sx={{
            position: 'fixed',
            right: 24,
            bottom: 96,
            width: { xs: 'calc(100vw - 24px)', sm: 420 },
            maxWidth: 'calc(100vw - 24px)',
            height: { xs: '70vh', sm: 560 },
            zIndex: 1400,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 3,
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              background: 'linear-gradient(135deg, #0f766e 0%, #0ea5a4 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesome fontSize="small" />
              <Typography fontWeight="bold">SHMS AI Assistant</Typography>
              {role && <Chip size="small" label={role} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />}
            </Box>
            <IconButton size="small" sx={{ color: 'white' }} onClick={() => setOpen(false)}>
              <Close fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {quickHints.map((hint) => (
              <Chip
                key={hint}
                size="small"
                variant="outlined"
                label={hint}
                onClick={() => setInput(hint)}
              />
            ))}
          </Box>

          <Stack sx={{ p: 1.5, gap: 1, flexGrow: 1, overflowY: 'auto', bgcolor: '#f8fafc' }}>
            {messages.length === 0 && (
              <Paper sx={{ p: 1.25, maxWidth: '92%', alignSelf: 'flex-start', bgcolor: 'white' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {assistantIntro}
                </Typography>
              </Paper>
            )}
            {messages.map((msg, index) => (
              <Paper
                key={`${msg.role}-${index}`}
                sx={{
                  p: 1.25,
                  maxWidth: '92%',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  bgcolor: msg.role === 'user' ? '#ccfbf1' : 'white',
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {msg.text}
                </Typography>
              </Paper>
            ))}

            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">Thinking...</Typography>
              </Box>
            )}
          </Stack>

          <Box sx={{ p: 1.25, borderTop: '1px solid #e2e8f0', bgcolor: 'white', display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a request..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <IconButton color="primary" onClick={handleSend} disabled={loading || !input.trim()}>
              <Send />
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default AIFloatingAssistant;
