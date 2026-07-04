import { homePathForRole } from '@/shared/auth/role-routing';

describe('homePathForRole', () => {
  it('maps CLIENT to /client/dashboard', () => {
    expect(homePathForRole('CLIENT')).toBe('/client/dashboard');
  });

  it('maps PM to /pm/projects', () => {
    expect(homePathForRole('PM')).toBe('/pm/projects');
  });

  it('maps DEV to /dev/dashboard', () => {
    expect(homePathForRole('DEV')).toBe('/dev/dashboard');
  });

  it('maps ADMIN to /admin/overview', () => {
    expect(homePathForRole('ADMIN')).toBe('/admin/overview');
  });

  it('returns a defined, non-empty string for every role', () => {
    const roles = ['CLIENT', 'PM', 'DEV', 'ADMIN'] as const;
    for (const role of roles) {
      const path = homePathForRole(role);
      expect(path).toBeDefined();
      expect(typeof path).toBe('string');
      expect(path.length).toBeGreaterThan(0);
    }
  });
});
