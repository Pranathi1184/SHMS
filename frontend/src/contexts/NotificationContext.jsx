import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSuccess = useCallback((message) => {
    setNotification({ open: true, message, severity: 'success' });
  }, []);

  const showError = useCallback((message) => {
    setNotification({ open: true, message, severity: 'error' });
  }, []);

  const showWarning = useCallback((message) => {
    setNotification({ open: true, message, severity: 'warning' });
  }, []);

  const showInfo = useCallback((message) => {
    setNotification({ open: true, message, severity: 'info' });
  }, []);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setNotification((prev) => ({ ...prev, open: false }));
  };

  return (
    <NotificationContext.Provider value={{ showSuccess, showError, showWarning, showInfo }}>
      {children}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleClose} severity={notification.severity} variant="filled" sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};
