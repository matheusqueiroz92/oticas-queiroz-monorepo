import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/providers/AuthProvider';
import * as authService from '@/app/services/authService';
import Cookies from 'js-cookie';
import LoginPage from '@/app/auth/login/page';

// Mock do js-cookie
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

// Mock do serviço de autenticação
jest.mock('@/app/services/authService', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
  loginWithCredentials: jest.fn(),
  clearAuthCookies: jest.fn(),
  redirectAfterLogout: jest.fn(),
  isAuthenticated: jest.fn(),
}));

// Mock do next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock do window.location
const mockWindowLocation = {
  href: '',
};

Object.defineProperty(window, 'location', {
  value: mockWindowLocation,
  writable: true,
});

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWindowLocation.href = '';
  });

  it('should handle login flow correctly', async () => {
    // Configurar mocks para login bem-sucedido
    const mockUser = {
      _id: 'user-id',
      name: 'Test User',
      role: 'admin',
      email: 'test@example.com',
      cpf: '12345678901'
    };
    
    const mockResponse = {
      data: {
        token: 'fake-token',
        user: mockUser
      }
    };
    
    (authService.api.post as jest.Mock).mockResolvedValueOnce(mockResponse);
    (authService.loginWithCredentials as jest.Mock).mockImplementation((login, password) => 
      authService.api.post('/api/auth/login', { login, password })
        .then(res => res.data)
    );
    
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );
    
    const user = userEvent.setup();
    
    // Preencher e enviar o formulário de login
    await user.type(screen.getByLabelText(/Email ou CPF/i), 'test@example.com');
    await user.type(screen.getByLabelText(/Senha/i), 'password123');
    await user.click(screen.getByRole('button', { name: /Entrar/i }));
    
    // Verificar se a API foi chamada corretamente
    await waitFor(() => {
      expect(authService.api.post).toHaveBeenCalledWith('/api/auth/login', {
        login: 'test@example.com',
        password: 'password123',
      });
    });
    
    // Verificar se os cookies foram definidos
    await waitFor(() => {
      expect(Cookies.set).toHaveBeenCalledWith('token', 'fake-token', expect.any(Object));
      expect(Cookies.set).toHaveBeenCalledWith('userId', 'user-id', expect.any(Object));
      expect(Cookies.set).toHaveBeenCalledWith('name', 'Test User', expect.any(Object));
      expect(Cookies.set).toHaveBeenCalledWith('role', 'admin', expect.any(Object));
      expect(Cookies.set).toHaveBeenCalledWith('email', 'test@example.com', expect.any(Object));
      expect(Cookies.set).toHaveBeenCalledWith('cpf', '12345678901', expect.any(Object));
    });
    
    // Verificar se houve redirecionamento
    await waitFor(() => {
      expect(window.location.href).toBe('/dashboard');
    });
  });

  it('should handle failed login', async () => {
    // Configurar mock para login falhar
    const errorMessage = 'Credenciais inválidas';
    const mockError = {
      response: {
        data: {
          message: errorMessage
        }
      }
    };
    
    (authService.api.post as jest.Mock).mockRejectedValueOnce(mockError);
    (authService.loginWithCredentials as jest.Mock).mockImplementation(() => 
      Promise.reject(mockError)
    );
    
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );
    
    const user = userEvent.setup();
    
    // Preencher e enviar o formulário com credenciais inválidas
    await user.type(screen.getByLabelText(/Email ou CPF/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/Senha/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /Entrar/i }));
    
    // Verificar se a mensagem de erro aparece
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    // Verificar que nenhum cookie foi definido
    expect(Cookies.set).not.toHaveBeenCalled();
    
    // Verificar que não houve redirecionamento
    expect(window.location.href).toBe('');
  });

  it('should load authenticated user on initial render', async () => {
    // Componente de teste que exibe informações do usuário
    const TestAuthComponent = () => {
      return (
        <div>
          <h1>Auth Test</h1>
          <div data-testid="auth-info">
            {authService.isAuthenticated() ? 'Authenticated' : 'Not Authenticated'}
          </div>
        </div>
      );
    };
    
    // Configurar mocks para simular usuário autenticado
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'token') return 'fake-token';
      if (key === 'userId') return 'user-id';
      if (key === 'name') return 'Test User';
      if (key === 'role') return 'admin';
      return null;
    });
    
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    
    (authService.api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        _id: 'user-id',
        name: 'Test User',
        role: 'admin',
      },
    });
    
    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );
    
    // Verificar que o usuário está autenticado
    await waitFor(() => {
      expect(screen.getByTestId('auth-info')).toHaveTextContent('Authenticated');
    });
    
    // Verificar que a API foi chamada para obter o perfil
    expect(authService.api.get).toHaveBeenCalledWith('/api/users/profile');
  });

  it('should block access to authenticated routes when not logged in', async () => {
    // Componente que simula uma rota protegida
    const ProtectedRoute = () => {
      const mockRouter = { push: jest.fn() };
      (require('next/navigation').useRouter as jest.Mock).mockReturnValue(mockRouter);
      
      (Cookies.get as jest.Mock).mockReturnValue(null);
      (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
      
      const request = {
        nextUrl: {
          pathname: '/dashboard',
          href: 'http://localhost:3000/dashboard',
          search: '',
          clone: jest.fn().mockImplementation(function(this: typeof request.nextUrl) { return this; }),
        },
        cookies: {
          get: jest.fn(() => undefined),
          getAll: jest.fn(() => []),
        },
        url: 'http://localhost:3000/dashboard',
      };
      
      // Simular o middleware
      const { middleware } = require('@/middleware');
      middleware(request as any);
      
      return <div>Protected Content</div>;
    };
    
    render(
      <AuthProvider>
        <ProtectedRoute />
      </AuthProvider>
    );
    
    // Verificar se houve tentativa de redirecionamento via middleware
    await waitFor(() => {
      expect(require('next/server').NextResponse.redirect).toHaveBeenCalled();
    });
  });
});