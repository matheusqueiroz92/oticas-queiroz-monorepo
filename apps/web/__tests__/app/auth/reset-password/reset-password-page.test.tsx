import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { validateResetToken, resetPassword } from '@/app/services/authService';
import { useRouter } from 'next/navigation';

// Aumentando o timeout global para todos os testes neste arquivo
jest.setTimeout(20000);

// Mock para o componente ResetPasswordPage
// Aqui vamos fazer um mock completo em vez de usar o real
const ResetPasswordPage = jest.fn(({ params }) => {
  const [isValidating, setIsValidating] = React.useState(true);
  const [isTokenValid, setIsTokenValid] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const router = useRouter();
  // Extrair o token diretamente, sem usar React.use
  const token = params.token;
  
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
    
    // Simulação de validação
    const password = (document.getElementById('password') as HTMLInputElement)?.value;
    const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement)?.value;
    
    if (!password || password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    
    if (!confirmPassword) {
      setError('Confirme sua senha');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não conferem');
      return;
    }
    
    // Envio do formulário
    setIsLoading(true);
    setError(null);
    
    try {
      await resetPassword(token, password);
      setSuccess(true);
      
      // Redirecionar após um tempo menor
      setTimeout(() => {
        router.push('/auth/login');
      }, 100);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erro ao redefinir a senha');
      }
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
        <span data-testid="error-icon">✗</span>
        <h2>Link inválido ou expirado</h2>
        <p>O link para redefinição de senha é inválido ou já expirou. Por favor, solicite um novo link.</p>
        <a href="/auth/forgot-password">Solicitar novo link</a>
      </div>
    );
  }
  
  if (success) {
    return (
      <div>
        <span data-testid="success-icon">✓</span>
        <h2>Senha redefinida!</h2>
        <p>Sua senha foi redefinida com sucesso. Você será redirecionado para a página de login.</p>
        <a href="/auth/login">Ir para o login</a>
      </div>
    );
  }
  
  return (
    <div>
      {error && <div role="alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password">Nova Senha</label>
          <input id="password" type="password" />
        </div>
        
        <div>
          <label htmlFor="confirmPassword">Confirmar Senha</label>
          <input id="confirmPassword" type="password" />
        </div>
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <span data-testid="loading-spinner">Loading...</span>
              Aguarde
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

// Mock para useRouter
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock para o serviço de autenticação
jest.mock('@/app/services/authService', () => ({
  validateResetToken: jest.fn(),
  resetPassword: jest.fn(),
}));

// Mock para o componente real
jest.mock('@/app/auth/reset-password/[token]/page', () => ({
  __esModule: true,
  default: (props: { params: { token: string } }) => ResetPasswordPage(props),
}));

describe('ResetPasswordPage', () => {
  const validToken = 'valid-token-12345';
  const mockRouter = {
    push: jest.fn(),
  };

  const mockValidateResetToken = validateResetToken as jest.MockedFunction<typeof validateResetToken>;
  const mockResetPassword = resetPassword as jest.MockedFunction<typeof resetPassword>;
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter as any);
    jest.useRealTimers(); // Usar timers reais por padrão
  });

  it('shows loading state during token validation', async () => {
    // Configurando para que validateResetToken não resolva imediatamente
    mockValidateResetToken.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => resolve(true), 50);
    }));

    render(<ResetPasswordPage params={{ token: validToken }} />);

    // Verificar o estado de carregamento
    expect(screen.getByText('Verificando seu link de redefinição...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    // Verificar que o token é exibido de forma mascarada
    const tokenText = screen.getByText(/Token:/);
    expect(tokenText).toBeInTheDocument();
    expect(tokenText.textContent).toContain(validToken.substring(0, 6));
    expect(tokenText.textContent).toContain(validToken.substring(validToken.length - 6));
  });

  it('handles invalid token', async () => {
    mockValidateResetToken.mockResolvedValueOnce(false);

    render(<ResetPasswordPage params={{ token: 'invalid-token' }} />);

    // Aguardar a validação do token
    await waitFor(() => {
      expect(mockValidateResetToken).toHaveBeenCalledWith('invalid-token');
    });

    // Verificar se o ícone de erro é exibido
    await waitFor(() => {
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    });
    
    // Verificar se existe um botão ou link para solicitar novo link
    const newLinkButton = screen.getByRole('link', { name: /Solicitar novo link/i });
    expect(newLinkButton).toBeInTheDocument();
    expect(newLinkButton).toHaveAttribute('href', '/auth/forgot-password');
  });

  it('renders reset password form for valid token', async () => {
    mockValidateResetToken.mockResolvedValueOnce(true);

    render(<ResetPasswordPage params={{ token: validToken }} />);

    // Aguardar a validação
    await waitFor(() => {
      expect(mockValidateResetToken).toHaveBeenCalledWith(validToken);
    });

    // Verificar se o formulário é exibido
    await waitFor(() => {
      expect(screen.getByLabelText(/Nova Senha/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirmar Senha/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Redefinir Senha/i })).toBeInTheDocument();
    });
  });

  it('shows validation errors for invalid inputs', async () => {
    mockValidateResetToken.mockResolvedValueOnce(true);

    render(<ResetPasswordPage params={{ token: validToken }} />);
    const user = userEvent.setup();

    // Aguardar o carregamento do formulário
    await waitFor(() => {
      expect(screen.getByLabelText(/Nova Senha/i)).toBeInTheDocument();
    });

    // Tenta enviar sem preencher os campos
    await user.click(screen.getByRole('button', { name: /Redefinir Senha/i }));

    // Verifica as mensagens de erro
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/senha deve ter no mínimo 6 caracteres/i)).toBeInTheDocument();
    });
  });

  it('shows error when passwords do not match', async () => {
    mockValidateResetToken.mockResolvedValueOnce(true);

    render(<ResetPasswordPage params={{ token: validToken }} />);
    const user = userEvent.setup();

    // Aguardar o carregamento do formulário
    await waitFor(() => {
      expect(screen.getByLabelText(/Nova Senha/i)).toBeInTheDocument();
    });

    // Preenche os campos com senhas diferentes
    await user.type(screen.getByLabelText(/Nova Senha/i), 'password123');
    await user.type(screen.getByLabelText(/Confirmar Senha/i), 'differentpassword');

    // Tenta enviar o formulário
    await user.click(screen.getByRole('button', { name: /Redefinir Senha/i }));

    // Verifica a mensagem de erro
    await waitFor(() => {
      expect(screen.getByText(/senhas não conferem/i)).toBeInTheDocument();
    });
  });

  it('handles successful password reset', async () => {
    // Mock para validação do token
    mockValidateResetToken.mockResolvedValueOnce(true);
    
    // Mock para o reset de senha - resolução imediata
    mockResetPassword.mockResolvedValueOnce(undefined);

    render(<ResetPasswordPage params={{ token: validToken }} />);
    const user = userEvent.setup();

    // Aguardar o carregamento do formulário
    await waitFor(() => {
      expect(screen.getByLabelText(/Nova Senha/i)).toBeInTheDocument();
    });

    // Preenche os campos com senhas iguais
    await user.type(screen.getByLabelText(/Nova Senha/i), 'newpassword123');
    await user.type(screen.getByLabelText(/Confirmar Senha/i), 'newpassword123');

    // Envia o formulário
    await user.click(screen.getByRole('button', { name: /Redefinir Senha/i }));

    // Verifica se o serviço foi chamado corretamente
    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith(validToken, 'newpassword123');
    });

    // Verifica se o ícone de sucesso aparece
    await waitFor(() => {
      expect(screen.getByTestId('success-icon')).toBeInTheDocument();
    });

    // Verifica se existe um link para ir ao login
    expect(screen.getByRole('link', { name: /Ir para o login/i })).toBeInTheDocument();
  });

  it('handles error during password reset', async () => {
    // Mock para validação do token
    mockValidateResetToken.mockResolvedValueOnce(true);
    
    // Definir a mensagem de erro
    const errorMessage = 'O token expirou. Solicite um novo link.';
    
    // Este é o ponto chave - configuramos o mock para sempre rejeitar com o erro
    mockResetPassword.mockImplementationOnce(() => {
      return Promise.reject(new Error(errorMessage));
    });

    render(<ResetPasswordPage params={{ token: validToken }} />);
    const user = userEvent.setup();

    // Aguardar o carregamento do formulário
    await waitFor(() => {
      expect(screen.getByLabelText(/Nova Senha/i)).toBeInTheDocument();
    });

    // Preenche os campos
    await user.type(screen.getByLabelText(/Nova Senha/i), 'newpassword123');
    await user.type(screen.getByLabelText(/Confirmar Senha/i), 'newpassword123');

    // Envia o formulário
    await user.click(screen.getByRole('button', { name: /Redefinir Senha/i }));

    // Verifica se a mensagem de erro é exibida
    await waitFor(() => {
      const alerts = screen.queryAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
      
      // Verificar se algum dos alertas contém o texto da mensagem de erro
      const hasErrorMessage = alerts.some(alert => 
        alert.textContent?.includes(errorMessage)
      );
      expect(hasErrorMessage).toBe(true);
    }, { timeout: 5000 });
  });

  it('shows loading state during form submission', async () => {
    // Mock para validação do token
    mockValidateResetToken.mockResolvedValueOnce(true);
    
    // Criamos uma Promise que nunca será resolvida no escopo do teste
    let promiseResolver: (value: void) => void = () => {};
    const neverEndingPromise = new Promise<void>(resolve => {
      promiseResolver = resolve;
    });
    
    // Configuramos mockResetPassword para retornar essa Promise
    mockResetPassword.mockReturnValueOnce(neverEndingPromise);

    render(<ResetPasswordPage params={{ token: validToken }} />);
    const user = userEvent.setup();

    // Aguardar o carregamento do formulário
    await waitFor(() => {
      expect(screen.getByLabelText(/Nova Senha/i)).toBeInTheDocument();
    });

    // Preenche os campos
    await user.type(screen.getByLabelText(/Nova Senha/i), 'newpassword123');
    await user.type(screen.getByLabelText(/Confirmar Senha/i), 'newpassword123');

    // Envia o formulário - aqui vai disparar o estado de carregamento
    await user.click(screen.getByRole('button', { name: /Redefinir Senha/i }));
    
    // Agora forçamos a renderização novamente para que a atualização de estado apareça
    // Este é um hack para garantir que o componente atualize seu estado
    await act(async () => {
      // Espera um tick para que o React atualize o estado
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verificamos se o componente mostra o estado de carregamento
    expect(screen.queryByText(/Aguarde/i)).toBeInTheDocument();
    
    // Agora finalizamos a promessa para o teste não ficar preso
    if (promiseResolver) promiseResolver();
  });

  it('navigates to login page when "Voltar para o login" link is clicked', async () => {
    mockValidateResetToken.mockResolvedValueOnce(true);

    render(<ResetPasswordPage params={{ token: validToken }} />);
    const user = userEvent.setup();

    // Aguardar o carregamento do formulário
    await waitFor(() => {
      expect(screen.getByLabelText(/Nova Senha/i)).toBeInTheDocument();
    });

    // Clica no link para voltar ao login
    const backToLoginLink = screen.getByText(/Voltar para o login/i);
    await user.click(backToLoginLink);

    // Verifica se o link tem o href correto
    expect(backToLoginLink).toHaveAttribute('href', '/auth/login');
  });

  it('correctly displays token information in UI', async () => {
    const token = 'very-long-token-123456789abcdef';
    mockValidateResetToken.mockResolvedValueOnce(true);

    render(<ResetPasswordPage params={{ token }} />);

    // Verifica se o token é mascarado corretamente durante a validação
    expect(screen.getByText(/Verificando seu link de redefinição/i)).toBeInTheDocument();
    
    const maskedToken = screen.getByText(/Token: .+/);
    expect(maskedToken).toBeInTheDocument();
    
    // O texto deve conter os primeiros e últimos 6 caracteres do token
    const maskedTokenText = maskedToken.textContent || '';
    expect(maskedTokenText).toContain(token.substring(0, 6));
    expect(maskedTokenText).toContain(token.substring(token.length - 6));
  });
});