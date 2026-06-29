import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Billing from '../src/pages/Billing';

jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'Administrator' } }),
}));

const mockGetBills = jest.fn();

jest.mock('../src/services/billService', () => ({
  billService: {
    getBills: (...args) => mockGetBills(...args),
    createBill: jest.fn(),
    updateBill: jest.fn(),
    deleteBill: jest.fn(),
  },
}));

jest.mock('../src/services/agentService', () => ({
  agentService: {
    triggerBillingAgent: jest.fn(),
  },
}));

jest.mock('../src/services/patientService', () => ({
  patientService: {
    getAllPatients: jest.fn().mockResolvedValue({ data: { patients: [] } }),
  },
}));

describe('Billing details dialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBills.mockResolvedValue({
      data: {
        bills: [
          {
            id: 'bill-1',
            billNumber: 'B-1001',
            totalAmount: 250.0,
            paymentStatus: 'Pending',
            paymentMode: 'Cash',
            billDate: '2026-06-26',
            notes: 'Test note',
            patient: { firstName: 'Alice', lastName: 'Smith' },
          },
        ],
      },
    });
  });

  test('opens bill details when view icon is clicked', async () => {
    render(<Billing />);

    await waitFor(() => expect(screen.getByText('BIL-00011')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('view-bill-details'));

    await waitFor(() => {
      expect(screen.getByText('Bill Details')).toBeInTheDocument();
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText(/Alice Smith/)).toBeInTheDocument();
    });
  });
});
