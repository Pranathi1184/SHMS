import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import EnterpriseOps from '../src/pages/EnterpriseOps';

const mockGetAllPatients = jest.fn();
const mockGetInsurance = jest.fn();
const mockGetBills = jest.fn();
const mockGetClaims = jest.fn();
const mockGetDischargePathways = jest.fn();
const mockGetCommunications = jest.fn();
const mockGetKpiDrilldown = jest.fn();
const mockRunDataQualityChecks = jest.fn();

jest.mock('../src/services/patientService', () => ({
  patientService: {
    getAllPatients: (...args) => mockGetAllPatients(...args),
  },
}));

jest.mock('../src/services/insuranceService', () => ({
  insuranceService: {
    getInsurance: (...args) => mockGetInsurance(...args),
  },
}));

jest.mock('../src/services/billService', () => ({
  billService: {
    getBills: (...args) => mockGetBills(...args),
  },
}));

jest.mock('../src/services/enterpriseService', () => ({
  enterpriseService: {
    getClaims: (...args) => mockGetClaims(...args),
    getDischargePathways: (...args) => mockGetDischargePathways(...args),
    getCommunications: (...args) => mockGetCommunications(...args),
    createClaim: jest.fn(),
    saveDischargePathway: jest.fn(),
    sendCommunication: jest.fn(),
    updateClaimStatus: jest.fn(),
  },
}));

jest.mock('../src/services/analyticsService', () => ({
  analyticsService: {
    getKpiDrilldown: (...args) => mockGetKpiDrilldown(...args),
    runDataQualityChecks: (...args) => mockRunDataQualityChecks(...args),
  },
}));

describe('Enterprise Ops page', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetAllPatients.mockResolvedValue({
      data: { patients: [{ id: 'p-1', firstName: 'Asha', lastName: 'Rao' }] },
    });
    mockGetInsurance.mockResolvedValue({
      data: { insuranceRecords: [{ id: 'i-1', providerName: 'Acme Health' }] },
    });
    mockGetBills.mockResolvedValue({ data: { bills: [] } });
    mockGetClaims.mockResolvedValue({
      data: {
        claims: [
          {
            id: 'c-1',
            claimNumber: 'CLM-100',
            status: 'Submitted',
            claimAmount: 1200,
            insurance: { providerName: 'Acme Health' },
          },
        ],
      },
    });
    mockGetDischargePathways.mockResolvedValue({ data: { pathways: [] } });
    mockGetCommunications.mockResolvedValue({ data: { communications: [] } });
    mockGetKpiDrilldown.mockResolvedValue({ data: { rows: [{ date: '2026-06-01', value: 1000 }] } });
    mockRunDataQualityChecks.mockResolvedValue({ data: { missingPatientPhones: 1, invalidAppointments: 0, duplicatePatientEmails: [] } });
  });

  test('renders claims queue with insurance provider', async () => {
    render(<EnterpriseOps />);

    await waitFor(() => expect(screen.getByText('CLM-100')).toBeInTheDocument());
    expect(screen.getByText(/Acme Health/)).toBeInTheDocument();
  });

  test('runs data quality checks from quality tab', async () => {
    render(<EnterpriseOps />);

    await waitFor(() => expect(screen.getByText('CLM-100')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Quality + KPI'));
    fireEvent.click(screen.getByText('Run Data Quality Checks'));

    await waitFor(() => expect(mockRunDataQualityChecks).toHaveBeenCalled());
  });
});
