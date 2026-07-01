import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Laboratory from '../src/pages/Laboratory';

jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'Doctor' } }),
}));

const mockGetLabTests = jest.fn();
const mockCreateLabTest = jest.fn();
const mockGetAllPatients = jest.fn();
const mockGetDoctors = jest.fn();

jest.mock('../src/services/laboratoryTestService', () => ({
  laboratoryTestService: {
    getLabTests: (...args) => mockGetLabTests(...args),
    createLabTest: (...args) => mockCreateLabTest(...args),
    updateLabTest: jest.fn(),
    deleteLabTest: jest.fn(),
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

describe('Laboratory page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLabTests.mockResolvedValue({
      data: {
        labTests: [
          {
            id: 'lab-1',
            testName: 'CBC',
            status: 'Ordered',
            orderDate: '2026-06-28T00:00:00.000Z',
            patient: { firstName: 'Asha', lastName: 'Rao' },
          },
        ],
      },
    });
    mockCreateLabTest.mockResolvedValue({ status: 'success' });
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
  });

  test('renders lab tests table', async () => {
    render(<Laboratory />);

    await waitFor(() => expect(screen.getByText('CBC')).toBeInTheDocument());
    expect(screen.getByText('Ordered')).toBeInTheDocument();
  });

  test('opens order dialog and submits', async () => {
    render(<Laboratory />);

    await waitFor(() => expect(screen.getByText('CBC')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Order Test'));

    const patientInput = screen.getByRole('combobox', { name: 'Patient' });
    fireEvent.change(patientInput, { target: { value: 'Asha' } });
    fireEvent.keyDown(patientInput, { key: 'ArrowDown' });
    fireEvent.keyDown(patientInput, { key: 'Enter' });

    const doctorInput = screen.getByRole('combobox', { name: 'Doctor' });
    fireEvent.change(doctorInput, { target: { value: 'Vikram' } });
    fireEvent.keyDown(doctorInput, { key: 'ArrowDown' });
    fireEvent.keyDown(doctorInput, { key: 'Enter' });

    fireEvent.change(screen.getByLabelText('Test Name'), {
      target: { value: 'Lipid Panel' },
    });

    fireEvent.click(screen.getByText('Order'));

    await waitFor(() => expect(mockCreateLabTest).toHaveBeenCalled());
  });
});
