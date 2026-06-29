const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const React = require('react');
const { fireEvent, render, screen, waitFor } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');
const Login = require('../src/pages/Login').default;
const Register = require('../src/pages/Register').default;
const PatientProfile = require('../src/pages/PatientProfile').default;

const mockLogin = jest.fn();
const mockRegister = jest.fn();
const mockGetMyProfile = jest.fn();
const mockUpdatePatient = jest.fn();

jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
  }),
}));

jest.mock('../src/services/patientService', () => ({
  patientService: {
    getMyProfile: (...args) => mockGetMyProfile(...args),
    updatePatient: (...args) => mockUpdatePatient(...args),
  },
}));

describe('patient portal surfaces', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMyProfile.mockResolvedValue({
      data: {
        id: 42,
        firstName: 'Ava',
        lastName: 'Patel',
        email: 'ava.patient@example.com',
        phone: '5551234567',
      },
    });
    mockUpdatePatient.mockResolvedValue({ data: { message: 'Patient updated successfully' } });
  });

  it('shows demo credentials and logs a patient in', async () => {
    render(
      React.createElement(MemoryRouter, null, React.createElement(Login))
    );

    expect(screen.getByText(/Demo Credentials/i)).toBeInTheDocument();
    expect(screen.getByText(/Patient: ananya\.iyer\.patient@shms\.com/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'ananya.iyer.patient@shms.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'patient123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalled());
  });

  it('registers a patient account', async () => {
    mockRegister.mockResolvedValue({});

    render(
      React.createElement(MemoryRouter, null, React.createElement(Register))
    );

    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Ava' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Patel' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'ava.patient@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '5551234567' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'patient123' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1995-04-12' } });
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /Gender/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Female' }));

    fireEvent.click(screen.getByRole('button', { name: /Create Patient Account/i }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalled());
  });

  it('loads the current patient profile', async () => {
    render(
      React.createElement(MemoryRouter, null, React.createElement(PatientProfile))
    );

    expect(await screen.findByText(/My Profile/i)).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Ava')).toBeInTheDocument();
    expect(mockGetMyProfile).toHaveBeenCalled();
  });

  it('saves patient profile changes', async () => {
    render(
      React.createElement(MemoryRouter, null, React.createElement(PatientProfile))
    );

    const firstNameField = await screen.findByLabelText(/First Name/i);
    fireEvent.change(firstNameField, { target: { value: 'Avery' } });

    expect(firstNameField).toHaveValue('Avery');
  });
});
