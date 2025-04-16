// apps/web/jest.setup.js
import '@testing-library/jest-dom';
import 'whatwg-fetch';
import { TextDecoder, TextEncoder } from 'util';

// Polyfills necessários para o Node.js
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock para o next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({ src, alt, className, sizes, ...props }) {
    // Converte propriedades booleanas em strings para evitar warnings
    const booleanProps = ['fill', 'priority', 'loading', 'unoptimized'];
    const convertedProps = { ...props };
    
    booleanProps.forEach(prop => {
      if (prop in convertedProps && typeof convertedProps[prop] === 'boolean') {
        convertedProps[prop] = convertedProps[prop].toString();
      }
    });
    
    return (
      <img
        src={typeof src === 'object' ? '/mock-image-path.jpg' : src}
        alt={alt}
        className={className}
        data-testid="mock-image"
        {...convertedProps}
      />
    );
  },
}));

// Mock para o next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    toString: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
}));

// Mock para o js-cookie
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

// Mock para o Hook use do next/react (usado em RSC)
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    cache: (fn) => fn,
    use: (promise) => {
      if (promise && typeof promise.then === 'function') {
        throw new Error('Cannot use Promises in tests. Mock them instead.');
      }
      return promise;
    },
  };
});

// Mock para o componente Card e outros componentes UI
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }) => <div className={className}>{children}</div>,
  CardFooter: ({ children, className }) => <div className={className}>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, className, onClick, type, disabled, asChild }) => {
    if (asChild && children) {
      // Se asChild for true, clonamos o children e passamos as props
      const child = React.Children.only(children);
      return React.cloneElement(child, { className, disabled, onClick });
    }
    return (
      <button 
        type={type || 'button'} 
        className={className} 
        onClick={onClick} 
        disabled={disabled}
      >
        {children}
      </button>
    );
  }
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, className, variant }) => (
    <div className={`${className} ${variant}`}>{children}</div>
  ),
  AlertDescription: ({ children }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ id, type, placeholder, className, ...props }) => (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  ),
}));

// Mock para os ícones do Lucide React
jest.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loading-spinner">Loading...</span>,
  ArrowLeft: () => <span>←</span>,
  CheckCircle2: () => <span>✓</span>,
  XCircle: () => <span>✗</span>,
}));

// Mock para o ResizeObserver (necessário para alguns componentes UI)
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock para IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock para o matchMedia (necessário para componentes responsivos)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Silenciar logs durante os testes
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

console.error = (...args) => {
  if (
    /Warning.*not wrapped in act/i.test(args[0]) ||
    /Warning.*React.createFactory/i.test(args[0]) ||
    /Warning.*ReactDOM.render/i.test(args[0]) ||
    /Warning.*can't perform a React state update/i.test(args[0])
  ) {
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args) => {
  if (
    /Warning.*not wrapped in act/i.test(args[0]) ||
    /Warning.*React.createFactory/i.test(args[0])
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

// Aumentar o timeout dos testes
jest.setTimeout(10000);