import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Prescriptions from '../src/pages/Prescriptions';

jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'Doctor' } }),
}));

const mockGetPrescriptions = jest.fn();
const mockCreatePrescription = jest.fn();

jest.mock('../src/services/prescriptionService', () => ({
  prescriptionService: {
    getPrescriptions: (...args) => mockGetPrescriptions(...args),
    createPrescription: (...args) => mockCreatePrescription(...args),
    updatePrescription: jest.fn(),
    dispensePrescription: jest.fn(),
    deletePrescription: jest.fn(),
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

    fireEvent.change(screen.getByLabelText('Patient ID'), {
      target: { value: '11111111-1111-4111-8111-111111111111' },
    });
    fireEvent.change(screen.getByLabelText('Doctor ID'), {
      target: { value: '22222222-2222-4222-8222-222222222222' },
    });
    fireEvent.change(screen.getByLabelText('Medicine ID'), {
      target: { value: '33333333-3333-4333-8333-333333333333' },
    });
    fireEvent.change(screen.getByLabelText('Dosage'), { target: { value: '1 tablet' } });
    fireEvent.change(screen.getByLabelText('Frequency'), { target: { value: 'Twice daily' } });
    fireEvent.change(screen.getByLabelText('Duration'), { target: { value: '5 days' } });
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '10' } });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => expect(mockCreatePrescription).toHaveBeenCalled());
  });
});
