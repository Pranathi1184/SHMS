import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import WardManagement from '../src/pages/WardManagement';

jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'Administrator' } }),
}));

const mockGetWards = jest.fn();
const mockGetBeds = jest.fn();
const mockGetAdmissions = jest.fn();

jest.mock('../src/services/wardManagementService', () => ({
  wardManagementService: {
    getWards: (...args) => mockGetWards(...args),
    getBeds: (...args) => mockGetBeds(...args),
    getAdmissions: (...args) => mockGetAdmissions(...args),
    createWard: jest.fn(),
    updateWard: jest.fn(),
    deleteWard: jest.fn(),
    createBed: jest.fn(),
    updateBed: jest.fn(),
    deleteBed: jest.fn(),
    createAdmission: jest.fn(),
    updateAdmission: jest.fn(),
    dischargePatient: jest.fn(),
    deleteAdmission: jest.fn(),
  },
}));

describe('Ward Management page', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetWards.mockResolvedValue({
      data: { wards: [{ id: 'w-1', name: 'ICU-A', type: 'ICU' }] },
    });

    mockGetBeds.mockResolvedValue({
      data: { beds: [{ id: 'b-1', bedNumber: 'B-01', status: 'Available', ward: { name: 'ICU-A' } }] },
    });

    mockGetAdmissions.mockResolvedValue({
      data: { admissions: [] },
    });
  });

  test('loads wards tab data', async () => {
    render(<WardManagement />);

    await waitFor(() => expect(screen.getByText('ICU-A')).toBeInTheDocument());
    expect(screen.getByText('ICU')).toBeInTheDocument();
  });

  test('switches to beds tab and shows bed rows', async () => {
    render(<WardManagement />);

    await waitFor(() => expect(screen.getByText('ICU-A')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Beds'));

    await waitFor(() => expect(mockGetBeds).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('B-01')).toBeInTheDocument());
    expect(screen.getByText('Available')).toBeInTheDocument();
  });
});
