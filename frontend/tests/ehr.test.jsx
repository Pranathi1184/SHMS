import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import EHR from '../src/pages/EHR';

jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'Doctor' } }),
}));

const mockGetEHRs = jest.fn();
const mockCreateEHR = jest.fn();

jest.mock('../src/services/ehrService', () => ({
  ehrService: {
    getEHRs: (...args) => mockGetEHRs(...args),
    createEHR: (...args) => mockCreateEHR(...args),
    updateEHR: jest.fn(),
    deleteEHR: jest.fn(),
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

    fireEvent.change(screen.getByLabelText('Patient ID'), {
      target: { value: '11111111-1111-1111-1111-111111111111' },
    });
    fireEvent.change(screen.getByLabelText('Doctor ID'), {
      target: { value: '22222222-2222-2222-2222-222222222222' },
    });
    fireEvent.change(screen.getByLabelText('Diagnosis'), {
      target: { value: 'Migraine' },
    });

    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => expect(mockCreateEHR).toHaveBeenCalled());
  });
});
