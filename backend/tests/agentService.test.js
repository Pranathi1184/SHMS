const db = require('../src/models');

process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || 'test-groq-key';

jest.mock('../src/models');
jest.mock('../src/services/notificationService', () => ({
  createNotificationsForUsers: jest.fn().mockResolvedValue(undefined),
}));

const mockInvoke = jest.fn();

jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: mockInvoke,
  })),
}));

const {
  runSchedulingAgent,
  runFollowUpAgent,
  runInventoryAgent,
  runBillingAgent,
} = require('../src/services/agentService');

describe('Agent Service LangGraph Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInvoke.mockResolvedValue({ content: 'Mocked LLM response' });
  });

  it('returns deterministic scheduling fallback when model invocation fails', async () => {
    mockInvoke.mockRejectedValue(new Error('LLM unavailable'));
    db.Appointment.findAll.mockResolvedValue([
      { startTime: '09:00:00', endTime: '10:00:00' },
      { startTime: '13:00:00', endTime: '14:00:00' },
    ]);

    const result = await runSchedulingAgent('550e8400-e29b-41d4-a716-446655440000', '2026-06-27');

    expect(result).toHaveProperty('suggestions');
    expect(result.availableSlots).toEqual(['09:00:00-10:00:00', '13:00:00-14:00:00']);
    expect(result.suggestions).toContain('Booked slots: 09:00:00-10:00:00, 13:00:00-14:00:00.');
  });

  it('executes follow-up agent workflow', async () => {
    db.Admission.findAll.mockResolvedValue([
      {
        patient: { id: 'p1', firstName: 'Alice' },
        reasonForAdmission: 'Pneumonia',
      },
    ]);
    db.Patient.findAll.mockResolvedValue([{ id: 'p1', email: 'alice@shms.com' }]);
    db.User.findAll.mockResolvedValue([{ id: 'u1', email: 'alice@shms.com' }]);

    const result = await runFollowUpAgent();

    expect(result.followUpMessages).toHaveLength(1);
    expect(result.followUpMessages[0]).toHaveProperty('message');
  });

  it('executes inventory agent workflow', async () => {
    db.Medicine.findAll.mockResolvedValue([
      { id: 'm1', name: 'Paracetamol', quantity: 4, reorderLevel: 20 },
    ]);
    db.PrescriptionItem.findAll.mockResolvedValue([]);
    db.sequelize = {
      fn: jest.fn(() => 'SUM'),
      col: jest.fn(() => 'quantity'),
    };

    const result = await runInventoryAgent();

    expect(result).toHaveProperty('recommendations');
  });

  it('returns deterministic billing insight when model invocation fails', async () => {
    mockInvoke.mockRejectedValue(new Error('LLM unavailable'));
    db.Bill.findAll.mockResolvedValue([
      { patientId: 'p1', netAmount: '100.00', patient: { id: 'p1' } },
      { patientId: 'p2', netAmount: '50.00', patient: { id: 'p2' } },
    ]);
    db.Patient.findAll.mockResolvedValue([
      { id: 'p1', email: 'p1@shms.com' },
      { id: 'p2', email: 'p2@shms.com' },
    ]);
    db.User.findAll.mockResolvedValue([
      { id: 'u1', email: 'p1@shms.com' },
      { id: 'u2', email: 'p2@shms.com' },
    ]);

    const result = await runBillingAgent();

    expect(result.pendingBills).toHaveLength(2);
    expect(result.billingInsights).toEqual(
      'There are 2 pending bills totaling $0.00. Follow up with billing staff today.'
    );
  });
});
