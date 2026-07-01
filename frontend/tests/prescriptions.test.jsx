import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Prescriptions from '../src/pages/Prescriptions';

jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'Doctor' } }),
}));

const mockGetPrescriptions = jest.fn();
const mockCreatePrescription = jest.fn();
const mockGetAllPatients = jest.fn();
const mockGetDoctors = jest.fn();
const mockGetMedicines = jest.fn();

jest.mock('../src/services/prescriptionService', () => ({
  prescriptionService: {
    getPrescriptions: (...args) => mockGetPrescriptions(...args),
    createPrescription: (...args) => mockCreatePrescription(...args),
    updatePrescription: jest.fn(),
    dispensePrescription: jest.fn(),
    deletePrescription: jest.fn(),
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

jest.mock('../src/services/medicineService', () => ({
  medicineService: {
    getMedicines: (...args) => mockGetMedicines(...args),
  },
}));

describe('Prescriptions page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPrescriptions.mockResolvedValue({
      data: {
        prescriptions: [
          {
            id: 'pre-1',
            status: 'Pending',
            patient: { firstName: 'Asha', lastName: 'Rao' },
            doctor: { user: { firstName: 'Vikram', lastName: 'Shah' } },
            prescriptionDate: '2026-06-28T00:00:00.000Z',
            items: [],
          },
        ],
      },
    });
    mockCreatePrescription.mockResolvedValue({ status: 'success' });
    mockGetAllPatients.mockResolvedValue({
      data: {
        patients: [{ id: '11111111-1111-4111-8111-111111111111', firstName: 'Asha', lastName: 'Rao' }],
      },
    });
    mockGetDoctors.mockResolvedValue({
      data: {
        doctors: [{
          id: '22222222-2222-4222-8222-222222222222',
          specialization: 'General',
          department: { name: 'General Medicine' },
          user: { firstName: 'Vikram', lastName: 'Shah' },
        }],
      },
    });
    mockGetMedicines.mockResolvedValue({
      data: {
        medicines: [{ id: '33333333-3333-4333-8333-333333333333', name: 'Paracetamol', medicineCode: 'MED-001' }],
      },
    });
  });

  test('renders prescriptions list', async () => {
    render(<Prescriptions />);

    await waitFor(() => expect(screen.getByText('Pending')).toBeInTheDocument());
    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
  });

  test('opens create dialog and submits', async () => {
    render(<Prescriptions />);

    await waitFor(() => expect(screen.getByText('Pending')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Create Prescription'));

    const patientInput = screen.getByRole('combobox', { name: 'Patient' });
    fireEvent.change(patientInput, { target: { value: 'Asha' } });
    fireEvent.keyDown(patientInput, { key: 'ArrowDown' });
    fireEvent.keyDown(patientInput, { key: 'Enter' });

    const doctorInput = screen.getByRole('combobox', { name: 'Doctor' });
    fireEvent.change(doctorInput, { target: { value: 'Vikram' } });
    fireEvent.keyDown(doctorInput, { key: 'ArrowDown' });
    fireEvent.keyDown(doctorInput, { key: 'Enter' });

    const medicineInput = screen.getByRole('combobox', { name: 'Medicine' });
    fireEvent.change(medicineInput, { target: { value: 'Para' } });
    fireEvent.keyDown(medicineInput, { key: 'ArrowDown' });
    fireEvent.keyDown(medicineInput, { key: 'Enter' });

    fireEvent.change(screen.getByLabelText('Dosage'), { target: { value: '1 tablet' } });
    fireEvent.change(screen.getByLabelText('Frequency'), { target: { value: 'Twice daily' } });
    fireEvent.change(screen.getByLabelText('Duration'), { target: { value: '5 days' } });
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '10' } });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => expect(mockCreatePrescription).toHaveBeenCalled());
  });
});
