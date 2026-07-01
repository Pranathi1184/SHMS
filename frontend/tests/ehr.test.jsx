import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import EHR from '../src/pages/EHR';

jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'Doctor' } }),
}));

const mockGetEHRs = jest.fn();
const mockCreateEHR = jest.fn();
const mockGetAllPatients = jest.fn();
const mockGetDoctors = jest.fn();
const mockGetAppointments = jest.fn();

jest.mock('../src/services/ehrService', () => ({
  ehrService: {
    getEHRs: (...args) => mockGetEHRs(...args),
    createEHR: (...args) => mockCreateEHR(...args),
    updateEHR: jest.fn(),
    deleteEHR: jest.fn(),
  },
}));

jest.mock('../src/services/patientService', () => ({
  patientService: {
    getAllPatients: (...args) => mockGetAllPatients(...args),
  },
}));

jest.mock('../src/services/doctorService', () => ({
  doctorService: {
    getDoctors: (...args) => mockGetDoctors(...args),
  },
}));

jest.mock('../src/services/appointmentService', () => ({
  appointmentService: {
    getAppointments: (...args) => mockGetAppointments(...args),
  },
}));

describe('EHR page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEHRs.mockResolvedValue({
      data: {
        ehrs: [
          {
            id: 'ehr-1',
            diagnosis: 'Flu',
            patient: { firstName: 'Asha', lastName: 'Rao' },
            doctor: { user: { firstName: 'Vikram', lastName: 'Shah' } },
          },
        ],
      },
    });
    mockCreateEHR.mockResolvedValue({ status: 'success' });
    mockGetAllPatients.mockResolvedValue({
      data: {
        patients: [{ id: '11111111-1111-1111-1111-111111111111', firstName: 'Asha', lastName: 'Rao' }],
      },
    });
    mockGetDoctors.mockResolvedValue({
      data: {
        doctors: [{
          id: '22222222-2222-2222-2222-222222222222',
          specialization: 'General',
          department: { name: 'General Medicine' },
          user: { firstName: 'Vikram', lastName: 'Shah' },
        }],
      },
    });
    mockGetAppointments.mockResolvedValue({ data: { appointments: [] } });
  });

  test('renders EHR table data', async () => {
    render(<EHR />);

    await waitFor(() => expect(screen.getByText('Flu')).toBeInTheDocument());
    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
  });

  test('opens add EHR dialog and submits', async () => {
    render(<EHR />);

    await waitFor(() => expect(screen.getByText('Flu')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Add EHR'));

    const patientInput = screen.getByRole('combobox', { name: 'Patient' });
    fireEvent.change(patientInput, { target: { value: 'Asha' } });
    fireEvent.keyDown(patientInput, { key: 'ArrowDown' });
    fireEvent.keyDown(patientInput, { key: 'Enter' });

    const doctorInput = screen.getByRole('combobox', { name: 'Doctor' });
    fireEvent.change(doctorInput, { target: { value: 'Vikram' } });
    fireEvent.keyDown(doctorInput, { key: 'ArrowDown' });
    fireEvent.keyDown(doctorInput, { key: 'Enter' });

    fireEvent.change(screen.getByLabelText('Diagnosis'), {
      target: { value: 'Migraine' },
    });

    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => expect(mockCreateEHR).toHaveBeenCalled());
  });
});
