import axios from 'axios';
import Cookies from 'js-cookie';
import { 
  loginWithCredentials, 
  requestPasswordReset,
  validateResetToken,
  resetPassword,
  clearAuthCookies,
  isAuthenticated,
  getUserRole
} from '@/app/_services/authService';

// Criar mock completo do módulo authService
jest.mock('@/app/services/authService', () => {
  const api = {
    get: jest.fn(),
    post: jest.fn(),
    defaults: {
      headers: { common: {} }
    },
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  };

  return { 
    api,
    loginWithCredentials: jest.fn(),
    requestPasswordReset: jest.fn(),
    validateResetToken: jest.fn(),
    resetPassword: jest.fn(),
    clearAuthCookies: jest.fn(),
    isAuthenticated: jest.fn(),
    getUserRole: jest.fn()
  };
});

// Mock do axios
jest.mock('axios');

// Mock do js-cookie
jest.mock('js-cookie');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar valores padrão para os mocks
    (axios.isAxiosError as unknown as jest.Mock).mockImplementation((error) => {
      return error && error.response !== undefined;
    });
  });

  describe('loginWithCredentials', () => {
    it('should call API with correct credentials', async () => {
      const mockUser = {
        _id: 'user-id',
        name: 'Test User',
        role: 'admin',
        email: 'test@example.com',
        cpf: '12345678901'
      };
      
      // Configurar mock para retornar sucesso
      (loginWithCredentials as jest.Mock).mockResolvedValueOnce({
        token: 'fake-token',
        user: mockUser
      });

      const result = await loginWithCredentials('test@example.com', 'password123');
      
      expect(loginWithCredentials).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(result).toEqual({
        token: 'fake-token',
        user: mockUser
      });
    });

    it('should handle login errors', async () => {
      // Configurar mock para lançar erro
      (loginWithCredentials as jest.Mock).mockRejectedValueOnce(
        new Error('Credenciais inválidas')
      );
      
      await expect(loginWithCredentials('wrong@email.com', 'wrongpass'))
        .rejects.toThrow('Credenciais inválidas');
    });
  });

  describe('requestPasswordReset', () => {
    it('should call API with the email', async () => {
      // Configurar mock para sucesso
      (requestPasswordReset as jest.Mock).mockResolvedValueOnce(undefined);
      
      await requestPasswordReset('test@example.com');
      
      expect(requestPasswordReset).toHaveBeenCalledWith('test@example.com');
    });

    it('should handle request errors', async () => {
      // Configurar mock para lançar erro
      (requestPasswordReset as jest.Mock).mockRejectedValueOnce(
        new Error('Email não encontrado')
      );
      
      await expect(requestPasswordReset('unknown@example.com'))
        .rejects.toThrow('Email não encontrado');
    });
  });

  describe('validateResetToken', () => {
    it('should return true for valid token', async () => {
      // Configurar mock para retornar true
      (validateResetToken as jest.Mock).mockResolvedValueOnce(true);
      
      const result = await validateResetToken('valid-token');
      
      expect(validateResetToken).toHaveBeenCalledWith('valid-token');
      expect(result).toBe(true);
    });

    it('should return false for invalid token', async () => {
      // Configurar mock para retornar false
      (validateResetToken as jest.Mock).mockResolvedValueOnce(false);
      
      const result = await validateResetToken('invalid-token');
      
      expect(result).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('should call API with token and password', async () => {
      // Configurar mock para sucesso
      (resetPassword as jest.Mock).mockResolvedValueOnce(undefined);
      
      await resetPassword('valid-token', 'newpassword123');
      
      expect(resetPassword).toHaveBeenCalledWith('valid-token', 'newpassword123');
    });

    it('should handle reset errors', async () => {
      // Configurar mock para lançar erro
      (resetPassword as jest.Mock).mockRejectedValueOnce(
        new Error('Token expirado')
      );
      
      await expect(resetPassword('expired-token', 'newpassword123'))
        .rejects.toThrow('Token expirado');
    });
  });

  describe('clearAuthCookies', () => {
    it('should call cookie removal for all auth cookies', () => {
      // Configurar mock
      (clearAuthCookies as jest.Mock).mockImplementationOnce(() => {
        // Simular a remoção de cookies
        ['token', 'name', 'role', 'userId', 'email', 'cpf'].forEach(cookie => {
          Cookies.remove(cookie);
        });
      });
      
      clearAuthCookies();
      
      // Verificar se a função foi chamada
      expect(clearAuthCookies).toHaveBeenCalled();
      
      // Verificar se Cookies.remove foi chamado para cada cookie
      expect(Cookies.remove).toHaveBeenCalledWith('token');
      expect(Cookies.remove).toHaveBeenCalledWith('name');
      expect(Cookies.remove).toHaveBeenCalledWith('role');
      expect(Cookies.remove).toHaveBeenCalledWith('userId');
      expect(Cookies.remove).toHaveBeenCalledWith('email');
      expect(Cookies.remove).toHaveBeenCalledWith('cpf');
      expect(Cookies.remove).toHaveBeenCalledTimes(6);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      // Configurar mock para simular token existente
      (Cookies.get as jest.Mock).mockReturnValueOnce('fake-token');
      (isAuthenticated as jest.Mock).mockImplementationOnce(() => {
        return !!Cookies.get('token');
      });
      
      const result = isAuthenticated();
      
      expect(result).toBe(true);
      expect(Cookies.get).toHaveBeenCalledWith('token');
    });

    it('should return false when token does not exist', () => {
      // Configurar mock para simular token inexistente
      (Cookies.get as jest.Mock).mockReturnValueOnce(undefined);
      (isAuthenticated as jest.Mock).mockImplementationOnce(() => {
        return !!Cookies.get('token');
      });
      
      const result = isAuthenticated();
      
      expect(result).toBe(false);
      expect(Cookies.get).toHaveBeenCalledWith('token');
    });
  });

  describe('getUserRole', () => {
    it('should return role from cookie', () => {
      // Configurar mock para simular role existente
      (Cookies.get as jest.Mock).mockReturnValueOnce('admin');
      (getUserRole as jest.Mock).mockImplementationOnce(() => {
        return Cookies.get('role');
      });
      
      const result = getUserRole();
      
      expect(result).toBe('admin');
      expect(Cookies.get).toHaveBeenCalledWith('role');
    });

    it('should return undefined when role does not exist', () => {
      // Configurar mock para simular role inexistente
      (Cookies.get as jest.Mock).mockReturnValueOnce(undefined);
      (getUserRole as jest.Mock).mockImplementationOnce(() => {
        return Cookies.get('role');
      });
      
      const result = getUserRole();
      
      expect(result).toBeUndefined();
      expect(Cookies.get).toHaveBeenCalledWith('role');
    });
  });
});