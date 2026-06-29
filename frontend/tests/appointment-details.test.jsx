import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AppointmentDetails from '../src/pages/AppointmentDetails';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'appointment-1' }),
}));

jest.mock('../src/services/appointmentService', () => ({
  appointmentService: {
    getAppointmentById: jest.fn().mockResolvedValue({
      data: {
        id: 'appointment-1',
        appointmentDate: '2026-06-30T00:00:00.000Z',
        startTime: '09:00',
        endTime: '09:30',
        status: 'Scheduled',
        notes: 'Follow up visit',
        patient: { firstName: 'Asha', lastName: 'Rao' },
        doctor: { user: { firstName: 'Vikram', lastName: 'Shah' } },
      },
    }),
  },
}));

describe('AppointmentDetails', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('renders appointment details and navigates back', async () => {
    render(<AppointmentDetails />);

    await waitFor(() => expect(screen.getByText('Appointment Details')).toBeInTheDocument());
    expect(screen.getByText(/Asha Rao/)).toBeInTheDocument();
    expect(screen.getByText(/Vikram Shah/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Back to Appointments'));
    expect(mockNavigate).toHaveBeenCalledWith('/appointments');
  });
});
