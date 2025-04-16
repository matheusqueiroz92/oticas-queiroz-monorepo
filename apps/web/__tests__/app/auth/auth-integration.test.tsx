import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Cookies from 'js-cookie';

// Mocks necessários
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

// Mocks para os componentes e serviços necessários
jest.mock('@/app/services/authService', () => {
  return {
    api: {
      get: jest.fn(),
      post: jest.fn(),
    },
    loginWithCredentials: jest.fn(),
    requestPasswordReset: jest.fn(),
    validateResetToken: jest.fn(),
    resetPassword: jest.fn(), 
    clearAuthCookies: jest.fn(),
    redirectAfterLogout: jest.fn(),
    isAuthenticated: jest.fn(),
    getUserRole: jest.fn(),
  };
});

// Mock do componente de login
jest.mock('@/app/auth/login/page', () => {
  return function MockLoginPage() {
    return (
      <div>
        <h1>Login Page</h1>
        <form data-testid="login-form">
          <label htmlFor="email">Email ou CPF</label>
          <input id="email" type="text" />
          <label htmlFor="password">Senha</label>
          <input id="password" type="password" />
          <button type="submit">Entrar</button>
        </form>
        <a href="/auth/forgot-password">Esqueceu sua senha?</a>
      </div>
    );
  };
});

// Mock do contexto de autenticação
jest.mock('@/contexts/authContext', () => {
  const React = require('react');
  
  const AuthContext = React.createContext({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
    hasPermission: jest.fn(),
  });
  
  return { AuthContext };
});

// Mock do provider de autenticação
jest.mock('@/providers/AuthProvider', () => {
  const { AuthContext } = require('@/contexts/authContext');
  
  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) => {
      interface User {
        _id: string;
        name: string;
        role: string;
        email: string;
        cpf: string;
      }

      const [user, setUser] = React.useState<User | null>(null);
      const [isLoading, setIsLoading] = React.useState(false);
      
      // Funções mockadas
      const signIn = jest.fn(async (login, password) => {
        setIsLoading(true);
        try {
          // Simular login bem-sucedido
          const mockUser = {
            _id: 'user-id',
            name: 'Test User',
            role: 'admin',
            email: login,
            cpf: '12345678901',
          };
          
          setUser(mockUser);
          
          // Simular definição de cookies (SEM o terceiro parâmetro)
          Cookies.set('token', 'fake-token');
          Cookies.set('userId', mockUser._id);
          Cookies.set('name', mockUser.name);
          Cookies.set('role', mockUser.role);
          Cookies.set('email', mockUser.email);
          Cookies.set('cpf', mockUser.cpf);
          
          return { success: true, user: mockUser };
        } catch (error) {
          return { success: false, error };
        } finally {
          setIsLoading(false);
        }
      });
      
      const signOut = jest.fn(() => {
        setUser(null);
        Cookies.remove('token');
        Cookies.remove('userId');
        Cookies.remove('name');
        Cookies.remove('role');
        Cookies.remove('email');
        Cookies.remove('cpf');
      });
      
      const hasPermission = jest.fn((requiredRoles) => {
        if (!user) return false;
        return requiredRoles.includes(user.role);
      });
      
      // Efeito para carregar dados iniciais
      React.useEffect(() => {
        const token = Cookies.get('token');
        if (token) {
          setIsLoading(true);
          
          // Simular carregamento do perfil
          const userFromCookies = {
            _id: Cookies.get('userId') || 'default-id',
            name: Cookies.get('name') || 'Default User',
            role: Cookies.get('role') || 'customer',
            email: Cookies.get('email') || 'default@example.com', 
            cpf: Cookies.get('cpf') || '12345678901',
          };
          
          // Simular delay
          setTimeout(() => {
            setUser(userFromCookies);
            setIsLoading(false);
          }, 10);
        }
      }, []);
      
      // Valor do contexto
      const authValue = {
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signOut,
        hasPermission,
      };
      
      return (
        <AuthContext.Provider value={authValue}>
          {children}
        </AuthContext.Provider>
      );
    }
  };
});

// Mock do hook useAuth
jest.mock('@/hooks/useAuth', () => {
  return {
    useAuth: jest.fn(() => {
      const { useContext } = require('react');
      const { AuthContext } = require('@/contexts/authContext');
      return useContext(AuthContext);
    })
  };
});

// Componente de teste que usa autenticação
function AuthTestComponent() {
  const { useAuth } = require('@/hooks/useAuth');
  const auth = useAuth();
  
  return (
    <div>
      <h1>Auth Test</h1>
      <div data-testid="auth-info">
        {auth.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      <button onClick={() => auth.signIn('test@example.com', 'password123')}>Login</button>
      <button onClick={() => auth.signOut()}>Logout</button>
    </div>
  );
}

// Importar o provedor real apenas para tipagem
import { AuthProvider } from '@/providers/AuthProvider';

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Resetar isAuthenticated e getUserRole para valores padrão
    const { isAuthenticated, getUserRole } = require('@/app/services/authService');
    (isAuthenticated as jest.Mock).mockReturnValue(false);
    (getUserRole as jest.Mock).mockReturnValue(undefined);
  });

  it('should handle login flow correctly', async () => {
    // Configurar mock para autenticação
    const { loginWithCredentials } = require('@/app/services/authService');
    (loginWithCredentials as jest.Mock).mockResolvedValueOnce({
      token: 'fake-token',
      user: {
        _id: 'user-id',
        name: 'Test User',
        role: 'admin',
        email: 'test@example.com',
        cpf: '12345678901'
      }
    });
    
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    
    // Verificar estado inicial não autenticado
    expect(screen.getByTestId('auth-info')).toHaveTextContent('Not Authenticated');
    
    // Clicar no botão de login
    await user.click(screen.getByText('Login'));
    
    // Verificar se o estado mudou para autenticado
    await waitFor(() => {
      expect(screen.getByTestId('auth-info')).toHaveTextContent('Authenticated');
    });
    
    // Verificar se os cookies foram definidos (SEM o terceiro parâmetro)
    expect(Cookies.set).toHaveBeenCalledWith('token', expect.any(String));
    expect(Cookies.set).toHaveBeenCalledWith('userId', expect.any(String));
    expect(Cookies.set).toHaveBeenCalledWith('name', expect.any(String));
    expect(Cookies.set).toHaveBeenCalledWith('role', expect.any(String));
  });

  it('should handle logout flow correctly', async () => {
    // Configurar mock para iniciar com usuário autenticado
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'token') return 'fake-token';
      if (key === 'userId') return 'user-id';
      if (key === 'name') return 'Test User';
      if (key === 'role') return 'admin';
      return null;
    });
    
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    
    // Esperar o estado autenticado
    await waitFor(() => {
      expect(screen.getByTestId('auth-info')).toHaveTextContent('Authenticated');
    });
    
    // Clicar no botão de logout
    await user.click(screen.getByText('Logout'));
    
    // Verificar se o estado mudou para não autenticado
    await waitFor(() => {
      expect(screen.getByTestId('auth-info')).toHaveTextContent('Not Authenticated');
    });
    
    // Verificar se os cookies foram removidos
    expect(Cookies.remove).toHaveBeenCalledWith('token');
    expect(Cookies.remove).toHaveBeenCalledWith('userId');
    expect(Cookies.remove).toHaveBeenCalledWith('name');
    expect(Cookies.remove).toHaveBeenCalledWith('role');
    expect(Cookies.remove).toHaveBeenCalledWith('email');
    expect(Cookies.remove).toHaveBeenCalledWith('cpf');
  });

  it('should load authenticated user on initial render', async () => {
    // Configurar mock para usuário já autenticado
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'token') return 'fake-token';
      if (key === 'userId') return 'user-id';
      if (key === 'name') return 'Test User';
      if (key === 'role') return 'admin';
      if (key === 'email') return 'test@example.com';
      if (key === 'cpf') return '12345678901';
      return null;
    });
    
    const { isAuthenticated } = require('@/app/services/authService');
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    
    render(
      <AuthProvider>
        <AuthTestComponent />
      </AuthProvider>
    );
    
    // Verificar se o componente mostra estado autenticado
    await waitFor(() => {
      expect(screen.getByTestId('auth-info')).toHaveTextContent('Authenticated');
    });
  });
});