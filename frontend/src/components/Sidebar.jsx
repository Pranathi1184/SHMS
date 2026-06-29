import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Dashboard,
  People,
  CalendarToday,
  Assignment,
  LocalHospital,
  MedicalServices,
  Receipt,
  Bed,
  AdminPanelSettings,
  Medication,
  HealthAndSafety,
  Apartment,
  SmartToy,
  TrendingUp,
  Warning,
  LocalPharmacy,
  AttachMoney,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 260;

const menuItems = {
  Administrator: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Patients', icon: <People />, path: '/patients' },
    { text: 'Appointments', icon: <CalendarToday />, path: '/appointments' },
    { text: 'Doctors', icon: <People />, path: '/doctors' },
    { text: 'Departments', icon: <Apartment />, path: '/departments' },
    { text: 'EHR', icon: <Assignment />, path: '/ehr' },
    { text: 'EHR Registry', icon: <Assignment />, path: '/ehr-list' },
    { text: 'Laboratory', icon: <MedicalServices />, path: '/laboratory' },
    { text: 'Pharmacy', icon: <Medication />, path: '/pharmacy' },
    { text: 'Prescriptions', icon: <HealthAndSafety />, path: '/prescriptions' },
    { text: 'Insurance', icon: <Assignment />, path: '/insurance' },
    { text: 'Billing', icon: <Receipt />, path: '/billing' },
    { text: 'Enterprise Ops', icon: <AdminPanelSettings />, path: '/enterprise-ops' },
    { text: 'AI Center', icon: <SmartToy />, path: '/ai-center' },
    { text: 'Predictions', icon: <TrendingUp />, path: '/predictions' },
    { text: 'Ward Management', icon: <Bed />, path: '/ward-management' },
    { text: 'Wards Overview', icon: <Bed />, path: '/wards' },
    { text: 'Admin', icon: <AdminPanelSettings />, path: '/admin' },
  ],
  Doctor: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Patients', icon: <People />, path: '/patients' },
    { text: 'Appointments', icon: <CalendarToday />, path: '/appointments' },
    { text: 'Doctors', icon: <People />, path: '/doctors' },
    { text: 'EHR', icon: <Assignment />, path: '/ehr' },
    { text: 'EHR Registry', icon: <Assignment />, path: '/ehr-list' },
    { text: 'Laboratory', icon: <MedicalServices />, path: '/laboratory' },
    { text: 'Prescriptions', icon: <HealthAndSafety />, path: '/prescriptions' },
    { text: 'Enterprise Ops', icon: <AdminPanelSettings />, path: '/enterprise-ops' },
    { text: 'AI Center', icon: <SmartToy />, path: '/ai-center' },
    { text: 'No-Show Predictions', icon: <Warning />, path: '/predictions/no-show' },
    { text: 'Workload Forecast', icon: <TrendingUp />, path: '/predictions/doctor-workload' },
    { text: 'Ward Management', icon: <Bed />, path: '/ward-management' },
    { text: 'Wards Overview', icon: <Bed />, path: '/wards' },
  ],
  Nurse: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Patients', icon: <People />, path: '/patients' },
    { text: 'Appointments', icon: <CalendarToday />, path: '/appointments' },
    { text: 'Doctors', icon: <People />, path: '/doctors' },
    { text: 'EHR', icon: <Assignment />, path: '/ehr' },
    { text: 'EHR Registry', icon: <Assignment />, path: '/ehr-list' },
    { text: 'Laboratory', icon: <MedicalServices />, path: '/laboratory' },
    { text: 'Pharmacy', icon: <Medication />, path: '/pharmacy' },
    { text: 'Enterprise Ops', icon: <AdminPanelSettings />, path: '/enterprise-ops' },
    { text: 'AI Center', icon: <SmartToy />, path: '/ai-center' },
    { text: 'Bed Occupancy', icon: <Bed />, path: '/predictions/bed-occupancy' },
    { text: 'Ward Management', icon: <Bed />, path: '/ward-management' },
    { text: 'Wards Overview', icon: <Bed />, path: '/wards' },
  ],
  Receptionist: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Patients', icon: <People />, path: '/patients' },
    { text: 'Appointments', icon: <CalendarToday />, path: '/appointments' },
    { text: 'Doctors', icon: <People />, path: '/doctors' },
    { text: 'Pharmacy', icon: <Medication />, path: '/pharmacy' },
    { text: 'Insurance', icon: <Assignment />, path: '/insurance' },
    { text: 'Billing', icon: <Receipt />, path: '/billing' },
    { text: 'Enterprise Ops', icon: <AdminPanelSettings />, path: '/enterprise-ops' },
    { text: 'AI Center', icon: <SmartToy />, path: '/ai-center' },
    { text: 'No-Show Predictions', icon: <Warning />, path: '/predictions/no-show' },
    { text: 'Ward Management', icon: <Bed />, path: '/ward-management' },
    { text: 'Wards Overview', icon: <Bed />, path: '/wards' },
  ],
  'Lab Technician': [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Laboratory', icon: <MedicalServices />, path: '/laboratory' },
    { text: 'AI Center', icon: <SmartToy />, path: '/ai-center' },
  ],
  Pharmacist: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Pharmacy', icon: <Medication />, path: '/pharmacy' },
    { text: 'Prescriptions', icon: <HealthAndSafety />, path: '/prescriptions' },
    { text: 'AI Center', icon: <SmartToy />, path: '/ai-center' },
    { text: 'Medicine Demand', icon: <LocalPharmacy />, path: '/predictions/medicine-demand' },
  ],
  'Billing Staff': [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Patients', icon: <People />, path: '/patients' },
    { text: 'Insurance', icon: <Assignment />, path: '/insurance' },
    { text: 'Billing', icon: <Receipt />, path: '/billing' },
    { text: 'Enterprise Ops', icon: <AdminPanelSettings />, path: '/enterprise-ops' },
    { text: 'AI Center', icon: <SmartToy />, path: '/ai-center' },
    { text: 'Billing Risk', icon: <AttachMoney />, path: '/predictions/billing-risk' },
  ],
  Patient: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'My Profile', icon: <People />, path: '/patient-profile' },
    { text: 'My Appointments', icon: <CalendarToday />, path: '/appointments' },
    { text: 'My Prescriptions', icon: <HealthAndSafety />, path: '/prescriptions' },
    { text: 'Doctors', icon: <People />, path: '/doctors' },
    { text: 'AI Center', icon: <SmartToy />, path: '/ai-center' },
  ],
};

const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <LocalHospital sx={{ fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight="bold" color="primary">
          SHMS
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          {user?.firstName?.charAt(0) || 'U'}
        </Avatar>
        <Box>
          <Typography variant="body1" fontWeight="medium">
            {user?.firstName} {user?.lastName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.role}
          </Typography>
        </Box>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1, px: 2 }}>
        {menuItems[user?.role]?.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                onMobileClose();
              }}
              sx={{
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;

