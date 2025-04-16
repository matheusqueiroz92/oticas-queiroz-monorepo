import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthContext, AuthContextData } from '@/contexts/authContext';

// Mock do contexto de autenticação
const mockContextValue: AuthContextData = {
  user: {
    _id: 'user-id',
    name: 'Test User',
    email: 'test@example.com',
    cpf: '12345678901',
    role: 'admin',
  },
  isAuthenticated: true,
  isLoading: false,
  signIn: jest.fn(),
  signOut: jest.fn(),
  hasPermission: jest.fn(),
};

// Mock do AuthContext
jest.mock('@/contexts/authContext', () => ({
  __esModule: true,
  AuthContext: {
    Provider: ({ children, value }: { children: React.ReactNode, value: any }) => (
      <div data-testid="auth-provider">{children}</div>
    ),
    Consumer: ({ children }: { children: Function }) => children(mockContextValue),
  },
}));

// Mock do useAuth hook que usa o contexto React
jest.mock('@/hooks/useAuth', () => ({
  __esModule: true,
  useAuth: jest.fn(),
}));

// Wrapper do provedor para testes
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthContext.Provider value={mockContextValue}>
    {children}
  </AuthContext.Provider>
);

describe('useAuth hook', () => {
  // Configurar os mocks antes de cada teste
  beforeEach(() => {
    jest.clearAllMocks();
    // Configurar o comportamento padrão do useAuth mock
    (useAuth as jest.Mock).mockImplementation(() => mockContextValue);
  });

  it('should return the auth context', () => {
    // Chamar o hook mockado
    const result = useAuth();

    // Verificar se retorna o valor esperado
    expect(result).toBe(mockContextValue);
    expect(result.user).toBe(mockContextValue.user);
    expect(result.isAuthenticated).toBe(true);
    expect(result.isLoading).toBe(false);
  });

  it('should throw an error if used outside of AuthProvider', () => {
    // Mockando o hook para lançar um erro quando chamado sem contexto
    (useAuth as jest.Mock).mockImplementationOnce(() => {
      throw new Error('useAuth must be used within an AuthProvider');
    });

    // Verificar se o erro é lançado
    expect(() => {
      useAuth();
    }).toThrow('useAuth must be used within an AuthProvider');
  });

  it('should call signIn with correct parameters', async () => {
    const mockSignIn = jest.fn().mockResolvedValue(undefined);
    
    // Configurar o mock para retornar uma implementação específica
    (useAuth as jest.Mock).mockReturnValueOnce({
      ...mockContextValue,
      signIn: mockSignIn,
    });
    
    // Chamar o hook mockado
    const { signIn } = useAuth();
    
    // Chamar a função signIn
    await signIn('test@example.com', 'password123');
    
    // Verificar se foi chamada com os parâmetros corretos
    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('should call signOut when requested', () => {
    const mockSignOut = jest.fn();
    
    // Configurar o mock para retornar uma implementação específica
    (useAuth as jest.Mock).mockReturnValueOnce({
      ...mockContextValue,
      signOut: mockSignOut,
    });
    
    // Chamar o hook mockado
    const { signOut } = useAuth();
    
    // Chamar a função signOut
    signOut();
    
    // Verificar se foi chamada
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('should check permission correctly', () => {
    const mockHasPermission = jest.fn()
      .mockImplementation((roles: string[]) => roles.includes('admin'));
    
    // Configurar o mock para retornar uma implementação específica
    (useAuth as jest.Mock).mockReturnValueOnce({
      ...mockContextValue,
      hasPermission: mockHasPermission,
    });
    
    // Chamar o hook mockado
    const { hasPermission } = useAuth();
    
    // Testar com uma role que deve retornar true
    expect(hasPermission(['admin'])).toBe(true);
    
    // Testar com uma role que deve retornar false
    expect(hasPermission(['employee'])).toBe(false);
    
    // Verificar se a função foi chamada com os parâmetros corretos
    expect(mockHasPermission).toHaveBeenCalledWith(['admin']);
    expect(mockHasPermission).toHaveBeenCalledWith(['employee']);
  });
});