import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { patientService } from '../services/patientService';
import { useNavigate } from 'react-router-dom';
import { toUserFriendlyError } from '../utils/errorMessages';

const STEPS = ['Identity', 'Contact', 'Clinical'];

const AddPatient = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm();

  const stepFields = [
    ['firstName', 'lastName', 'dateOfBirth', 'gender'],
    ['email', 'phone', 'address'],
    ['medicalHistory'],
  ];

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    try {
      await patientService.createPatient(data);
      navigate('/patients');
    } catch (err) {
      setError(toUserFriendlyError(err, 'Unable to create patient profile right now.'));
    } finally {
      setLoading(false);
    }
  };

  const goNext = async () => {
    const valid = await trigger(stepFields[activeStep]);
    if (valid) {
      setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const goBack = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/patients')} sx={{ mr: 2 }}>
          Back
        </Button>
        <Typography variant="h4" fontWeight="bold">
          Add New Patient
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3} sx={{ pb: 11 }}>
            {(activeStep === 0) && (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="First Name"
                    {...register('firstName', { required: 'First name is required' })}
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    {...register('lastName', { required: 'Last name is required' })}
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    type="date"
                    slotProps={{ inputLabel: { shrink: true } }}
                    {...register('dateOfBirth', { required: 'Date of birth is required' })}
                    error={!!errors.dateOfBirth}
                    helperText={errors.dateOfBirth?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Gender"
                    {...register('gender', { required: 'Gender is required' })}
                    error={!!errors.gender}
                    helperText={errors.gender?.message}
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Grid>
              </>
            )}

            {(activeStep === 1) && (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Invalid email',
                      },
                    })}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Phone"
                    {...register('phone', { required: 'Phone is required' })}
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Address"
                    multiline
                    rows={3}
                    {...register('address')}
                  />
                </Grid>
              </>
            )}

            {(activeStep === 2) && (
              <>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Medical History"
                    multiline
                    rows={6}
                    {...register('medicalHistory')}
                    helperText="Include allergies, chronic conditions, and relevant prior treatment details."
                  />
                </Grid>
              </>
            )}

            <Grid size={{ xs: 12 }}>
              <Paper
                sx={{
                  position: 'sticky',
                  bottom: 12,
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  zIndex: 1,
                }}
              >
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/patients')}
                      startIcon={<ArrowBack />}
                    >
                      Cancel
                    </Button>
                    {activeStep > 0 && (
                      <Button variant="outlined" onClick={goBack}>
                        Back
                      </Button>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {activeStep < STEPS.length - 1 && (
                      <Button variant="contained" onClick={goNext}>
                        Next
                      </Button>
                    )}
                    {activeStep === STEPS.length - 1 && (
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<Save />}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Save Patient'}
                      </Button>
                    )}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default AddPatient;

