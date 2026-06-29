import React, { useMemo, useState } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import { Search, CorporateFare } from '@mui/icons-material';

const sharedActions = [
  { id: 'dashboard', label: 'Go to Dashboard', path: '/dashboard', keywords: 'home overview dashboard' },
  { id: 'appointments', label: 'Book Appointment', path: '/appointments', keywords: 'appointment booking schedule' },
  { id: 'find-patient', label: 'Find Patient', path: '/patients', keywords: 'patient search registry' },
  { id: 'create-bill', label: 'Create Bill', path: '/billing', keywords: 'billing invoice payment bill' },
  { id: 'doctors', label: 'Open Doctors Directory', path: '/doctors', keywords: 'doctor consultant clinician' },
];

const roleActions = {
  Administrator: [
    { id: 'admin-hub', label: 'Open Admin Hub', path: '/admin', keywords: 'admin operations' },
    { id: 'enterprise-ops-admin', label: 'Open Enterprise Ops', path: '/enterprise-ops', keywords: 'enterprise claims discharge communication analytics' },
    { id: 'departments', label: 'Open Departments', path: '/departments', keywords: 'department' },
  ],
  Doctor: [
    { id: 'ehr', label: 'Open EHR', path: '/ehr', keywords: 'ehr medical records' },
    { id: 'enterprise-ops-doctor', label: 'Open Enterprise Ops', path: '/enterprise-ops', keywords: 'enterprise claims discharge communication analytics' },
  ],
  Nurse: [
    { id: 'ward-management', label: 'Open Ward Management', path: '/ward-management', keywords: 'ward management' },
    { id: 'enterprise-ops-nurse', label: 'Open Enterprise Ops', path: '/enterprise-ops', keywords: 'enterprise claims discharge communication analytics' },
  ],
  Receptionist: [
    { id: 'billing', label: 'Open Billing', path: '/billing', keywords: 'billing' },
    { id: 'enterprise-ops-receptionist', label: 'Open Enterprise Ops', path: '/enterprise-ops', keywords: 'enterprise claims discharge communication analytics' },
  ],
  'Billing Staff': [
    { id: 'billing', label: 'Open Billing', path: '/billing', keywords: 'billing' },
    { id: 'enterprise-ops-billing', label: 'Open Enterprise Ops', path: '/enterprise-ops', keywords: 'enterprise claims discharge communication analytics' },
  ],
  Patient: [
    { id: 'my-profile', label: 'Open My Profile', path: '/patient-profile', keywords: 'profile patient self' },
    { id: 'my-rx', label: 'Open My Prescriptions', path: '/prescriptions', keywords: 'prescription medicines' },
  ],
};

const CommandPalette = ({ open, onClose, onNavigate, role }) => {
  const [query, setQuery] = useState('');

  const actions = useMemo(() => {
    const scoped = [...sharedActions, ...(roleActions[role] || [])];
    const q = query.trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter((item) => `${item.label} ${item.keywords}`.toLowerCase().includes(q));
  }, [query, role]);

  const handleSelect = (path) => {
    onNavigate(path);
    setQuery('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogContent sx={{ pt: 2 }}>
        <TextField
          autoFocus
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search actions..."
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            Quick keys: Ctrl/Cmd+K opens this palette. Alt+B books appointment, Alt+P finds patients, Alt+C opens billing.
          </Typography>
        </Box>

        <List sx={{ mt: 1 }}>
          {actions.length === 0 && (
            <ListItemButton disabled>
              <ListItemText primary="No matching actions" />
            </ListItemButton>
          )}
          {actions.map((action) => (
            <ListItemButton key={action.id} onClick={() => handleSelect(action.path)}>
              <ListItemText primary={action.label} secondary={action.path} />
              {action.path === '/enterprise-ops' && <CorporateFare fontSize="small" color="action" />}
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
