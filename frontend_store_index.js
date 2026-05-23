// src/store/index.js
import { configureStore, createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null, loading: false },
  reducers: {
    setUser:   (s, a) => { s.user = a.payload; },
    setToken:  (s, a) => { s.token = a.payload; },
    setLoading:(s, a) => { s.loading = a.payload; },
    logout:    (s)    => { s.user = null; s.token = null; },
  },
});

const alertSlice = createSlice({
  name: 'alert',
  initialState: { activeAlert: null, events: [] },
  reducers: {
    setActiveAlert: (s, a) => { s.activeAlert = a.payload; },
    clearAlert:     (s)    => { s.activeAlert = null; },
    setEvents:      (s, a) => { s.events = a.payload; },
    prependEvent:   (s, a) => { s.events = [a.payload, ...s.events]; },
  },
});

const notifSlice = createSlice({
  name: 'notif',
  initialState: { list: [], unread: 0 },
  reducers: {
    setNotifs:  (s, a) => { s.list = a.payload; s.unread = a.payload.filter(n => !n.is_read).length; },
    markRead:   (s, a) => {
      const n = s.list.find(x => x.id === a.payload);
      if (n) { n.is_read = true; s.unread = Math.max(0, s.unread - 1); }
    },
  },
});

export const { setUser, setToken, setLoading, logout } = authSlice.actions;
export const { setActiveAlert, clearAlert, setEvents, prependEvent } = alertSlice.actions;
export const { setNotifs, markRead } = notifSlice.actions;

export const store = configureStore({
  reducer: {
    auth:  authSlice.reducer,
    alert: alertSlice.reducer,
    notif: notifSlice.reducer,
  },
});
