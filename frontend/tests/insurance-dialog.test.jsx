import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Insurance from '../src/pages/Insurance';

jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'Administrator' } }),
}));

const mockGetInsurance = jest.fn();

jest.mock('../src/services/insuranceService', () => ({
  insuranceService: {
    getInsurance: (...args) => mockGetInsurance(...args),
    createInsurance: jest.fn(),
    updateInsurance: jest.fn(),
    deleteInsurance: jest.fn(),
  },
}));

describe('Insurance details dialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetInsurance.mockResolvedValue({
      data: {
        insuranceRecords: [
          {
            id: 'ins-1',
            providerName: 'Aetna',
            policyNumber: 'P-101',
            policyHolderName: 'Alice Smith',
            coverageStartDate: '2026-01-01',
            patient: { firstName: 'Alice', lastName: 'Smith' },
          },
        ],
      },
    });
  });

  test('opens insurance details when view icon is clicked', async () => {
    render(<Insurance />);

    await waitFor(() => expect(screen.getByText('P-101')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('view-insurance-details'));

    await waitFor(() => {
      expect(screen.getByText('Insurance Details')).toBeInTheDocument();
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText(/Aetna/)).toBeInTheDocument();
    });
  });
});
