import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
}));

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => () => <div data-testid="hero-scene" />,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

jest.mock('lenis/react', () => ({
  ReactLenis: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useLenis: () => null,
}));

jest.mock('@gsap/react', () => ({
  useGSAP: () => undefined,
}));

jest.mock('@/lib/gsap', () => ({
  gsap: {
    matchMedia: () => ({ add: jest.fn(), revert: jest.fn() }),
    set: jest.fn(),
    timeline: jest.fn(),
    ticker: {
      add: jest.fn(),
      remove: jest.fn(),
    },
  },
  ScrollTrigger: {
    getById: jest.fn(),
    refresh: jest.fn(),
    update: jest.fn(),
  },
  registerGsapPlugins: jest.fn(),
}));

jest.mock('@/features/marketing/home/components/VisualPrimitives', () => ({
  AgentNetworkGraph: () => <div data-testid="agent-network" />,
  ParticleFieldCanvas: () => <canvas data-testid="particle-field" />,
}));

import { MarketingHomeView } from '@/features/marketing/home/views/marketing-home-view';

describe('MarketingHomeView v2', () => {
  it('renders without crashing', () => {
    expect(() => render(<MarketingHomeView />)).not.toThrow();
  });

  it('shows the hero headline', () => {
    render(<MarketingHomeView />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/One prompt,\s*build everything/i);
  });

  it('shows the anatomy section headline', () => {
    render(<MarketingHomeView />);
    expect(screen.getByText(/One brief/i)).toBeInTheDocument();
  });

  it('shows the how it works section', () => {
    render(<MarketingHomeView />);
    expect(screen.getByRole('heading', { level: 2, name: 'How it works' })).toBeInTheDocument();
  });

  it('shows the FAQ section title', () => {
    render(<MarketingHomeView />);
    expect(screen.getByRole('heading', { level: 2, name: 'FAQ' })).toBeInTheDocument();
  });

  it('routes every entry point through the active sign-in page', () => {
    render(<MarketingHomeView />);

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in');
    expect(screen.getByRole('link', { name: 'Start →' })).toHaveAttribute('href', '/sign-in');
    expect(screen.getByRole('link', { name: /Open your workspace/i })).toHaveAttribute('href', '/sign-in');
    expect(screen.getByRole('link', { name: /Continue to sign in/i })).toHaveAttribute('href', '/sign-in');
    expect(screen.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/sign-in');

    fireEvent.click(screen.getByRole('button', { name: /Start building/i }));
    expect(mockPush).toHaveBeenCalledWith('/sign-in');
  });
});
