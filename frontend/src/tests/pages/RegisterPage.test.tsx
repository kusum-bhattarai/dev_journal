import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../utils/auth'; 
import RegisterPage from '../../pages/RegisterPage';
import * as ToastHook from '../../hooks/use-toast'; 

type ToastReturn = {
  toast: jest.Mock<{ id: string; dismiss: () => void; update: (props: any) => void }, [any]>;
  dismiss: jest.Mock<void, [string | undefined]>;
  toasts: any[];
};

describe('RegisterPage', () => {
  it('renders form elements', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </BrowserRouter>
    );
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
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
          <RegisterPage />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(mockToastReturn.toast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Username, email, and password are required.',
      });
    });

    toastSpy.mockRestore();
  });

  it('calls toast for short username', async () => {
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
          <RegisterPage />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'ab' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: '12345678' } });

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(mockToastReturn.toast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Username must be at least 3 characters long.',
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
          <RegisterPage />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'validuser' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'invalid' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: '12345678' } });

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

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
          <RegisterPage />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'validuser' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'short' } });

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

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