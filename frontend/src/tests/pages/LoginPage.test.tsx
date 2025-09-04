import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../utils/auth';
import LoginPage from '../../pages/LoginPage';
import * as ToastHook from '../../hooks/use-toast';

type ToastReturn = {
  toast: jest.Mock< { id: string; dismiss: () => void; update: (props: any) => void }, [any] >;
  dismiss: jest.Mock<void, [string | undefined]>;
  toasts: any[];
};

describe('LoginPage', () => {
  it('renders form elements', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('calls toast on empty submit for validation error', async () => {
    const mockToastReturn = {
      toast: jest.fn().mockReturnValue({
        id: 'test-id',
        dismiss: jest.fn(),
        update: jest.fn(),
      }),
      dismiss: jest.fn(),
      toasts: [],
    };
    const toastSpy = jest.spyOn(ToastHook, 'useToast').mockReturnValue(mockToastReturn as ToastReturn);

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(mockToastReturn.toast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Email and password are required.',
      });
    });

    toastSpy.mockRestore();
  });

  it('calls toast for invalid email', async () => {
    const mockToastReturn = {
      toast: jest.fn().mockReturnValue({
        id: 'test-id',
        dismiss: jest.fn(),
        update: jest.fn(),
      }),
      dismiss: jest.fn(),
      toasts: [],
    };
    const toastSpy = jest.spyOn(ToastHook, 'useToast').mockReturnValue(mockToastReturn as ToastReturn);

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'invalid' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: '12345678' } });

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(mockToastReturn.toast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please enter a valid email address.',
      });
    });

    toastSpy.mockRestore();
  });

  it('calls toast for short password', async () => {
    const mockToastReturn = {
      toast: jest.fn().mockReturnValue({
        id: 'test-id',
        dismiss: jest.fn(),
        update: jest.fn(),
      }),
      dismiss: jest.fn(),
      toasts: [],
    };
    const toastSpy = jest.spyOn(ToastHook, 'useToast').mockReturnValue(mockToastReturn as ToastReturn);

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'short' } });

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(mockToastReturn.toast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Password must be at least 8 characters long.',
      });
    });

    toastSpy.mockRestore();
  });
});