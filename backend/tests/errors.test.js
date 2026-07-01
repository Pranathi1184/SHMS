const {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
} = require('../src/utils/errors');

describe('AppError', () => {
  it('sets message, statusCode, status (fail for 4xx)', () => {
    const err = new AppError('bad', 400);
    expect(err.message).toBe('bad');
    expect(err.statusCode).toBe(400);
    expect(err.status).toBe('fail');
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(Error);
  });

  it('sets status to error for 5xx', () => {
    const err = new AppError('oops', 500);
    expect(err.status).toBe('error');
  });

  it('captures a stack trace', () => {
    const err = new AppError('trace', 422);
    expect(err.stack).toBeDefined();
  });
});

describe('BadRequestError', () => {
  it('defaults to 400 and "Bad Request"', () => {
    const err = new BadRequestError();
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Bad Request');
    expect(err.status).toBe('fail');
  });

  it('accepts a custom message', () => {
    const err = new BadRequestError('invalid input');
    expect(err.message).toBe('invalid input');
  });
});

describe('UnauthorizedError', () => {
  it('defaults to 401 and "Unauthorized"', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Unauthorized');
  });
});

describe('ForbiddenError', () => {
  it('defaults to 403 and "Forbidden"', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('Forbidden');
  });
});

describe('NotFoundError', () => {
  it('defaults to 404 and "Not Found"', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Not Found');
  });
});

describe('InternalServerError', () => {
  it('defaults to 500 and "Internal Server Error"', () => {
    const err = new InternalServerError();
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe('Internal Server Error');
    expect(err.status).toBe('error');
  });
});
