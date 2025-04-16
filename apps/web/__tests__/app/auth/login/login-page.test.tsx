import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LoginPage from '@/app/auth/login/page';
import * as authService from '@/app/services/authService';
import Cookies from 'js-cookie';
import axios from 'axios';

// Mock de window.location
const mockWindowLocation = {
  href: '',
};

Object.defineProperty(window, 'location', {
  value: mockWindowLocation,
  writable: true,
});

// Mock do axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock do serviço de autenticação
jest.mock('@/app/services/authService', () => ({
  api: {
    post: jest.fn(),
  },
}));

// Mock do js-cookie
jest.mock('js-cookie', () => ({
  set: jest.fn(),
  remove: jest.fn(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWindowLocation.href = '';
  });

  it('renders login form correctly', () => {
    render(<LoginPage />);

    // Verifica se o título da página está correto
    expect(screen.getByText('Login')).toBeInTheDocument();
    
    // Verifica se os campos do formulário existem
    expect(screen.getByLabelText(/Email ou CPF/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    
    // Verifica se o botão de entrar existe
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
    
    // Verifica se o link para esqueceu a senha existe
    expect(screen.getByText('Esqueceu sua senha?')).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(<LoginPage />);
    const user = userEvent.setup();

    // Clica no botão sem preencher os campos
    await user.click(screen.getByRole('button', { name: /Entrar/i }));

    // Verifica se as mensagens de erro aparecem
    await waitFor(() => {
      expect(screen.getByText(/Login é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/Senha deve ter no mínimo 6 caracteres/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    render(<LoginPage />);
    const user = userEvent.setup();
    
    // Preenche o campo de login mas com senha curta
    await user.type(screen.getByLabelText(/Email ou CPF/i), 'teste@teste.com');
    await user.type(screen.getByLabelText(/Senha/i), '12345');
    
    // Clica no botão de entrar
    await user.click(screen.getByRole('button', { name: /Entrar/i }));
    
    // Verifica se a mensagem de erro da senha aparece
    await waitFor(() => {
      expect(screen.getByText(/Senha deve ter no mínimo 6 caracteres/i)).toBeInTheDocument();
    });
  });

  it('handles successful login', async () => {
    // Mock da resposta de sucesso da API
    const mockResponse = {
      data: {
        token: 'fake-token',
        user: {
          _id: 'user-id',
          name: 'Test User',
          role: 'admin',
          email: 'test@example.com',
          cpf: '12345678901'
        }
      }
    };
    
    (authService.api.post as jest.Mock).mockResolvedValueOnce(mockResponse);
    
    render(<LoginPage />);
    const user = userEvent.setup();
    
    // Preenche os campos corretamente
    await user.type(screen.getByLabelText(/Email ou CPF/i), 'test@example.com');
    await user.type(screen.getByLabelText(/Senha/i), 'password123');
    
    // Clica no botão de entrar
    await user.click(screen.getByRole('button', { name: /Entrar/i }));
    
    // Verifica se a API foi chamada corretamente
    await waitFor(() => {
      expect(authService.api.post).toHaveBeenCalledWith('/api/auth/login', {
        login: 'test@example.com',
        password: 'password123',
      });
    });
    
    // Verifica se os cookies foram definidos
    await waitFor(() => {
      expect(Cookies.set).toHaveBeenCalledWith('token', 'fake-token', expect.any(Object));
      expect(Cookies.set).toHaveBeenCalledWith('userId', 'user-id', expect.any(Object));
      expect(Cookies.set).toHaveBeenCalledWith('name', 'Test User', expect.any(Object));
      expect(Cookies.set).toHaveBeenCalledWith('role', 'admin', expect.any(Object));
      expect(Cookies.set).toHaveBeenCalledWith('email', 'test@example.com', expect.any(Object));
      expect(Cookies.set).toHaveBeenCalledWith('cpf', '12345678901', expect.any(Object));
    });
    
    // Verifica se houve o redirecionamento
    await waitFor(() => {
      expect(window.location.href).toBe('/dashboard');
    });
  });

  it('handles login error', async () => {
    // Mock de erro da API
    const errorMessage = 'Credenciais inválidas';
    const mockError = {
      response: {
        data: {
          message: errorMessage
        }
      }
    };
    
    (authService.api.post as jest.Mock).mockRejectedValueOnce(mockError);
    
    render(<LoginPage />);
    const user = userEvent.setup();
    
    // Preenche os campos
    await user.type(screen.getByLabelText(/Email ou CPF/i), 'invalid@example.com');
    await user.type(screen.getByLabelText(/Senha/i), 'wrongpassword');
    
    // Clica no botão de entrar
    await user.click(screen.getByRole('button', { name: /Entrar/i }));
    
    // Verifica se a mensagem de erro aparece
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    // Verifica se não houve redirecionamento
    expect(window.location.href).toBe('');
  });

  it('shows loading state during submission', async () => {
    // Mock com delay para verificar estado de loading
    (authService.api.post as jest.Mock).mockImplementation(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          data: {
            token: 'fake-token',
            user: {
              _id: 'user-id',
              name: 'Test User',
              role: 'admin'
            }
          }
        });
      }, 100);
    }));
    
    render(<LoginPage />);
    const user = userEvent.setup();
    
    // Preenche os campos
    await user.type(screen.getByLabelText(/Email ou CPF/i), 'test@example.com');
    await user.type(screen.getByLabelText(/Senha/i), 'password123');
    
    // Clica no botão de entrar
    await user.click(screen.getByRole('button', { name: /Entrar/i }));
    
    // Verifica se o texto "Aguarde" aparece durante o loading
    expect(screen.getByText('Aguarde')).toBeInTheDocument();
    
    // Verifica se o spinner aparece
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
    // Aguarda a conclusão
    await waitFor(() => {
      expect(Cookies.set).toHaveBeenCalled();
    });
  });

  it('navigates to forgot password page when link is clicked', async () => {
    render(<LoginPage />);
    const user = userEvent.setup();
    
    // Verifica se o link existe e clica nele
    const forgotPasswordLink = screen.getByText('Esqueceu sua senha?');
    await user.click(forgotPasswordLink);
    
    // Como o Next.js Link é mockado, verificamos se href existe
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/auth/forgot-password');
  });
});