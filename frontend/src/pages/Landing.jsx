import React from 'react';
import { Box, Button, Card, CardContent, Container, Grid, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { AutoAwesome, CalendarToday, LocalHospital, Medication } from '@mui/icons-material';

const featureCards = [
  {
    title: 'Doctor Discovery and Booking',
    description: 'Search specialists, view availability, and schedule appointments quickly.',
    icon: <CalendarToday />,
  },
  {
    title: 'Clinical Workflows',
    description: 'Manage EHR, prescriptions, and follow-ups in one integrated system.',
    icon: <LocalHospital />,
  },
  {
    title: 'AI Operations Assistant',
    description: 'Use the floating assistant for scheduling, billing, inventory, and support queries.',
    icon: <AutoAwesome />,
  },
  {
    title: 'Pharmacy and Billing',
    description: 'Track medicines, low stock alerts, and billing operations with role-based access.',
    icon: <Medication />,
  },
];

const Landing = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#ecfeff', backgroundImage: 'radial-gradient(circle at 20% 20%, #99f6e4 0%, transparent 45%), radial-gradient(circle at 80% 30%, #bae6fd 0%, transparent 40%)' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
        <Paper sx={{ p: { xs: 3, md: 6 }, borderRadius: 4, mb: 4, background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)', color: 'white' }}>
          <Typography variant="overline" sx={{ letterSpacing: 1.6 }}>Smart Hospital Platform</Typography>
          <Typography variant="h3" fontWeight="bold" sx={{ mt: 1, mb: 2, fontSize: { xs: 32, md: 48 } }}>
            Doctor Appointment and Care Management
          </Typography>
          <Typography sx={{ opacity: 0.92, maxWidth: 760, mb: 3 }}>
            A role-based healthcare platform for administrators, doctors, nurses, technicians, and patients with appointment, EHR, prescription, and AI-assisted workflows.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button component={RouterLink} to="/login" variant="contained" sx={{ bgcolor: '#14b8a6', '&:hover': { bgcolor: '#0d9488' } }}>
              Login to Dashboard
            </Button>
            <Button component={RouterLink} to="/register" variant="outlined" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.6)' }}>
              Create Patient Account
            </Button>
          </Stack>
        </Paper>

        <Grid container spacing={2}>
          {featureCards.map((item) => (
            <Grid key={item.title} size={{ xs: 12, sm: 6 }}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent>
                  <Stack direction="row" spacing={1.25} alignItems="center" mb={1}>
                    <Box sx={{ color: 'primary.main' }}>{item.icon}</Box>
                    <Typography variant="h6" fontWeight="bold">{item.title}</Typography>
                  </Stack>
                  <Typography color="text.secondary">{item.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Landing;
