import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, CssBaseline, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import AIFloatingAssistant from './AIFloatingAssistant';
import CommandPalette from './CommandPalette';
import { useAuth } from '../contexts/AuthContext';

const routeLabel = (path) => {
  const map = {
    '/dashboard': 'Dashboard',
    '/patients': 'Patients',
    '/appointments': 'Appointments',
    '/billing': 'Billing',
    '/doctors': 'Doctors',
    '/patient-profile': 'My Profile',
    '/ehr': 'EHR',
    '/laboratory': 'Laboratory',
    '/pharmacy': 'Pharmacy',
    '/admin': 'Admin Hub',
  };
  return map[path] || path;
};

const MainLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const tourContent = useMemo(() => {
    const role = user?.role || 'User';
    const byRole = {
      Administrator: 'Use Admin Hub for operations, then command palette (Ctrl/Cmd+K) for quick navigation and the floating AI assistant for orchestration tasks.',
      Doctor: 'Start with Appointments and EHR. Use the floating AI assistant for summaries and scheduling suggestions.',
      Nurse: 'Use patient lists, EHR, and ward management modules. The floating assistant can help with quick operational queries.',
      Receptionist: 'Use Patients and Appointments heavily. Shortcuts: Alt+B books appointment, Alt+P finds patients.',
      Patient: 'Open My Profile and My Appointments from the sidebar. Use the floating assistant for guided help.',
      'Lab Technician': 'Use Laboratory workflows and notifications for test updates.',
      Pharmacist: 'Use Pharmacy and Prescriptions. The floating assistant handles inventory insights.',
      'Billing Staff': 'Use Billing and Insurance workflows with quick actions from command palette.',
    };
    return {
      title: `${role} Quick Tour`,
      body: byRole[role] || 'Use sidebar navigation, command palette (Ctrl/Cmd+K), and notifications for daily tasks.',
    };
  }, [user?.role]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMobileClose = () => {
    setMobileOpen(false);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const isMeta = event.metaKey || event.ctrlKey;

      if (isMeta && key === 'k') {
        event.preventDefault();
        setPaletteOpen((prev) => !prev);
      }

      if (event.altKey && key === 'b') {
        event.preventDefault();
        navigate('/appointments');
      }

      if (event.altKey && key === 'p') {
        event.preventDefault();
        navigate('/patients');
      }

      if (event.altKey && key === 'c') {
        event.preventDefault();
        navigate('/billing');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  useEffect(() => {
    if (!user?.role) return;
    if (!location.pathname || location.pathname === '/') return;

    const key = 'shms_recent_views';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = existing.filter((item) => item.path !== location.pathname);
    const updated = [{ path: location.pathname, label: routeLabel(location.pathname), ts: Date.now() }, ...filtered].slice(0, 8);
    localStorage.setItem(key, JSON.stringify(updated));
  }, [location.pathname, user?.role]);

  useEffect(() => {
    if (!user?.role) return;

    const key = `shms_onboarded_${user.role}`;
    const onboarded = localStorage.getItem(key) === 'true';
    if (!onboarded) {
      setTourOpen(true);
    }
  }, [user?.role]);

  const closeTour = () => {
    if (user?.role) {
      localStorage.setItem(`shms_onboarded_${user.role}`, 'true');
    }
    setTourOpen(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <TopNav onMenuClick={handleDrawerToggle} onOpenCommandPalette={() => setPaletteOpen(true)} />
      <Sidebar mobileOpen={mobileOpen} onMobileClose={handleMobileClose} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - 260px)` },
          mt: 8,
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
      <AIFloatingAssistant />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={navigate}
        role={user?.role}
      />

      <Dialog open={tourOpen} onClose={closeTour} maxWidth="sm" fullWidth>
        <DialogTitle>{tourContent.title}</DialogTitle>
        <DialogContent>
          <Typography>{tourContent.body}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeTour} variant="contained">Got it</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MainLayout;

