import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
        }}
      >
        <Typography variant="h1" fontWeight="bold" color="error" mb={2}>
          403
        </Typography>
        <Typography variant="h4" mb={4}>
          Unauthorized Access
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          You don't have permission to access this page.
        </Typography>
        <Button variant="contained" size="large" onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
      </Box>
    </Container>
  );
};

export default Unauthorized;

