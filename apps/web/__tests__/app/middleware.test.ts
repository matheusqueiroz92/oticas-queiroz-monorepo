import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';

// Mock do NextRequest
const createMockRequest = (pathname: string, cookies: { [key: string]: string } = {}) => {
  const request = {
    nextUrl: {
      pathname,
      href: `http://localhost:3000${pathname}`,
      search: '',
      clone: jest.fn().mockImplementation(function(this: typeof request) { return this; }),
    },
    cookies: {
      get: jest.fn((name: string) => cookies[name] ? { value: cookies[name] } : undefined),
      getAll: jest.fn(() => Object.entries(cookies).map(([name, value]) => ({ name, value }))),
    },
    url: `http://localhost:3000${pathname}`,
  } as unknown as NextRequest;
  
  return request;
};

// Mock do NextResponse
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      redirect: jest.fn().mockImplementation((url) => ({ 
        type: 'redirect',
        url
      })),
      next: jest.fn().mockReturnValue({ 
        type: 'next' 
      }),
    },
  };
});

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Root route handling', () => {
    it('should redirect to dashboard if user is authenticated', () => {
      const request = createMockRequest('/', { 'token': 'valid-token' });
      
      const response = middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/dashboard'
        })
      );
      expect(response).toEqual(expect.objectContaining({
        type: 'redirect',
        url: expect.objectContaining({
          pathname: '/dashboard'
        })
      }));
    });

    it('should redirect to login if user is not authenticated', () => {
      const request = createMockRequest('/', {});
      
      const response = middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/auth/login'
        })
      );
      expect(response).toEqual(expect.objectContaining({
        type: 'redirect',
        url: expect.objectContaining({
          pathname: '/auth/login'
        })
      }));
    });
  });

  describe('Protected routes handling', () => {
    it('should redirect to login when accessing protected route without token', () => {
      const request = createMockRequest('/dashboard', {});
      
      const response = middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/auth/login'
        })
      );
      expect(response).toEqual(expect.objectContaining({
        type: 'redirect',
        url: expect.objectContaining({
          pathname: '/auth/login'
        })
      }));
    });

    it('should allow access to protected route with valid token', () => {
      const request = createMockRequest('/dashboard', { 'token': 'valid-token' });
      
      const response = middleware(request);
      
      expect(NextResponse.next).toHaveBeenCalled();
      expect(response).toEqual(expect.objectContaining({
        type: 'next'
      }));
    });

    it('should allow access to protected route with nested path with valid token', () => {
      const request = createMockRequest('/customers/123', { 'token': 'valid-token' });
      
      const response = middleware(request);
      
      expect(NextResponse.next).toHaveBeenCalled();
      expect(response).toEqual(expect.objectContaining({
        type: 'next'
      }));
    });
  });

  describe('Public routes handling', () => {
    it('should allow access to login page without token', () => {
      const request = createMockRequest('/auth/login', {});
      
      const response = middleware(request);
      
      expect(NextResponse.next).toHaveBeenCalled();
      expect(response).toEqual(expect.objectContaining({
        type: 'next'
      }));
    });

    it('should allow access to register page without token', () => {
      const request = createMockRequest('/auth/register', {});
      
      const response = middleware(request);
      
      expect(NextResponse.next).toHaveBeenCalled();
      expect(response).toEqual(expect.objectContaining({
        type: 'next'
      }));
    });

    it('should allow access to forgot password page without token', () => {
      const request = createMockRequest('/auth/forgot-password', {});
      
      const response = middleware(request);
      
      expect(NextResponse.next).toHaveBeenCalled();
      expect(response).toEqual(expect.objectContaining({
        type: 'next'
      }));
    });

    it('should redirect authenticated users from login page to dashboard', () => {
      const request = createMockRequest('/auth/login', { 'token': 'valid-token' });
      
      const response = middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/dashboard'
        })
      );
      expect(response).toEqual(expect.objectContaining({
        type: 'redirect',
        url: expect.objectContaining({
          pathname: '/dashboard'
        })
      }));
    });

    it('should always allow access to reset password routes', () => {
      const request = createMockRequest('/auth/reset-password/some-token-123', {});
      
      const response = middleware(request);
      
      expect(NextResponse.next).toHaveBeenCalled();
      expect(response).toEqual(expect.objectContaining({
        type: 'next'
      }));
    });

    it('should allow access to public content even for authenticated users', () => {
      const request = createMockRequest('/public/some-content', { 'token': 'valid-token' });
      
      const response = middleware(request);
      
      expect(NextResponse.next).toHaveBeenCalled();
      expect(response).toEqual(expect.objectContaining({
        type: 'next'
      }));
    });
  });
});