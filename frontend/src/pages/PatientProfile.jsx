import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Snackbar,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  MenuItem,
} from '@mui/material';
import { patientService } from '../services/patientService';

const PatientProfile = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patient, setPatient] = useState(null);
  const [docUploading, setDocUploading] = useState(false);
  const [docForm, setDocForm] = useState({ category: 'Other', notes: '', file: null });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phone: '',
    address: '',
    bloodType: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const upcomingAppointments = useMemo(() => {
    if (!patient?.appointments) return 0;
    const now = new Date();
    return patient.appointments.filter((apt) => {
      if (!apt.appointmentDate) return false;
      return new Date(apt.appointmentDate) >= now && apt.status !== 'Cancelled';
    }).length;
  }, [patient]);

  const activePrescriptions = useMemo(() => {
    if (!patient?.prescriptions) return 0;
    return patient.prescriptions.filter((rx) => rx.status === 'Pending').length;
  }, [patient]);

  const outstandingBills = useMemo(() => {
    if (!patient?.bills) return 0;
    return patient.bills.filter((bill) => bill.status !== 'Paid').length;
  }, [patient]);

  const timelineItems = useMemo(() => {
    const appointmentItems = (patient?.appointments || []).map((appointment) => ({
      id: `apt-${appointment.id}`,
      type: 'Appointment',
      date: appointment.appointmentDate,
      status: appointment.status || 'Scheduled',
      summary: `${appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : 'Unknown date'} ${appointment.startTime ? `at ${appointment.startTime}` : ''}`.trim(),
    }));

    const prescriptionItems = (patient?.prescriptions || []).map((prescription) => ({
      id: `rx-${prescription.id}`,
      type: 'Prescription',
      date: prescription.prescriptionDate || prescription.createdAt,
      status: prescription.status || 'Pending',
      summary: `Prescription ${prescription.status || 'Pending'}`,
    }));

    const billItems = (patient?.bills || []).map((bill) => ({
      id: `bill-${bill.id}`,
      type: 'Bill',
      date: bill.billDate || bill.createdAt,
      status: bill.status || 'Pending',
      summary: `Amount: $${Number(bill.totalAmount || 0).toFixed(2)}`,
    }));

    return [...appointmentItems, ...prescriptionItems, ...billItems]
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 12);
  }, [patient]);

  const doctorNotesItems = useMemo(() => {
    const records = patient?.ehrRecords || [];
    return [...records]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 10);
  }, [patient]);

  const fillForm = (patientRecord) => {
    setFormData({
      firstName: patientRecord.firstName || '',
      lastName: patientRecord.lastName || '',
      dateOfBirth: patientRecord.dateOfBirth || '',
      gender: patientRecord.gender || '',
      email: patientRecord.email || '',
      phone: patientRecord.phone || '',
      address: patientRecord.address || '',
      bloodType: patientRecord.bloodType || '',
      allergies: patientRecord.allergies || '',
      emergencyContactName: patientRecord.emergencyContactName || '',
      emergencyContactPhone: patientRecord.emergencyContactPhone || '',
    });
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await patientService.getMyProfile();
      const profile = response?.data || null;
      setPatient(profile);
      if (profile) {
        fillForm(profile);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load patient profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!patient?.id) return;

    try {
      setError('');
      await patientService.updatePatient(patient.id, formData);
      setSuccess('Profile updated successfully');
      await fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleDocumentUpload = async (event) => {
    event.preventDefault();
    if (!patient?.id || !docForm.file) {
      setError('Select a file to upload');
      return;
    }

    try {
      setDocUploading(true);
      setError('');
      await patientService.uploadPatientDocument(patient.id, docForm);
      setSuccess('Document uploaded successfully');
      setDocForm({ category: 'Other', notes: '', file: null });
      await fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setDocUploading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        My Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Upcoming Appointments</Typography>
              <Typography variant="h4" fontWeight="bold">{upcomingAppointments}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Active Prescriptions</Typography>
              <Typography variant="h4" fontWeight="bold">{activePrescriptions}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Outstanding Bills</Typography>
              <Typography variant="h4" fontWeight="bold">{outstandingBills}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Personal Details
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                <TextField label="First Name" value={formData.firstName} onChange={handleChange('firstName')} required />
                <TextField label="Last Name" value={formData.lastName} onChange={handleChange('lastName')} required />
                <TextField
                  label="Date of Birth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange('dateOfBirth')}
                  slotProps={{ inputLabel: { shrink: true } }}
                  required
                />
                <TextField label="Gender" value={formData.gender} onChange={handleChange('gender')} required />
                <TextField label="Email" value={formData.email} onChange={handleChange('email')} />
                <TextField label="Phone" value={formData.phone} onChange={handleChange('phone')} required />
                <TextField label="Blood Type" value={formData.bloodType} onChange={handleChange('bloodType')} />
                <TextField label="Allergies" value={formData.allergies} onChange={handleChange('allergies')} />
                <TextField label="Emergency Contact Name" value={formData.emergencyContactName} onChange={handleChange('emergencyContactName')} />
                <TextField label="Emergency Contact Phone" value={formData.emergencyContactPhone} onChange={handleChange('emergencyContactPhone')} />
              </Box>

              <TextField
                sx={{ mt: 2 }}
                fullWidth
                label="Address"
                value={formData.address}
                onChange={handleChange('address')}
                multiline
                minRows={2}
              />

              <Box sx={{ mt: 2 }}>
                <Button type="submit" variant="contained">
                  Save Profile
                </Button>
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Documents
            </Typography>

            <Box component="form" onSubmit={handleDocumentUpload} sx={{ mb: 2 }}>
              <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                <TextField
                  select
                  label="Category"
                  value={docForm.category}
                  onChange={(e) => setDocForm((prev) => ({ ...prev, category: e.target.value }))}
                >
                  {['Lab', 'Prescription', 'Invoice', 'Discharge', 'Other'].map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Notes"
                  value={docForm.notes}
                  onChange={(e) => setDocForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
                <TextField
                  type="file"
                  inputProps={{ accept: '.pdf,.png,.jpg,.jpeg,.doc,.docx,.txt' }}
                  onChange={(e) => setDocForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
                />
              </Box>
              <Box sx={{ mt: 1.5 }}>
                <Button type="submit" variant="contained" disabled={docUploading}>
                  {docUploading ? 'Uploading...' : 'Upload Document'}
                </Button>
              </Box>
            </Box>

            <Divider sx={{ mb: 1.5 }} />

            {(!patient?.documents || patient.documents.length === 0) && (
              <Typography color="text.secondary">No documents uploaded yet.</Typography>
            )}

            {!!patient?.documents?.length && (
              <List>
                {patient.documents.map((doc) => (
                  <ListItem
                    key={doc.id}
                    secondaryAction={
                      <Button variant="outlined" size="small" href={doc.fileUrl} target="_blank" rel="noreferrer">
                        Open
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={`${doc.originalName} (${doc.category || 'Other'})`}
                      secondary={`Uploaded: ${doc.createdAt ? new Date(doc.createdAt).toLocaleString() : 'Unknown'}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Patient Timeline
            </Typography>
            {timelineItems.length === 0 && (
              <Typography color="text.secondary">No timeline activity yet.</Typography>
            )}
            {timelineItems.map((item) => (
              <Box key={item.id} sx={{ pb: 1.5, mb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Typography fontWeight="bold" variant="body2">{item.type}</Typography>
                  <Chip size="small" label={item.status} color={item.status === 'Cancelled' ? 'error' : 'primary'} />
                </Box>
                <Typography variant="body2" color="text.secondary">{item.summary}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.date ? new Date(item.date).toLocaleString() : 'Unknown'}
                </Typography>
              </Box>
            ))}
          </Paper>

          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Doctor Notes
            </Typography>
            {doctorNotesItems.length === 0 && (
              <Typography color="text.secondary">No doctor notes available yet.</Typography>
            )}
            {doctorNotesItems.map((note) => (
              <Box key={note.id} sx={{ pb: 1.5, mb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography fontWeight="bold" variant="body2">
                  {note.doctor?.user ? `Dr. ${note.doctor.user.firstName || ''} ${note.doctor.user.lastName || ''}`.trim() : 'Doctor'}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  {note.createdAt ? new Date(note.createdAt).toLocaleString() : 'Unknown date'}
                </Typography>
                {note.diagnosis && (
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Diagnosis:</strong> {note.diagnosis}
                  </Typography>
                )}
                {note.notes && (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    <strong>Notes:</strong> {note.notes}
                  </Typography>
                )}
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={!!success} autoHideDuration={3500} onClose={() => setSuccess('')}>
        <Alert severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PatientProfile;
