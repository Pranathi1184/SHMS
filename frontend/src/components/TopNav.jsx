import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Divider,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Settings,
  Logout,
  History,
  KeyboardCommandKey,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notificationService';

const TopNav = ({ onMenuClick, onOpenCommandPalette }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [recentAnchorEl, setRecentAnchorEl] = useState(null);
  const [recentViews, setRecentViews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationTypeFilter, setNotificationTypeFilter] = useState('All');
  const [snoozedMap, setSnoozedMap] = useState({});
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem('shms_snoozed_notifications') || '{}');
    const now = Date.now();
    const active = Object.fromEntries(
      Object.entries(raw).filter(([, until]) => Number(until) > now)
    );
    setSnoozedMap(active);
    localStorage.setItem('shms_snoozed_notifications', JSON.stringify(active));
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await notificationService.getMyNotifications(15);
      setNotifications(response?.data?.notifications || []);
      setUnreadCount(response?.data?.unreadCount || 0);
    } catch (error) {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchNotifications();
    const timer = setInterval(fetchNotifications, 30000);
    return () => clearInterval(timer);
  }, [user?.id]);

  const handleProfileMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setNotificationsAnchorEl(null);
    setRecentAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  const handleNotifications = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const openRecent = (event) => {
    const recent = JSON.parse(localStorage.getItem('shms_recent_views') || '[]');
    setRecentViews(recent);
    setRecentAnchorEl(event.currentTarget);
  };

  const getNotificationPath = (notification) => {
    if (notification?.actionUrl) return notification.actionUrl;
    if (notification?.metadata?.route) return notification.metadata.route;

    const type = notification?.type;
    const relatedId = notification?.relatedId;
    const title = String(notification?.title || '').toLowerCase();

    if (type === 'Appointment' && relatedId) return `/appointments/${relatedId}`;
    if (type === 'Appointment') return '/appointments';
    if (type === 'Bill') return '/billing';
    if (type === 'Prescription') return '/prescriptions';
    if (type === 'Test Result') return '/laboratory';
    if (type === 'Insurance') return '/insurance';
    if (type === 'EHR') return '/ehr';
    if (type === 'Ward') return '/ward-management';
    if (title.includes('doctor')) return '/doctors';
    if (title.includes('patient')) return '/patients';
    return '/dashboard';
  };

  const snoozeNotification = (id, minutes) => {
    const until = Date.now() + (minutes * 60 * 1000);
    const next = { ...snoozedMap, [id]: until };
    setSnoozedMap(next);
    localStorage.setItem('shms_snoozed_notifications', JSON.stringify(next));
  };

  const visibleNotifications = notifications.filter((item) => {
    const typeMatch = notificationTypeFilter === 'All' || item.type === notificationTypeFilter;
    const snoozed = Number(snoozedMap[item.id] || 0) > Date.now();
    return typeMatch && !snoozed;
  });

  const handleMarkOneRead = async (id) => {
    try {
      await notificationService.markNotificationRead(id);
      fetchNotifications();
    } catch (error) {
      // Ignore UI-level failure for best effort updates.
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllNotificationsRead();
      fetchNotifications();
    } catch (error) {
      // Ignore UI-level failure for best effort updates.
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - 260px)` },
        ml: { md: '260px' },
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 1,
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
          Smart Hospital Management System
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton color="inherit" onClick={onOpenCommandPalette} title="Command Palette (Ctrl/Cmd+K)">
            <KeyboardCommandKey />
          </IconButton>
          <IconButton color="inherit" onClick={openRecent} title="Recently viewed">
            <History />
          </IconButton>
          <IconButton color="inherit" onClick={handleNotifications}>
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          <IconButton onClick={handleProfileMenu} color="inherit">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {user?.firstName?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle1">
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleClose}>
            <AccountCircle sx={{ mr: 1 }} /> Profile
          </MenuItem>
          <MenuItem onClick={handleClose}>
            <Settings sx={{ mr: 1 }} /> Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <Logout sx={{ mr: 1 }} /> Logout
          </MenuItem>
        </Menu>

        <Menu
          anchorEl={notificationsAnchorEl}
          open={Boolean(notificationsAnchorEl)}
          onClose={handleClose}
          slotProps={{ paper: { sx: { width: 360, maxWidth: '95vw' } } }}
        >
          <Box sx={{ px: 2, py: 1, display: 'grid', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" fontWeight="bold">Notifications</Typography>
              <Button size="small" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                Mark all read
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel id="notification-type-label">Category</InputLabel>
                <Select
                  labelId="notification-type-label"
                  value={notificationTypeFilter}
                  label="Category"
                  onChange={(e) => setNotificationTypeFilter(e.target.value)}
                >
                  {['All', 'Appointment', 'Bill', 'Prescription', 'Test Result', 'System', 'Other'].map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                size="small"
                disabled={notificationTypeFilter === 'All'}
                onClick={async () => {
                  const targetIds = visibleNotifications.filter((n) => !n.read).map((n) => n.id);
                  await notificationService.markNotificationsRead(targetIds);
                  fetchNotifications();
                }}
              >
                Mark category read
              </Button>
            </Box>
          </Box>
          <Divider />

          {loadingNotifications && (
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">Loading...</Typography>
            </Box>
          )}

          {!loadingNotifications && visibleNotifications.length === 0 && (
            <MenuItem onClick={handleClose}>No notifications yet</MenuItem>
          )}

          {!loadingNotifications && visibleNotifications.map((item) => (
            <MenuItem
              key={item.id}
              onClick={() => {
                if (!item.read) {
                  handleMarkOneRead(item.id);
                }
                navigate(getNotificationPath(item));
                handleClose();
              }}
              sx={{
                display: 'block',
                borderLeft: item.read ? '3px solid transparent' : '3px solid',
                borderColor: 'primary.main',
                bgcolor: item.read ? 'transparent' : 'action.hover',
              }}
            >
              <Typography variant="body2" fontWeight={item.read ? 'normal' : 'bold'}>{item.title}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">{item.message}</Typography>
              <Box sx={{ mt: 0.5 }}>
                <Button
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    snoozeNotification(item.id, 60);
                  }}
                >
                  Snooze 1h
                </Button>
              </Box>
            </MenuItem>
          ))}
        </Menu>

        <Menu
          anchorEl={recentAnchorEl}
          open={Boolean(recentAnchorEl)}
          onClose={handleClose}
          slotProps={{ paper: { sx: { width: 320, maxWidth: '95vw' } } }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">Recently Viewed</Typography>
          </Box>
          <Divider />
          {recentViews.length === 0 && <MenuItem onClick={handleClose}>No recent pages</MenuItem>}
          {recentViews.map((item) => (
            <MenuItem
              key={`${item.path}-${item.ts}`}
              onClick={() => {
                navigate(item.path);
                handleClose();
              }}
            >
              <Box>
                <Typography variant="body2">{item.label}</Typography>
                <Typography variant="caption" color="text.secondary">{item.path}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default TopNav;

