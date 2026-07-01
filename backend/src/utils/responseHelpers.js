const successResponse = (res, data, statusCode = 200, message) => {
  const body = { status: 'success' };
  if (message) body.message = message;
  if (data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
};

const errorResponse = (res, statusCode, message) =>
  res.status(statusCode).json({ status: 'error', message });

module.exports = { successResponse, errorResponse };
