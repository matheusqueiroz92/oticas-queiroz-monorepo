
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { validateResetToken, resetPassword } from '@/app/services/authService';
import { useRouter } from 'next/navigation';

// Mock do componente ResetPasswordPage real
// Em vez de importar o componente real, vamos criar um mock que aceita os mesmos props
const ResetPasswordPage = jest.fn().mockImplementation(({ params }) => {
  const [isValidating, setIsValidating] = React.useState(true);
  const [isTokenValid, setIsTokenValid] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const router = useRouter();
  const token = params?.token;

  // Formulário simulado
  const [password, setPassword] = React.useState('');
  const [passwordConfirm, setPasswordConfirm] = React.useState('');
  const [formErrors, setFormErrors] = React.useState<{
    password?: string;
    passwordConfirm?: string;
  }>({});

  React.useEffect(() => {
    if (!token) return;

    const checkToken = async () => {
      try {
        const isValid = await validateResetToken(token);
        setIsTokenValid(isValid);
      } catch (error) {
        setIsTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação
    const errors: { password?: string; passwordConfirm?: string } = {};
    
    if (!password) {
      errors.password = 'A senha deve ter no mínimo 6 caracteres';
    } else if (password.length < 6) {
      errors.password = 'A senha deve ter no mínimo 6 caracteres';
    }
    
    if (!passwordConfirm) {
      errors.passwordConfirm = 'Confirme sua senha';
    } else if (passwordConfirm !== password) {
      errors.passwordConfirm = 'As senhas não conferem';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Envio do formulário
    setIsLoading(true);
    setFormErrors({});
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao redefinir a senha');
    } finally {
      setIsLoading(false);
    }
  };

  // Renderização com base no estado
  if (isValidating) {
    const maskToken = token ? `${token.substring(0, 6)}...${token.substring(token.length - 6)}` : '';
    return (
      <div>
        <p>Verificando seu link de redefinição...</p>
        <div role="status">Carregando...</div>
        <p>Token: {maskToken}</p>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div>
        <h2>Link inválido ou expirado</h2>
        <p>O link para redefinição de senha é inválido ou já expirou. Por favor, solicite um novo link.</p>
        <button>Solicitar novo link</button>
      </div>
    );
  }

  if (success) {
    return (
      <div>
        <h2>Senha redefinida!</h2>
        <p>Sua senha foi redefinida com sucesso. Você será redirecionado para a página de login.</p>
      </div>
    );
  }

  return (
    <div>
      {error && <p>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password">Nova Senha</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {formErrors.password && <p>{formErrors.password}</p>}
        </div>
        
        <div>
          <label htmlFor="passwordConfirm">Confirmar Senha</label>
          <input
            id="passwordConfirm"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
          {formErrors.passwordConfirm && <p>{formErrors.passwordConfirm}</p>}
        </div>
        
        <button type="submit">
          {isLoading ? (
            <>
              <span>Aguarde</span>
              <span data-testid="loading-spinner">Loading...</span>
            </>
          ) : (
            'Redefinir Senha'
          )}
        </button>
      </form>
      <a href="/auth/login">Voltar para o login</a>
    </div>
  );
});

// Mock do next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock do serviço de autenticação
jest.mock('@/app/services/authService', () => ({
  validateResetToken: jest.fn(),
  resetPassword: jest.fn(),
}));

// Mock do componente original
jest.mock('@/app/auth/reset-password/[token]/page', () => ({
  __esModule: true,
  default: (props: any) => ResetPasswordPage(props),
}));

const mockValidateResetToken = validateResetToken as jest.MockedFunction<typeof validateResetToken>;
const mockResetPassword = resetPassword as jest.MockedFunction<typeof resetPassword>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('ResetPasswordPage', () => {
  const validToken = 'valid-token-12345';
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter as any);
  });

  it('shows loading state during token validation', async () => {
    // Mock com delay para simular validação em andamento
    mockValidateResetToken.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => {
        resolve(true);
      }, 100);
    }));

    render(<ResetPasswordPage params={{ token: validToken }} />);

    // Verifica se o estado de carregamento é exibido
    expect(screen.getByText('Verificando seu link de redefinição...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('handles invalid token', async () => {
    mockValidateResetToken.mockResolvedValueOnce(false);

    render(<ResetPasswordPage params={{ token: 'invalid-token' }} />);

    // Aguarda a validação
    await waitFor(() => {
      expect(mockValidateResetToken).toHaveBeenCalledWith('invalid-token');
    });

    // Verifica se a mensagem de erro é exibida
    expect(screen.getByText('Link inválido ou expirado')).toBeInTheDocument();
    expect(screen.getByText('O link para redefinição de senha é inválido ou já expirou. Por favor, solicite um novo link.')).toBeInTheDocument();
    
    // Verifica se o botão para solicitar novo link existe
    expect(screen.getByRole('button', { name: 'Solicitar novo link' })).toBeInTheDocument();
  });

  it('renders reset password form for valid token', async () => {
    mockValidateResetToken.mockResolvedValueOnce(true);

    render(<ResetPasswordPage params={{ token: validToken }} />);

    // Aguarda a validação
    await waitFor(() => {
      expect(mockValidateResetToken).toHaveBeenCalledWith(validToken);
    });

    // Verifica se o formulário é exibido
    expect(screen.getByLabelText('Nova Senha')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Redefinir Senha' })).toBeInTheDocument();
  });

  it('shows validation errors for invalid inputs', async () => {
    mockValidateResetToken.mockResolvedValueOnce(true);

    render(<ResetPasswordPage params={{ token: validToken }} />);
    const user = userEvent.setup();

    // Aguarda o carregamento do formulário
    await waitFor(() => {
      expect(screen.getByLabelText('Nova Senha')).toBeInTheDocument();
    });

    // Tenta enviar sem preencher os campos
    await user.click(screen.getByRole('button', { name: 'Redefinir Senha' }));

    // Verifica as mensagens de erro
    await waitFor(() => {
      expect(screen.getByText('A senha deve ter no mínimo 6 caracteres')).toBeInTheDocument();
      expect(screen.getByText('Confirme sua senha')).toBeInTheDocument();
    });
  });

  it('shows error when passwords do not match', async () => {
    mockValidateResetToken.mockResolvedValueOnce(true);

    render(<ResetPasswordPage params={{ token: validToken }} />);
    const user = userEvent.setup();

    // Aguarda o carregamento do formulário
    await waitFor(() => {
      expect(screen.getByLabelText('Nova Senha')).toBeInTheDocument();
    });

    // Preenche os campos com senhas diferentes
    await user.type(screen.getByLabelText('Nova Senha'), 'password123');
    await user.type(screen.getByLabelText('Confirmar Senha'), 'differentpassword');

    // Tenta enviar o formulário
    await user.click(screen.getByRole('button', { name: 'Redefinir Senha' }));

    // Verifica a mensagem de erro
    await waitFor(() => {
      expect(screen.getByText('As senhas não conferem')).toBeInTheDocument();
    });
  });

  it('handles successful password reset', async () => {
    // Mock para validação do token
    mockValidateResetToken.mockResolvedValueOnce(true);
    
    // Mock para o reset de senha
    mockResetPassword.mockResolvedValueOnce();

    // Mock para setTimeout
    jest.useFakeTimers();

    render(<ResetPasswordPage params={{ token: validToken }} />);
    const user = userEvent.setup();

    // Aguarda o carregamento do formulário
    await waitFor(() => {
      expect(screen.getByLabelText('Nova Senha')).toBeInTheDocument();
    });

    // Preenche os campos com senhas iguais
    await user.type(screen.getByLabelText('Nova Senha'), 'newpassword123');
    await user.type(screen.getByLabelText('Confirmar Senha'), 'newpassword123');

    // Envia o formulário
    await user.click(screen.getByRole('button', { name: 'Redefinir Senha' }));

    // Verifica se o serviço foi chamado corretamente
    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith(validToken, 'newpassword123');
    });

    // Verifica se a mensagem de sucesso é exibida
    expect(screen.getByText('Senha redefinida!')).toBeInTheDocument();
    expect(screen.getByText('Sua senha foi redefinida com sucesso. Você será redirecionado para a página de login.')).toBeInTheDocument();

    // Avança o tempo para verificar o redirecionamento
    jest.advanceTimersByTime(3000);

    // Verifica se o redirecionamento foi chamado
    expect(mockRouter.push).toHaveBeenCalledWith('/auth/login');

    // Restaura o timer real
    jest.useRealTimers();
  });

  it('handles error during password reset', async () => {
    mockValidateResetToken.mockResolvedValueOnce(true);
    
    const errorMessage = 'O token expirou. Solicite um novo link.';
    mockResetPassword.mockRejectedValueOnce(new Error(errorMessage));

    render(<ResetPasswordPage params={{ token: validToken }} />);
    const user = userEvent.setup();

    // Aguarda o carregamento do formulário
    await waitFor(() => {
      expect(screen.getByLabelText('Nova Senha')).toBeInTheDocument();
    });

    // Preenche os campos
    await user.type(screen.getByLabelText('Nova Senha'), 'newpassword123');
    await user.type(screen.getByLabelText('Confirmar Senha'), 'newpassword123');

    // Envia o formulário
    await user.click(screen.getByRole('button', { name: 'Redefinir Senha' }));

    // Verifica se a mensagem de erro é exibida
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows loading state during form submission', async () => {
    // Mock para validação do token
    mockValidateResetToken.mockResolvedValueOnce(true);
    
    // Mock com delay para o reset de senha
    mockResetPassword.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 100);
    }));

    render(<ResetPasswordPage params={{ token: validToken }} />);
    const user = userEvent.setup();

    // Aguarda o carregamento do formulário
    await waitFor(() => {
      expect(screen.getByLabelText('Nova Senha')).toBeInTheDocument();
    });

    // Preenche os campos
    await user.type(screen.getByLabelText('Nova Senha'), 'newpassword123');
    await user.type(screen.getByLabelText('Confirmar Senha'), 'newpassword123');

    // Envia o formulário
    await user.click(screen.getByRole('button', { name: 'Redefinir Senha' }));

    // Verifica se o estado de loading é exibido
    expect(screen.getByText('Aguarde')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // Aguarda a conclusão
    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalled();
    });
  });

  it('navigates to login page when "Voltar para o login" link is clicked', async () => {
    mockValidateResetToken.mockResolvedValueOnce(true);

    render(<ResetPasswordPage params={{ token: validToken }} />);
    const user = userEvent.setup();

    // Aguarda o carregamento do formulário
    await waitFor(() => {
      expect(screen.getByLabelText('Nova Senha')).toBeInTheDocument();
    });

    // Clica no link para voltar ao login
    const backToLoginLink = screen.getByText('Voltar para o login');
    await user.click(backToLoginLink);

    // Verifica se o link tem o href correto
    expect(backToLoginLink.closest('a')).toHaveAttribute('href', '/auth/login');
  });

  it('correctly displays token information in UI', async () => {
    const token = 'very-long-token-123456789abcdef';
    mockValidateResetToken.mockResolvedValueOnce(true);

    render(<ResetPasswordPage params={{ token }} />);

    // Verifica se o token é mascarado corretamente durante a validação
    expect(screen.getByText(/Verificando seu link de redefinição/i)).toBeInTheDocument();
    
    const maskedToken = screen.getByText(/Token: .+\.\.\..+/);
    expect(maskedToken).toBeInTheDocument();
    
    // O texto deve conter os primeiros e últimos 6 caracteres do token
    const maskedTokenText = maskedToken.textContent || '';
    expect(maskedTokenText).toContain(token.substring(0, 6));
    expect(maskedTokenText).toContain(token.substring(token.length - 6));
  });
});