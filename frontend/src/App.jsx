import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, CircularProgress, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PatientProfile = lazy(() => import('./pages/PatientProfile'));
const PatientsList = lazy(() => import('./pages/PatientsList'));
const AddPatient = lazy(() => import('./pages/AddPatient'));
const ViewPatient = lazy(() => import('./pages/ViewPatient'));
const EditPatient = lazy(() => import('./pages/EditPatient'));
const AppointmentsList = lazy(() => import('./pages/AppointmentsList'));
const AppointmentDetails = lazy(() => import('./pages/AppointmentDetails'));
const Departments = lazy(() => import('./pages/Departments'));
const EHR = lazy(() => import('./pages/EHR'));
const Laboratory = lazy(() => import('./pages/Laboratory'));
const Pharmacy = lazy(() => import('./pages/Pharmacy'));
const Prescriptions = lazy(() => import('./pages/Prescriptions'));
const Insurance = lazy(() => import('./pages/Insurance'));
const Billing = lazy(() => import('./pages/Billing'));
const WardManagement = lazy(() => import('./pages/WardManagement'));
const Admin = lazy(() => import('./pages/Admin'));
const DoctorsList = lazy(() => import('./pages/DoctorsList'));
const EHRList = lazy(() => import('./pages/EHRList'));
const Wards = lazy(() => import('./pages/Wards'));
const EnterpriseOps = lazy(() => import('./pages/EnterpriseOps'));
const AICenter = lazy(() => import('./pages/AICenter'));
const PredictionsDashboard = lazy(() => import('./pages/PredictionsDashboard'));
const NoShowPredictions = lazy(() => import('./pages/NoShowPredictions'));
const DoctorWorkload = lazy(() => import('./pages/DoctorWorkload'));
const MedicineDemand = lazy(() => import('./pages/MedicineDemand'));
const BedOccupancy = lazy(() => import('./pages/BedOccupancy'));
const BillingRisk = lazy(() => import('./pages/BillingRisk'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

const theme = createTheme({
  palette: {
    primary: {
      main: '#0F766E',
    },
    secondary: {
      main: '#14B8A6',
    },
    success: {
      main: '#15803D',
    },
    warning: {
      main: '#C2410C',
    },
    error: {
      main: '#B91C1C',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Source Sans 3", "Segoe UI", sans-serif',
    h4: { fontWeight: 700, letterSpacing: 0.2 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 14,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
  },
});

function App() {
  const loadingFallback = (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <CircularProgress />
    </Box>
  );

  const withLayout = (element, allowedRoles) => (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <MainLayout>{element}</MainLayout>
    </ProtectedRoute>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Suspense fallback={loadingFallback}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              <Route path="/dashboard" element={withLayout(<Dashboard />)} />

              <Route
                path="/patients"
                element={withLayout(
                  <PatientsList />,
                  ['Administrator', 'Doctor', 'Nurse', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Billing Staff']
                )}
              />
              <Route
                path="/patients/add"
                element={withLayout(<AddPatient />, ['Administrator', 'Doctor', 'Nurse', 'Receptionist'])}
              />
              <Route
                path="/patients/:id"
                element={withLayout(<ViewPatient />, ['Administrator', 'Doctor', 'Nurse', 'Receptionist'])}
              />
              <Route
                path="/patients/:id/edit"
                element={withLayout(<EditPatient />, ['Administrator', 'Doctor', 'Nurse', 'Receptionist'])}
              />

              <Route
                path="/appointments"
                element={withLayout(
                  <AppointmentsList />,
                  ['Administrator', 'Doctor', 'Nurse', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Billing Staff', 'Patient']
                )}
              />
              <Route
                path="/appointments/:id"
                element={withLayout(
                  <AppointmentDetails />,
                  ['Administrator', 'Doctor', 'Nurse', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Billing Staff', 'Patient']
                )}
              />

              <Route path="/departments" element={withLayout(<Departments />, ['Administrator'])} />

              <Route
                path="/ehr"
                element={withLayout(<EHR />, ['Administrator', 'Doctor', 'Lab Technician', 'Pharmacist', 'Nurse'])}
              />
              <Route path="/ehr-list" element={withLayout(<EHRList />, ['Administrator', 'Doctor', 'Nurse'])} />

              <Route
                path="/laboratory"
                element={withLayout(
                  <Laboratory />,
                  ['Administrator', 'Doctor', 'Nurse', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Billing Staff']
                )}
              />

              <Route
                path="/pharmacy"
                element={withLayout(
                  <Pharmacy />,
                  ['Administrator', 'Doctor', 'Nurse', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Billing Staff']
                )}
              />

              <Route
                path="/prescriptions"
                element={withLayout(
                  <Prescriptions />,
                  ['Administrator', 'Doctor', 'Nurse', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Billing Staff', 'Patient']
                )}
              />

              <Route path="/patient-profile" element={withLayout(<PatientProfile />, ['Patient'])} />

              <Route
                path="/insurance"
                element={withLayout(<Insurance />, ['Administrator', 'Doctor', 'Nurse', 'Receptionist', 'Billing Staff'])}
              />

              <Route
                path="/billing"
                element={withLayout(<Billing />, ['Administrator', 'Doctor', 'Nurse', 'Receptionist', 'Billing Staff'])}
              />

              <Route
                path="/enterprise-ops"
                element={withLayout(<EnterpriseOps />, ['Administrator', 'Doctor', 'Nurse', 'Receptionist', 'Billing Staff'])}
              />

              <Route
                path="/ai-center"
                element={withLayout(
                  <AICenter />,
                  ['Administrator', 'Doctor', 'Nurse', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Billing Staff', 'Patient']
                )}
              />

              {/* Prediction Dashboard Routes */}
              <Route
                path="/predictions"
                element={withLayout(<PredictionsDashboard />, ['Administrator'])}
              />
              <Route
                path="/predictions/no-show"
                element={withLayout(<NoShowPredictions />, ['Administrator', 'Receptionist', 'Doctor'])}
              />
              <Route
                path="/predictions/doctor-workload"
                element={withLayout(<DoctorWorkload />, ['Administrator', 'Doctor'])}
              />
              <Route
                path="/predictions/medicine-demand"
                element={withLayout(<MedicineDemand />, ['Administrator', 'Pharmacist'])}
              />
              <Route
                path="/predictions/bed-occupancy"
                element={withLayout(<BedOccupancy />, ['Administrator', 'Nurse'])}
              />
              <Route
                path="/predictions/billing-risk"
                element={withLayout(<BillingRisk />, ['Administrator', 'Billing Staff'])}
              />

              <Route path="/ward-management" element={withLayout(<WardManagement />, ['Administrator', 'Nurse', 'Receptionist', 'Doctor'])} />
              <Route path="/wards" element={withLayout(<Wards />, ['Administrator', 'Doctor', 'Nurse', 'Receptionist'])} />

              <Route path="/doctors" element={withLayout(<DoctorsList />, ['Administrator', 'Doctor', 'Receptionist', 'Nurse', 'Patient'])} />
              <Route path="/admin" element={withLayout(<Admin />, ['Administrator'])} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

