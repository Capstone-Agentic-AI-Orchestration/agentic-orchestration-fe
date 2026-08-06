import { homePathForRole } from '@/shared/auth/role-routing';

describe('homePathForRole', () => {
  // This console became staff-only: there are no /client routes in it at all, and the backend
  // refuses a CLIENT sign-in outright with 403 NOT_A_TEAM_MEMBER. The mapping is kept as a
  // defensive dead-end rather than removed, because routing a CLIENT to /sign-in would loop —
  // sign-in re-routes an authenticated user by role. Client accounts live in the separate
  // Alphaexplora client app.
  it('maps CLIENT to the terminal /no-access screen', () => {
    expect(homePathForRole('CLIENT')).toBe('/no-access');
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
