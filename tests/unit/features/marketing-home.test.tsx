import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/shared/api/devflow-api', () => ({
  createDevFlowInquiry: jest.fn().mockResolvedValue({ id: 'mock-id' }),
}));

jest.mock('@/features/marketing/home/components/HeroScene', () => ({
  HeroScene: () => <div data-testid="mock-hero-scene" />,
}));

import { MarketingHomeView } from '@/features/marketing/home/views/marketing-home-view';

describe('MarketingHomeView v2', () => {
  it('renders without crashing', () => {
    expect(() => render(<MarketingHomeView />)).not.toThrow();
  });

  it('shows the hero headline', () => {
    render(<MarketingHomeView />);
    const elements = screen.getAllByText(/One prompt/i);
    expect(elements.length).toBeGreaterThan(0);
    expect(elements[0]).toBeInTheDocument();
  });

  it('shows the anatomy section headline', () => {
    render(<MarketingHomeView />);
    const elements = screen.getAllByText(/One brief/i);
    expect(elements.length).toBeGreaterThan(0);
    expect(elements[0]).toBeInTheDocument();
  });

  it('shows the how it works section', () => {
    render(<MarketingHomeView />);
    const elements = screen.getAllByText(/How it works/i);
    expect(elements.length).toBeGreaterThan(0);
    expect(elements[0]).toBeInTheDocument();
  });

  it('shows the CTA section description', () => {
    render(<MarketingHomeView />);
    const elements = screen.getAllByText(/No credit card/i);
    expect(elements.length).toBeGreaterThan(0);
    expect(elements[0]).toBeInTheDocument();
  });
});
