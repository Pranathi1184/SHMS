const resolved = Promise.resolve({ data: {} });

const api = {
  get: () => resolved,
  post: () => resolved,
  put: () => resolved,
  patch: () => resolved,
  delete: () => resolved,
  interceptors: {
    request: {
      use: () => {},
    },
    response: {
      use: () => {},
    },
  },
};

export default api;
