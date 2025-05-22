import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LoginPage from '@/app/auth/login/page';
import * as authService from '@/app/_services/authService';
import { API_ROUTES } from '@/app/_constants/api-routes';
import Cookies from 'js-cookie';

// Mock de window.location
const mockWindowLocation = {
  href: '',
};

Object.defineProperty(window, 'location', {
  value: mockWindowLocation,
  writable: true,
});

// Mock do axios
jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(() => ({
      post: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    })),
    isAxiosError: jest.fn().mockImplementation(() => true)
  };
  
  return mockAxios;
});

// Mock de next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // Convertendo atributos booleanos para string
    const imgProps = { ...props };
    if (typeof imgProps.fill === 'boolean') imgProps.fill = imgProps.fill.toString();
    if (typeof imgProps.priority === 'boolean') imgProps.priority = imgProps.priority.toString();
    
    return <img {...imgProps} data-testid="mock-image" src="/mock-image-path.jpg" />;
  },
}));

// Mock do js-cookie
jest.mock('js-cookie', () => ({
  set: jest.fn(),
  remove: jest.fn(),
}));

// Mock do serviço de autenticação
jest.mock('@/app/services/authService', () => ({
  api: {
    post: jest.fn(),
    defaults: {
      headers: {},
    },
  },
  loginWithCredentials: jest.fn(),
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
    // Mock da resposta de sucesso do API
    const mockApiResponse = {
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
    
    // Configurar mocks para simular login bem-sucedido
    (authService.api.post as jest.Mock).mockResolvedValueOnce(mockApiResponse);
    
    render(<LoginPage />);
    const user = userEvent.setup();
    
    // Preenche os campos corretamente
    await user.type(screen.getByLabelText(/Email ou CPF/i), 'test@example.com');
    await user.type(screen.getByLabelText(/Senha/i), 'password123');
    
    // Clica no botão de entrar
    await user.click(screen.getByRole('button', { name: /Entrar/i }));
    
    // Verifica se a API foi chamada corretamente
    await waitFor(() => {
      expect(authService.api.post).toHaveBeenCalledWith(API_ROUTES.LOGIN, {
        login: 'test@example.com',
        password: 'password123',
      });
    });
    
    // Verifica se os cookies são definidos
    await waitFor(() => {
      expect(Cookies.set).toHaveBeenCalledWith('token', 'fake-token', expect.any(Object));
    });
    
    // Verifica se houve o redirecionamento
    await waitFor(() => {
      expect(window.location.href).toBe('/dashboard');
    });
  });

  it('handles login error', async () => {
    // Mock da resposta de erro
    const errorMessage = 'Erro ao fazer login. Tente novamente.';
    // Criar um objeto de erro simples em vez de usar AxiosError
    const mockError = new Error(errorMessage);
    // Adicionar manualmente as propriedades que precisamos
    (mockError as any).response = { 
      data: { 
        message: errorMessage 
      } 
    };
    
    // Configurar mock para simular um erro
    (authService.api.post as jest.Mock).mockRejectedValueOnce(mockError);
    
    render(<LoginPage />);
    const user = userEvent.setup();
    
    // Preenche os campos
    await user.type(screen.getByLabelText(/Email ou CPF/i), 'invalid@example.com');
    await user.type(screen.getByLabelText(/Senha/i), 'wrongpassword');
    
    // Clica no botão de entrar
    await user.click(screen.getByRole('button', { name: /Entrar/i }));
    
    // Verifica se a mensagem de erro aparece - procurando pelo texto do erro
    await waitFor(() => {
      // Buscamos qualquer texto que corresponda ao padrão de mensagem de erro
      const errorElement = screen.queryByText(errorMessage);
      expect(errorElement).toBeInTheDocument();
    });
    
    // Verifica se não houve redirecionamento
    expect(window.location.href).toBe('');
  });

  it('shows loading state during submission', async () => {
    // Configurar estado de carregamento
    const mockApiResponse = {
      data: {
        token: 'fake-token',
        user: {
          _id: 'user-id',
          name: 'Test User',
          role: 'admin',
        }
      }
    };
    
    // Deixar a promessa pendente durante algum tempo para ver o estado de loading
    let resolvePromise: (value: typeof mockApiResponse) => void = () => {};
    const promise = new Promise<typeof mockApiResponse>(resolve => {
      resolvePromise = resolve;
    });
    
    (authService.api.post as jest.Mock).mockImplementationOnce(() => promise);
    
    render(<LoginPage />);
    const user = userEvent.setup();
    
    // Preenche os campos
    await user.type(screen.getByLabelText(/Email ou CPF/i), 'test@example.com');
    await user.type(screen.getByLabelText(/Senha/i), 'password123');
    
    // Clica no botão de entrar
    await user.click(screen.getByRole('button', { name: /Entrar/i }));
    
    // Verificar se encontramos um botão que está desabilitado
    await waitFor(() => {
      // Buscamos qualquer botão de submissão desabilitado
      const submitButton = screen.getByRole('button', { name: /Aguarde/i });
      expect(submitButton).toBeDisabled();
    });
    
    // Resolver a promessa
    resolvePromise(mockApiResponse);
    
    // Aguardar que a submissão seja concluída
    await waitFor(() => {
      expect(authService.api.post).toHaveBeenCalled();
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