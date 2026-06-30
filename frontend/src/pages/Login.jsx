import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  CssBaseline,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import { LocalHospital } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }, []);

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const applyDemoCredentials = (email, password) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
  };

  return (
    <Container component="main" maxWidth="sm">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', background: 'linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <LocalHospital sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography component="h1" variant="h5" fontWeight="bold">
              SHMS Login
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Invalid email address',
                },
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              {...register('password', { required: 'Password is required' })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            <Button
              fullWidth
              component={RouterLink}
              to="/register"
              variant="text"
            >
              New Patient? Create Account
            </Button>

            <Paper variant="outlined" sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Demo credentials
              </Typography>
              <Typography variant="body2">Admin: admin@shms.com / admin123</Typography>
              <Typography variant="body2">Doctor: doctor@shms.com / password123</Typography>
              <Typography variant="body2">Nurse: nurse@shms.com / password123</Typography>
              <Typography variant="body2">Receptionist: reception@shms.com / password123</Typography>
              <Typography variant="body2">Lab Technician: lab@shms.com / password123</Typography>
              <Typography variant="body2">Pharmacist: pharmacy@shms.com / password123</Typography>
              <Typography variant="body2">Billing Staff: billing@shms.com / password123</Typography>
              <Typography variant="body2">Patient: ananya.iyer.patient@shms.com / patient123</Typography>
              <Box sx={{ mt: 1.25, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button size="small" variant="outlined" onClick={() => applyDemoCredentials('admin@shms.com', 'admin123')}>
                  Use Admin Demo
                </Button>
                <Button size="small" variant="outlined" onClick={() => applyDemoCredentials('doctor@shms.com', 'password123')}>
                  Use Doctor Demo
                </Button>
                <Button size="small" variant="outlined" onClick={() => applyDemoCredentials('nurse@shms.com', 'password123')}>
                  Use Nurse Demo
                </Button>
                <Button size="small" variant="outlined" onClick={() => applyDemoCredentials('reception@shms.com', 'password123')}>
                  Use Reception Demo
                </Button>
                <Button size="small" variant="outlined" onClick={() => applyDemoCredentials('lab@shms.com', 'password123')}>
                  Use Lab Demo
                </Button>
                <Button size="small" variant="outlined" onClick={() => applyDemoCredentials('pharmacy@shms.com', 'password123')}>
                  Use Pharmacy Demo
                </Button>
                <Button size="small" variant="outlined" onClick={() => applyDemoCredentials('billing@shms.com', 'password123')}>
                  Use Billing Demo
                </Button>
                <Button size="small" variant="contained" onClick={() => applyDemoCredentials('ananya.iyer.patient@shms.com', 'patient123')}>
                  Use Patient Demo
                </Button>
              </Box>
            </Paper>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;

