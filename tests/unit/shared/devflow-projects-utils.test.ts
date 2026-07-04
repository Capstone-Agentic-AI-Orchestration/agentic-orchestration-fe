import {
  compactDevFlowError,
  projectInitials,
  formatDevFlowDate,
  devflowLifecycleView,
} from '@/shared/utils/devflow-projects';

describe('compactDevFlowError', () => {
  it('returns empty string for null', () => {
    expect(compactDevFlowError(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(compactDevFlowError(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(compactDevFlowError('')).toBe('');
  });

  it('returns the message from an Error instance', () => {
    const err = new Error('something went wrong');
    expect(compactDevFlowError(err)).toBe('something went wrong');
  });

  it('returns the string value when given a plain string', () => {
    expect(compactDevFlowError('plain error message')).toBe('plain error message');
  });

  it('extracts message from a JSON string with a message field', () => {
    expect(compactDevFlowError('{"message":"parsed message"}')).toBe('parsed message');
  });

  it('joins array messages from a JSON string', () => {
    expect(compactDevFlowError('{"message":["first","second"]}')).toBe('first second');
  });

  it('extracts error field from a JSON string when message is absent', () => {
    expect(compactDevFlowError('{"error":"error field value"}')).toBe('error field value');
  });

  it('returns the string unchanged when JSON parse fails', () => {
    const malformed = 'not json at all';
    expect(compactDevFlowError(malformed)).toBe(malformed);
  });

  it('converts non-string, non-Error values with String()', () => {
    expect(compactDevFlowError(42)).toBe('42');
  });

  it('extracts message from a plain object with a message string', () => {
    expect(compactDevFlowError({ message: 'object message' })).toBe('object message');
  });
});

describe('projectInitials', () => {
  it('returns first letter uppercased for a single word', () => {
    expect(projectInitials('Alphaexplora')).toBe('A');
  });

  it('returns first letter of each of the first two words', () => {
    expect(projectInitials('Bayan Cargo')).toBe('BC');
  });

  it('handles hyphen-separated words', () => {
    expect(projectInitials('Next-Level')).toBe('NL');
  });

  it('handles dot-separated words', () => {
    expect(projectInitials('alpha.beta')).toBe('AB');
  });

  it('falls back to "PR" for empty string', () => {
    expect(projectInitials('')).toBe('PR');
  });

  it('falls back to "PR" for null', () => {
    expect(projectInitials(null)).toBe('PR');
  });

  it('falls back to "PR" for undefined', () => {
    expect(projectInitials(undefined)).toBe('PR');
  });

  it('only uses the first two parts of a multi-word name', () => {
    expect(projectInitials('Alpha Beta Gamma Delta')).toBe('AB');
  });

  it('uppercases each initial', () => {
    expect(projectInitials('halo health')).toBe('HH');
  });
});

describe('formatDevFlowDate', () => {
  it('returns "Not available" for null', () => {
    expect(formatDevFlowDate(null)).toBe('Not available');
  });

  it('returns "Not available" for undefined', () => {
    expect(formatDevFlowDate(undefined)).toBe('Not available');
  });

  it('returns "Not available" for empty string', () => {
    expect(formatDevFlowDate('')).toBe('Not available');
  });

  it('returns "Not available" for an invalid date string', () => {
    expect(formatDevFlowDate('not-a-date')).toBe('Not available');
  });

  it('formats a valid ISO date string to a human-readable form', () => {
    const result = formatDevFlowDate('2024-06-01T00:00:00.000Z');
    // Intl.DateTimeFormat produces e.g. "Jun 1, 2024"
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2024/);
  });

  it('includes the day in the formatted date', () => {
    const result = formatDevFlowDate('2024-06-15T00:00:00.000Z');
    expect(result).toMatch(/15/);
  });
});

describe('devflowLifecycleView', () => {
  it('returns a view with zero progress and unknown stage for null project', () => {
    const view = devflowLifecycleView(null);
    expect(view).toBeDefined();
    expect(view.progress).toBe(0);
  });

  it('includes nextAction and signals for null project', () => {
    const view = devflowLifecycleView(null);
    expect(view.nextAction).toBe('Open project');
    expect(view.signals).toBeDefined();
    expect(view.signals.totalTasks).toBe(0);
  });

  it('returns status-based view for a minimal project without lifecycle', () => {
    const project = { status: 'PENDING' as const };
    const view = devflowLifecycleView(project);
    expect(view.label).toBe('Pending');
    expect(view.progress).toBe(8);
  });

  it('prefers lifecycle data over status when lifecycle is present', () => {
    const project = {
      status: 'PENDING' as const,
      lifecycle: {
        stage: 'IN_ORCHESTRATION' as const,
        label: 'In Orchestration',
        tone: 'purple' as const,
        progress: 68,
        nextAction: 'Review outputs',
        signals: {
          clientAccepted: true,
          kickoffReady: true,
          orchestrationStarted: true,
          clientReviewOpen: false,
          revisionOpen: false,
          deliveryAccepted: false,
          deliveryRevisionOpen: false,
          totalTasks: 10,
          openTasks: 3,
          totalWorkOrders: 5,
          activeWorkOrders: 2,
          clientVisibleArtifacts: 4,
        },
      },
    };
    const view = devflowLifecycleView(project);
    expect(view.label).toBe('In Orchestration');
    expect(view.progress).toBe(68);
    expect(view.nextAction).toBe('Review outputs');
  });

  it('returns fallback signals when no lifecycle is attached', () => {
    const project = { status: 'DELIVERED' as const };
    const view = devflowLifecycleView(project);
    expect(view.signals.clientVisibleArtifacts).toBe(0);
    expect(view.signals.activeWorkOrders).toBe(0);
  });
});
