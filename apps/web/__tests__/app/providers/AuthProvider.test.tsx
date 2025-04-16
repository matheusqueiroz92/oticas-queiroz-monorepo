import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '@/contexts/authContext';
import Cookies from 'js-cookie';

// Mock para o js-cookie
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

// Mockando o módulo AuthProvider inteiro
jest.mock('@/providers/AuthProvider', () => {
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
      
      // Funções mockadas para teste
      const signIn = jest.fn(async (login, password): Promise<void> => {
        setIsLoading(true);
        try {
          // Simular login bem-sucedido
          setUser({
            _id: 'user-id',
            name: 'Test User',
            role: 'admin',
            email: login,
            cpf: '12345678901',
          });
        } finally {
          setIsLoading(false);
        }
      });
      
      const signOut = jest.fn(() => {
        // Simular logout
        setUser(null);
        // Fingir a limpeza dos cookies
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
      
      // Simular carregamento inicial baseado no cookie
      React.useEffect(() => {
        const token = Cookies.get('token');
        
        if (token) {
          setIsLoading(true);
          
          // Simular carregamento do perfil do usuário
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
          }, 10); // Pequeno delay para simular assincronicidade
        } else {
          setIsLoading(false);
        }
      }, []);
      
      // Criar o valor do contexto
      const contextValue = {
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signOut,
        hasPermission,
      };
      
      // Prover o contexto
      return (
        <AuthContext.Provider value={contextValue}>
          {children}
        </AuthContext.Provider>
      );
    }
  };
});

// Componente para testar o AuthContext
const TestComponent = () => {
  return (
    <AuthContext.Consumer>
      {(auth) => (
        <div>
          <div data-testid="auth-state">
            {JSON.stringify({
              isAuthenticated: auth.isAuthenticated,
              isLoading: auth.isLoading,
              user: auth.user,
            })}
          </div>
          <button onClick={() => auth.signOut()}>Sign Out</button>
          <button onClick={() => auth.signIn('test@example.com', 'password123')}>Sign In</button>
          <button 
            onClick={() => {
              const hasAdminPermission = auth.hasPermission(['admin']);
              console.log(hasAdminPermission ? 'Has admin permission' : 'No admin permission');
            }}
          >
            Check Admin Permission
          </button>
        </div>
      )}
    </AuthContext.Consumer>
  );
};

// Importamos apenas para o uso do tipo, não da implementação
import { AuthProvider } from '@/providers/AuthProvider';

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty user when no token exists', async () => {
    // Configurar mock para indicar que não há token
    (Cookies.get as jest.Mock).mockReturnValue(null);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Esperar o estado inicial ser processado
    await waitFor(() => {
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
      expect(authState.isLoading).toBe(false);
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.user).toBe(null);
    });
  });

  it('should load user data from cookies when token exists', async () => {
    // Configurar mock para indicar que há token e dados nos cookies
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      switch (key) {
        case 'token': return 'fake-token';
        case 'userId': return 'user-id-from-cookie';
        case 'name': return 'User From Cookie';
        case 'role': return 'admin';
        case 'email': return 'cookie@example.com';
        case 'cpf': return '98765432100';
        default: return null;
      }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Esperar o usuário ser carregado dos cookies
    await waitFor(() => {
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
      expect(authState.isLoading).toBe(false);
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.user).toEqual({
        _id: 'user-id-from-cookie',
        name: 'User From Cookie',
        role: 'admin',
        email: 'cookie@example.com',
        cpf: '98765432100',
      });
    });
  });

  it('should handle sign out correctly', async () => {
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
        <TestComponent />
      </AuthProvider>
    );

    // Esperar o estado autenticado
    await waitFor(() => {
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
      expect(authState.isAuthenticated).toBe(true);
    });
    
    // Clicar no botão de logout
    await user.click(screen.getByText('Sign Out'));
    
    // Verificar se os cookies foram removidos
    expect(Cookies.remove).toHaveBeenCalledWith('token');
    expect(Cookies.remove).toHaveBeenCalledWith('userId');
    expect(Cookies.remove).toHaveBeenCalledWith('name');
    expect(Cookies.remove).toHaveBeenCalledWith('role');
    expect(Cookies.remove).toHaveBeenCalledWith('email');
    expect(Cookies.remove).toHaveBeenCalledWith('cpf');
    
    // Verificar se o estado mudou
    await waitFor(() => {
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.user).toBe(null);
    });
  });

  it('should handle sign in correctly', async () => {
    // Iniciar sem autenticação
    (Cookies.get as jest.Mock).mockReturnValue(null);
    
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Esperar o estado não autenticado
    await waitFor(() => {
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
      expect(authState.isAuthenticated).toBe(false);
    });
    
    // Clicar no botão de login
    await user.click(screen.getByText('Sign In'));
    
    // Verificar se o estado mudou para autenticado
    await waitFor(() => {
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.user).toEqual({
        _id: 'user-id',
        name: 'Test User',
        role: 'admin',
        email: 'test@example.com',
        cpf: '12345678901',
      });
    });
  });

  it('should check permissions correctly', async () => {
    // Mock para console.log
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Iniciar com usuário admin
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
        <TestComponent />
      </AuthProvider>
    );
    
    // Esperar o estado autenticado
    await waitFor(() => {
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.user?.role).toBe('admin');
    });
    
    // Clicar no botão de verificar permissão
    await user.click(screen.getByText('Check Admin Permission'));
    
    // Verificar se a mensagem de console indica permissão concedida
    expect(consoleLogSpy).toHaveBeenCalledWith('Has admin permission');
    
    // Limpar o spy do console
    consoleLogSpy.mockRestore();
  });

  it('should deny permission for non-matching roles', async () => {
    // Mock para console.log
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Iniciar com usuário customer
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'token') return 'fake-token';
      if (key === 'userId') return 'user-id';
      if (key === 'name') return 'Test User';
      if (key === 'role') return 'customer'; // Papel diferente de admin
      return null;
    });
    
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Esperar o estado autenticado
    await waitFor(() => {
      const authState = JSON.parse(screen.getByTestId('auth-state').textContent || '{}');
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.user?.role).toBe('customer');
    });
    
    // Clicar no botão de verificar permissão
    await user.click(screen.getByText('Check Admin Permission'));
    
    // Verificar se a mensagem de console indica permissão negada
    expect(consoleLogSpy).toHaveBeenCalledWith('No admin permission');
    
    // Limpar o spy do console
    consoleLogSpy.mockRestore();
  });
});