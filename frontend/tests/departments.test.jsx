import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Departments from '../src/pages/Departments';

jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'Administrator' } }),
}));

const mockGetDepartments = jest.fn();
const mockCreateDepartment = jest.fn();

jest.mock('../src/services/departmentService', () => ({
  departmentService: {
    getDepartments: (...args) => mockGetDepartments(...args),
    createDepartment: (...args) => mockCreateDepartment(...args),
    updateDepartment: jest.fn(),
    deleteDepartment: jest.fn(),
  },
}));

describe('Departments page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDepartments.mockResolvedValue({
      data: {
        departments: [{ id: 'dep-1', name: 'Cardiology', description: 'Heart care' }],
      },
    });
    mockCreateDepartment.mockResolvedValue({ status: 'success' });
  });

  test('loads and displays departments', async () => {
    render(<Departments />);

    await waitFor(() => expect(screen.getByText('Cardiology')).toBeInTheDocument());
    expect(screen.getByText('Heart care')).toBeInTheDocument();
  });

  test('opens add dialog and submits department', async () => {
    render(<Departments />);

    await waitFor(() => expect(screen.getByText('Cardiology')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Add Department'));
    fireEvent.change(screen.getByLabelText('Department Name'), { target: { value: 'Neurology' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Brain care' } });
    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => expect(mockCreateDepartment).toHaveBeenCalled());
  });
});
