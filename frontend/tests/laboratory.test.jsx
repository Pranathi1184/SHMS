import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Laboratory from '../src/pages/Laboratory';

jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'Doctor' } }),
}));

const mockGetLabTests = jest.fn();
const mockCreateLabTest = jest.fn();

jest.mock('../src/services/laboratoryTestService', () => ({
  laboratoryTestService: {
    getLabTests: (...args) => mockGetLabTests(...args),
    createLabTest: (...args) => mockCreateLabTest(...args),
    updateLabTest: jest.fn(),
    deleteLabTest: jest.fn(),
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

    fireEvent.change(screen.getByLabelText('Patient ID'), {
      target: { value: '11111111-1111-4111-8111-111111111111' },
    });
    fireEvent.change(screen.getByLabelText('Doctor ID'), {
      target: { value: '22222222-2222-4222-8222-222222222222' },
    });
    fireEvent.change(screen.getByLabelText('Test Name'), {
      target: { value: 'Lipid Panel' },
    });

    fireEvent.click(screen.getByText('Order'));

    await waitFor(() => expect(mockCreateLabTest).toHaveBeenCalled());
  });
});
