import React, { createContext, useContext, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { subscribeMockSocket } from '../services/mock/mockAdapter';
import { useMockTransport } from '../services/axiosClient';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. In mock mode, subscribe to mock socket event dispatcher
    const unsubscribeMock = subscribeMockSocket((event, payload) => {
      handleSocketEvent(event, payload);
    });

    // 2. In live backend mode (if VITE_USE_MOCK === 'false'), connect via socket.io-client
    let socket = null;
    if (!useMockTransport) {
      try {
        // Socket.io connects to the server root, not the /api path
        const serverRoot = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api$/, '');
        socket = io(serverRoot, {
          withCredentials: true,
          transports: ['websocket', 'polling'],
        });

        socket.on('application:status-updated', (data) => {
          handleSocketEvent('application:status-updated', data);
        });

        socket.on('drive:new', (data) => {
          handleSocketEvent('drive:new', data);
        });

        socket.on('notification:new', (data) => {
          handleSocketEvent('notification:new', data);
        });
      } catch (err) {
        console.warn('Socket connection error:', err);
      }
    }

    function handleSocketEvent(event, data) {
      if (event === 'application:status-updated') {
        // Check if event belongs to current logged in student
        if (!user || user.id === data.studentId) {
          showToast({
            type: data.status === 'SHORTLISTED' || data.status === 'SELECTED' ? 'success' : 'info',
            title: `Application Status: ${data.status}`,
            message: data.message || `Your application for ${data.jobTitle} at ${data.companyName} has been ${data.status.toLowerCase()}.`,
            duration: 6000,
          });

          // Invalidate relevant TanStack Query caches to re-render automatically
          queryClient.invalidateQueries({ queryKey: ['my-applications'] });
          queryClient.invalidateQueries({ queryKey: ['application', data.applicationId] });
          queryClient.invalidateQueries({ queryKey: ['student-stats'] });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      } else if (event === 'drive:new') {
        showToast({
          type: 'info',
          title: 'New Placement Drive',
          message: `${data.companyName} just opened applications for ${data.title} (${data.salaryRange}).`,
          duration: 5000,
        });
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      } else if (event === 'notification:new') {
        if (!data.recipientId || (user && user.id === data.recipientId)) {
          showToast({
            type: 'info',
            title: data.title || 'New Notification',
            message: data.message,
          });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      }
    }

    return () => {
      unsubscribeMock();
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, showToast, queryClient]);

  return (
    <SocketContext.Provider value={{}}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
