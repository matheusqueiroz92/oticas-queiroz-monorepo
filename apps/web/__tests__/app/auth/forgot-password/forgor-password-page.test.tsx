import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ForgotPasswordPage from '@/app/auth/forgot-password/page';
import { requestPasswordReset } from '@/app/services/authService';

// Mock do serviço de autenticação
jest.mock('@/app/services/authService', () => ({
  requestPasswordReset: jest.fn(),
}));

const mockRequestPasswordReset = requestPasswordReset as jest.MockedFunction<typeof requestPasswordReset>;

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders forgot password form correctly', () => {
    render(<ForgotPasswordPage />);

    // Verifica se o título está correto
    expect(screen.getByText('Recuperar Senha')).toBeInTheDocument();
    
    // Verifica se a descrição está correta
    expect(screen.getByText('Digite seu email para receber um link de recuperação')).toBeInTheDocument();
    
    // Verifica se o campo de email existe
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    
    // Verifica se o botão existe
    expect(screen.getByRole('button', { name: /Enviar link de recuperação/i })).toBeInTheDocument();
    
    // Verifica se o link de voltar para o login existe
    expect(screen.getByText('Voltar para o login')).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    render(<ForgotPasswordPage />);
    const user = userEvent.setup();
    
    // Digita um email inválido
    await user.type(screen.getByLabelText('Email'), 'email-invalido');
    
    // Clica no botão
    await user.click(screen.getByRole('button', { name: /Enviar link de recuperação/i }));
    
    // Verifica se a mensagem de erro aparece
    await waitFor(() => {
      expect(screen.getByText('Digite um email válido')).toBeInTheDocument();
    });
    
    // Verifica que o serviço não foi chamado
    expect(mockRequestPasswordReset).not.toHaveBeenCalled();
  });

  it('handles successful password reset request', async () => {
    // Mock do serviço para retornar sucesso
    mockRequestPasswordReset.mockResolvedValueOnce();
    
    render(<ForgotPasswordPage />);
    const user = userEvent.setup();
    
    // Digita um email válido
    const validEmail = 'test@example.com';
    await user.type(screen.getByLabelText('Email'), validEmail);
    
    // Clica no botão
    await user.click(screen.getByRole('button', { name: /Enviar link de recuperação/i }));
    
    // Verifica se o serviço foi chamado com o email correto
    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith(validEmail);
    });
    
    // Verifica se a mensagem de sucesso aparece
    await waitFor(() => {
      expect(screen.getByText('Enviamos um email com instruções para redefinir sua senha. Verifique sua caixa de entrada.')).toBeInTheDocument();
    });
  });

  it('handles error during password reset request', async () => {
    // Mock do serviço para retornar erro
    const errorMessage = 'Email não encontrado em nosso sistema';
    mockRequestPasswordReset.mockRejectedValueOnce(new Error(errorMessage));
    
    render(<ForgotPasswordPage />);
    const user = userEvent.setup();
    
    // Digita um email
    await user.type(screen.getByLabelText('Email'), 'unknown@example.com');
    
    // Clica no botão
    await user.click(screen.getByRole('button', { name: /Enviar link de recuperação/i }));
    
    // Verifica se a mensagem de erro aparece
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    // Mock com delay para testar loading state
    mockRequestPasswordReset.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 100);
    }));
    
    render(<ForgotPasswordPage />);
    const user = userEvent.setup();
    
    // Digita um email válido
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    
    // Clica no botão
    await user.click(screen.getByRole('button', { name: /Enviar link de recuperação/i }));
    
    // Verifica se o texto "Aguarde" aparece
    expect(screen.getByText('Aguarde')).toBeInTheDocument();
    
    // Verifica se o spinner aparece (assumindo que existe um data-testid="loading-spinner")
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
    // Aguarda a conclusão
    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalled();
    });
  });

  it('resets form after successful submission', async () => {
    // Mock do serviço para retornar sucesso
    mockRequestPasswordReset.mockResolvedValueOnce();
    
    render(<ForgotPasswordPage />);
    const user = userEvent.setup();
    
    // Digita um email válido
    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, 'test@example.com');
    
    // Clica no botão
    await user.click(screen.getByRole('button', { name: /Enviar link de recuperação/i }));
    
    // Verifica se o campo foi limpo após o sucesso
    await waitFor(() => {
      // Verifica se a mensagem de sucesso aparece
      expect(screen.getByText('Enviamos um email com instruções para redefinir sua senha. Verifique sua caixa de entrada.')).toBeInTheDocument();
      
      // Verifica se o campo de email foi resetado
      expect(emailInput).toHaveValue('');
    });
  });

  it('navigates back to login page when back link is clicked', async () => {
    render(<ForgotPasswordPage />);
    const user = userEvent.setup();
    
    // Verifica se o link existe e clica nele
    const backToLoginLink = screen.getByText('Voltar para o login');
    await user.click(backToLoginLink);
    
    // Como o Next.js Link é mockado, verificamos se href existe
    expect(backToLoginLink.closest('a')).toHaveAttribute('href', '/auth/login');
  });
});