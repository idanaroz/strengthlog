// 🧪 Test Setup - Global test configuration

import { vi } from 'vitest';
import 'fake-indexeddb/auto';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock IndexedDB (fake-indexeddb provides this)
// Already imported above

// Mock Chart.js
vi.mock('chart.js', () => ({
  Chart: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
    data: { labels: [], datasets: [] }
  })),
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  PointElement: vi.fn(),
  LineElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
  Filler: vi.fn()
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, format) => '2024-01-01'),
  parseISO: vi.fn((date) => new Date(date)),
  subDays: vi.fn((date, days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)),
  subMonths: vi.fn((date, months) => new Date()),
  subYears: vi.fn((date, years) => new Date())
}));

// Global test utilities
global.createMockExercise = (overrides = {}) => ({
  id: 'test-exercise-1',
  name: 'Test Exercise',
  notes: '',
  category: 'compound',
  muscleGroups: ['chest'],
  equipmentType: 'bodyweight',
  dateCreated: '2024-01-01T00:00:00.000Z',
  isArchived: false,
  totalWorkouts: 0,
  personalBests: {
    maxWeight: { value: 0, date: '', reps: 0 },
    maxReps: { value: 0, date: '', weight: 0 },
    maxVolume: { value: 0, date: '' },
    estimatedOneRepMax: { value: 0, date: '' }
  },
  ...overrides
});

global.createMockWorkout = (overrides = {}) => ({
  id: 'test-workout-1',
  date: '2024-01-01',
  startTime: '10:00',
  endTime: '11:00',
  exercises: [],
  notes: '',
  mood: 3,
  duration: 60,
  totalVolume: 0,
  dateCreated: '2024-01-01T00:00:00.000Z',
  ...overrides
});

global.createMockWorkoutSet = (overrides = {}) => ({
  id: 'test-set-1',
  weight: 50,
  reps: 10,
  isWarmup: false,
  isFailure: false,
  ...overrides
});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});