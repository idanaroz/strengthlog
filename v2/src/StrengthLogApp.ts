// 🏋️ Main Application Class - StrengthLog V2.0

import { DataManager } from '@core/DataManager.js';
import { AnalyticsEngine } from '@core/AnalyticsEngine.js';
import { MigrationManager } from '@core/MigrationManager.js';
import { BetaManager } from '@core/BetaManager.js';
import { ProgressionChart } from '@components/ProgressionChart.js';
import { WorkoutForm } from '@components/WorkoutForm.js';
import { FeedbackModal } from '@components/FeedbackModal.js';
import type {
  Exercise,
  WorkoutSession,
  UserSettings,
  AppState,
  ExerciseCategory,
  MuscleGroup,
  EquipmentType
} from '@types/index.js';

export class StrengthLogApp {
  private dataManager: DataManager;
  private migrationManager: MigrationManager;
  private betaManager: BetaManager;
  private analyticsEngine: AnalyticsEngine | null = null;
  private exercises: Exercise[] = [];
  private workouts: WorkoutSession[] = [];
  private settings: UserSettings;
  private appState: AppState;

  // UI Components
  private workoutForm: WorkoutForm | null = null;
  private progressionChart: ProgressionChart | null = null;
  private feedbackModal: FeedbackModal | null = null;

  constructor() {
    this.dataManager = new DataManager();
    this.migrationManager = new MigrationManager(this.dataManager);
    this.betaManager = new BetaManager();
    this.settings = this.getDefaultSettings();
    this.appState = this.getDefaultAppState();
  }

  // 🚀 Initialize the application
  async initialize(): Promise<void> {
    try {
      console.log('🏋️ Initializing StrengthLog V2.0...');

            // Initialize data layer
      await this.dataManager.initialize();

      // Perform V1 to V2 migration if needed
      await this.performMigrationIfNeeded();

      // Load data
      await this.loadData();

      // Initialize analytics engine
      this.analyticsEngine = new AnalyticsEngine(this.exercises, this.workouts);

      // Set up UI
      this.setupUI();
      this.setupEventListeners();

      // Initialize beta features
      await this.initializeBetaFeatures();

      // Apply theme
      this.applyTheme();

      console.log('✅ StrengthLog V2.0 initialized successfully');

      // Show welcome message for new users
      if (this.exercises.length === 0) {
        this.showWelcomeMessage();
      }

    } catch (error) {
      console.error('❌ Failed to initialize StrengthLog:', error);
      this.showError('Failed to initialize the app. Please refresh and try again.');
    }
  }

  // 📊 Load all data from storage
  private async loadData(): Promise<void> {
    try {
      [this.exercises, this.workouts, this.settings] = await Promise.all([
        this.dataManager.getAllExercises(),
        this.dataManager.getAllWorkouts(),
        this.dataManager.getSettings()
      ]);

      // Ensure default exercises exist
      await this.ensureDefaultExercises();

      console.log(`📊 Loaded ${this.exercises.length} exercises and ${this.workouts.length} workouts`);

    } catch (error) {
      console.error('❌ Failed to load data:', error);
      throw new Error('Data loading failed');
    }
  }

  // 🏋️ Ensure default exercises exist for new users
  private async ensureDefaultExercises(): Promise<void> {
    if (this.exercises.length > 0) return;

    const defaultExercises = [
      {
        name: 'Push-ups',
        category: ExerciseCategory.PUSH,
        muscleGroups: [MuscleGroup.CHEST, MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
        equipmentType: EquipmentType.BODYWEIGHT,
        notes: 'Classic bodyweight chest exercise'
      },
      {
        name: 'Pull-ups',
        category: ExerciseCategory.PULL,
        muscleGroups: [MuscleGroup.BACK, MuscleGroup.BICEPS],
        equipmentType: EquipmentType.BODYWEIGHT,
        notes: 'Upper body pulling exercise'
      },
      {
        name: 'Squats',
        category: ExerciseCategory.LEGS,
        muscleGroups: [MuscleGroup.QUADRICEPS, MuscleGroup.GLUTES],
        equipmentType: EquipmentType.BODYWEIGHT,
        notes: 'Fundamental leg exercise'
      },
      {
        name: 'Plank',
        category: ExerciseCategory.CORE,
        muscleGroups: [MuscleGroup.CORE],
        equipmentType: EquipmentType.BODYWEIGHT,
        notes: 'Isometric core strengthening'
      }
    ];

    for (const exerciseTemplate of defaultExercises) {
      const exercise: Exercise = {
        id: this.generateId(),
        ...exerciseTemplate,
        dateCreated: new Date().toISOString(),
        isArchived: false,
        totalWorkouts: 0,
        personalBests: {
          maxWeight: { value: 0, date: '', reps: 0 },
          maxReps: { value: 0, date: '', weight: 0 },
          maxVolume: { value: 0, date: '' },
          estimatedOneRepMax: { value: 0, date: '' }
        }
      };

      await this.dataManager.saveExercise(exercise);
      this.exercises.push(exercise);
    }

    console.log('✅ Default exercises created');
  }

  // 🎨 Set up the user interface
  private setupUI(): void {
    // Create main app structure
    document.body.innerHTML = `
      <div class="app-container">
        <!-- Header -->
        <header class="app-header">
          <div class="header-content">
            <h1 class="app-title">
              <span class="title-icon">🏋️</span>
              StrengthLog
              <span class="version">v2.0</span>
            </h1>
            <div class="header-actions">
              <button class="header-btn" id="feedback-btn" title="Send Feedback">
                <span class="feedback-icon">💭</span>
                <span class="feedback-text">Beta Feedback</span>
              </button>
              <button class="header-btn" id="sync-status">
                <span class="sync-icon">🔄</span>
                <span class="sync-text">Synced</span>
              </button>
              <button class="header-btn" id="settings-btn">⚙️</button>
            </div>
          </div>
        </header>

        <!-- Navigation -->
        <nav class="app-nav">
          <button class="nav-btn active" data-view="dashboard">
            <span class="nav-icon">📊</span>
            Dashboard
          </button>
          <button class="nav-btn" data-view="workout">
            <span class="nav-icon">🏋️</span>
            Workout
          </button>
          <button class="nav-btn" data-view="exercises">
            <span class="nav-icon">💪</span>
            Exercises
          </button>
          <button class="nav-btn" data-view="analytics">
            <span class="nav-icon">📈</span>
            Analytics
          </button>
          <button class="nav-btn" data-view="history">
            <span class="nav-icon">📋</span>
            History
          </button>
        </nav>

        <!-- Main Content -->
        <main class="app-main">
          <div class="view-container" id="view-container">
            ${this.renderDashboard()}
          </div>
        </main>

        <!-- Loading overlay -->
        <div class="loading-overlay hidden" id="loading-overlay">
          <div class="loading-spinner"></div>
          <p>Loading...</p>
        </div>

        <!-- Toast notifications -->
        <div class="toast-container" id="toast-container"></div>
      </div>
    `;

    // Initialize components
    this.initializeComponents();

    // Load feedback modal styles
    this.loadFeedbackStyles();
  }

  // 🔧 Initialize UI components
  private initializeComponents(): void {
    // Initialize workout form
    const workoutContainer = document.createElement('div');
    this.workoutForm = new WorkoutForm(
      workoutContainer,
      this.exercises,
      this.handleWorkoutSave.bind(this)
    );

    // Initialize progression chart
    const chartCanvas = document.createElement('canvas');
    chartCanvas.width = 800;
    chartCanvas.height = 400;
    this.progressionChart = new ProgressionChart(chartCanvas);

    // Initialize feedback modal
    this.feedbackModal = new FeedbackModal(this.betaManager);
  }

  // 📊 Render dashboard view
  private renderDashboard(): string {
    const recentWorkouts = this.workouts
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const totalWorkouts = this.workouts.length;
    const totalVolume = this.workouts.reduce((sum, w) => sum + w.totalVolume, 0);
    const avgWorkoutsPerWeek = this.calculateWeeklyAverage();

    return `
      <div class="dashboard-view">
        <div class="dashboard-header">
          <h2>Dashboard</h2>
          <button class="quick-workout-btn" id="quick-workout">
            <span class="icon">⚡</span>
            Quick Workout
          </button>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🏋️</div>
            <div class="stat-content">
              <div class="stat-value">${totalWorkouts}</div>
              <div class="stat-label">Total Workouts</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-value">${Math.round(totalVolume)}kg</div>
              <div class="stat-label">Total Volume</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <div class="stat-value">${avgWorkoutsPerWeek.toFixed(1)}</div>
              <div class="stat-label">Per Week</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">💪</div>
            <div class="stat-content">
              <div class="stat-value">${this.exercises.length}</div>
              <div class="stat-label">Exercises</div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="dashboard-section">
          <h3>Recent Workouts</h3>
          <div class="recent-workouts">
            ${recentWorkouts.length > 0 ?
              recentWorkouts.map(workout => this.renderWorkoutCard(workout)).join('') :
              '<div class="empty-state">No workouts yet. <a href="#" data-view="workout">Start your first workout!</a></div>'
            }
          </div>
        </div>

        <!-- Progress Preview -->
        <div class="dashboard-section">
          <h3>Progress Highlights</h3>
          <div class="progress-preview">
            ${this.renderProgressHighlights()}
          </div>
        </div>
      </div>
    `;
  }

  // 🏋️ Render workout card
  private renderWorkoutCard(workout: WorkoutSession): string {
    const exerciseNames = workout.exercises
      .map(ex => {
        const exercise = this.exercises.find(e => e.id === ex.exerciseId);
        return exercise?.name || 'Unknown';
      })
      .join(', ');

    return `
      <div class="workout-card">
        <div class="workout-date">${this.formatDate(workout.date)}</div>
        <div class="workout-exercises">${exerciseNames}</div>
        <div class="workout-stats">
          <span class="workout-duration">${workout.duration}min</span>
          <span class="workout-volume">${Math.round(workout.totalVolume)}kg</span>
        </div>
      </div>
    `;
  }

  // 📈 Render progress highlights
  private renderProgressHighlights(): string {
    if (!this.analyticsEngine || this.workouts.length === 0) {
      return '<div class="empty-state">Complete a few workouts to see progress insights!</div>';
    }

    // Get insights for most active exercises
    const activeExercises = this.exercises
      .filter(ex => ex.totalWorkouts > 0)
      .sort((a, b) => b.totalWorkouts - a.totalWorkouts)
      .slice(0, 3);

    return activeExercises.map(exercise => {
      const insights = this.analyticsEngine!.generateExerciseInsights(exercise.id);
      if (!insights) return '';

      return `
        <div class="progress-card">
          <h4>${exercise.name}</h4>
          <div class="progress-stats">
            <div class="progress-stat">
              <span class="stat-label">Workouts</span>
              <span class="stat-value">${insights.totalWorkouts}</span>
            </div>
            <div class="progress-stat">
              <span class="stat-label">Improvements</span>
              <span class="stat-value">${insights.improvements}</span>
            </div>
            <div class="progress-stat">
              <span class="stat-label">Consistency</span>
              <span class="stat-value">${Math.round(insights.consistencyScore)}%</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 🎧 Set up event listeners
  private setupEventListeners(): void {
    // Navigation
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Handle navigation
      if (target.classList.contains('nav-btn')) {
        const view = target.dataset.view;
        if (view) this.switchView(view);
      }

      // Handle quick actions
      if (target.id === 'quick-workout') {
        this.switchView('workout');
      }

      if (target.id === 'settings-btn') {
        this.showSettings();
      }

      if (target.id === 'feedback-btn') {
        this.showFeedbackModal();
      }
    });

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            this.switchView('dashboard');
            break;
          case '2':
            e.preventDefault();
            this.switchView('workout');
            break;
          case '3':
            e.preventDefault();
            this.switchView('exercises');
            break;
        }
      }
    });
  }

  // 🔄 Switch between views
  private switchView(viewName: string): void {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Update content
    const container = document.getElementById('view-container');
    if (!container) return;

    switch (viewName) {
      case 'dashboard':
        container.innerHTML = this.renderDashboard();
        break;
      case 'workout':
        container.innerHTML = '<div id="workout-form-container"></div>';
        const workoutContainer = container.querySelector('#workout-form-container') as HTMLElement;
        if (this.workoutForm && workoutContainer) {
          this.workoutForm = new WorkoutForm(workoutContainer, this.exercises, this.handleWorkoutSave.bind(this));
          this.workoutForm.render();
        }
        break;
      case 'exercises':
        container.innerHTML = this.renderExercisesView();
        break;
      case 'analytics':
        container.innerHTML = this.renderAnalyticsView();
        break;
      case 'history':
        container.innerHTML = this.renderHistoryView();
        break;
    }

    this.appState.selectedExerciseId = null; // Reset selection
  }

  // 💾 Handle workout save
  private async handleWorkoutSave(workout: WorkoutSession): Promise<void> {
    try {
      this.showLoading(true);

      await this.dataManager.saveWorkout(workout);
      this.workouts.push(workout);

      // Update analytics engine
      this.analyticsEngine = new AnalyticsEngine(this.exercises, this.workouts);

      this.showToast('Workout saved successfully! 💪', 'success');
      this.switchView('dashboard');

    } catch (error) {
      console.error('Failed to save workout:', error);
      this.showToast('Failed to save workout. Please try again.', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  // 💪 Render exercises view (placeholder)
  private renderExercisesView(): string {
    return `
      <div class="exercises-view">
        <div class="view-header">
          <h2>Exercises</h2>
          <button class="primary-btn" id="add-exercise">Add Exercise</button>
        </div>
        <div class="exercises-grid">
          ${this.exercises.map(exercise => `
            <div class="exercise-card">
              <h3>${exercise.name}</h3>
              <p class="exercise-category">${exercise.category}</p>
              <div class="exercise-stats">
                <span>${exercise.totalWorkouts} workouts</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 📈 Render analytics view (placeholder)
  private renderAnalyticsView(): string {
    return `
      <div class="analytics-view">
        <div class="view-header">
          <h2>Analytics</h2>
        </div>
        <div class="analytics-content">
          <div class="chart-container">
            <canvas id="progression-chart" width="800" height="400"></canvas>
          </div>
          <div class="analytics-sidebar">
            <h3>Exercise Selection</h3>
            <select id="exercise-select">
              ${this.exercises.map(ex => `
                <option value="${ex.id}">${ex.name}</option>
              `).join('')}
            </select>
          </div>
        </div>
      </div>
    `;
  }

  // 📋 Render history view (placeholder)
  private renderHistoryView(): string {
    const sortedWorkouts = this.workouts
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return `
      <div class="history-view">
        <div class="view-header">
          <h2>Workout History</h2>
        </div>
        <div class="history-list">
          ${sortedWorkouts.map(workout => this.renderWorkoutCard(workout)).join('')}
        </div>
      </div>
    `;
  }

  // Helper methods
  private calculateWeeklyAverage(): number {
    if (this.workouts.length === 0) return 0;

    const oldestWorkout = new Date(Math.min(...this.workouts.map(w => new Date(w.date).getTime())));
    const weeksSinceStart = Math.max(1, Math.ceil((Date.now() - oldestWorkout.getTime()) / (7 * 24 * 60 * 60 * 1000)));

    return this.workouts.length / weeksSinceStart;
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  private showLoading(show: boolean): void {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.toggle('hidden', !show);
    }
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 3000);
  }

  private showError(message: string): void {
    this.showToast(message, 'error');
  }

  private showWelcomeMessage(): void {
    this.showToast('Welcome to StrengthLog V2.0! Start by logging your first workout. 💪', 'success');
  }

  private showSettings(): void {
    // Settings modal implementation
    console.log('Settings modal would open here');
  }

  private applyTheme(): void {
    document.body.className = `theme-${this.settings.theme}`;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getDefaultSettings(): UserSettings {
    return {
      weightUnit: 'kg',
      dateFormat: 'iso',
      theme: 'auto',
      restTimerDefault: 90,
      autoSave: true,
      analyticsEnabled: true,
      chartDefaults: {
        timeframe: 'month',
        showTrendline: true,
        showMilestones: true,
        primaryMetric: 'volume'
      },
      notifications: {
        restTimer: true,
        workoutReminders: false,
        progressMilestones: true
      }
    };
  }

  private getDefaultAppState(): AppState {
    return {
      currentWorkout: null,
      activeExercise: null,
      isTimerRunning: false,
      timerStartTime: 0,
      selectedExerciseId: null,
      chartTimeframe: 'month',
      filterBy: {
        exercises: [],
        categories: [],
        showArchived: false
      },
      sortBy: {
        field: 'date',
        direction: 'desc'
      }
    };
  }

  // 🔄 Perform V1 to V2 migration if needed
  private async performMigrationIfNeeded(): Promise<void> {
    try {
      console.log('🔄 Checking for V1 data migration...');

      const migrationResult = await this.migrationManager.migrateFromV1();

      if (migrationResult.success && migrationResult.migratedExercises > 0) {
        this.showToast(
          `✅ Successfully migrated ${migrationResult.migratedExercises} exercises and ${migrationResult.migratedWorkouts} workouts from V1!`,
          'success'
        );
        console.log('📊 Migration statistics:', migrationResult);
      } else if (migrationResult.errors.length > 0) {
        console.error('❌ Migration errors:', migrationResult.errors);
        this.showToast('⚠️ Migration completed with some issues. Check console for details.', 'error');
      }

    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.showToast('❌ Failed to migrate V1 data. Please check console for details.', 'error');
    }
  }

  // 🧪 Initialize beta features
  private async initializeBetaFeatures(): Promise<void> {
    try {
      // Check if user is already registered
      const betaUser = await this.betaManager.getBetaUser();

      if (!betaUser) {
        // Show beta registration modal for new users
        setTimeout(() => this.showBetaRegistration(), 2000);
      } else {
        // Update user activity
        await this.betaManager.updateUserActivity();
        console.log('🧪 Beta user active:', betaUser.name);
      }

    } catch (error) {
      console.error('❌ Beta initialization failed:', error);
    }
  }

  // 📝 Show feedback modal
  private showFeedbackModal(): void {
    if (this.feedbackModal) {
      this.feedbackModal.show();
    }
  }

  // 👤 Show beta registration
  private showBetaRegistration(): void {
    const modal = document.createElement('div');
    modal.className = 'beta-registration-overlay';
    modal.innerHTML = `
      <div class="beta-registration-modal">
        <div class="beta-header">
          <h2>🧪 Welcome to StrengthLog V2.0 Beta!</h2>
          <p>Help us make this the best strength training app by providing feedback on new features.</p>
        </div>

        <form class="beta-form" id="beta-form">
          <div class="form-group">
            <label for="beta-name">Name</label>
            <input type="text" id="beta-name" required placeholder="Your name">
          </div>

          <div class="form-group">
            <label for="beta-email">Email (optional)</label>
            <input type="email" id="beta-email" placeholder="your@email.com">
          </div>

          <div class="form-group">
            <label for="beta-experience">Training Experience</label>
            <select id="beta-experience" required>
              <option value="">Select your experience level...</option>
              <option value="beginner">🌱 Beginner (0-1 years)</option>
              <option value="intermediate">💪 Intermediate (1-3 years)</option>
              <option value="advanced">🏆 Advanced (3+ years)</option>
            </select>
          </div>

          <div class="form-group">
            <label>What are your main fitness goals? (select all that apply)</label>
            <div class="checkbox-group">
              <label><input type="checkbox" value="strength"> Build Strength</label>
              <label><input type="checkbox" value="muscle"> Build Muscle</label>
              <label><input type="checkbox" value="endurance"> Improve Endurance</label>
              <label><input type="checkbox" value="weight-loss"> Lose Weight</label>
              <label><input type="checkbox" value="general-fitness"> General Fitness</label>
              <label><input type="checkbox" value="sport-performance"> Sport Performance</label>
            </div>
          </div>

          <div class="form-group">
            <label class="consent-label">
              <input type="checkbox" id="beta-consent" required>
              I agree to participate in the beta program and provide feedback
            </label>
          </div>

          <div class="form-group">
            <label class="analytics-label">
              <input type="checkbox" id="beta-analytics" checked>
              Allow anonymous usage analytics to help improve the app
            </label>
          </div>

          <div class="beta-actions">
            <button type="button" class="skip-btn" id="beta-skip">Skip for now</button>
            <button type="submit" class="join-btn">🚀 Join Beta</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('#beta-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleBetaRegistration(e.target as HTMLFormElement, modal);
    });

    modal.querySelector('#beta-skip')?.addEventListener('click', () => {
      document.body.removeChild(modal);
      this.showToast('You can join the beta program anytime from settings', 'info');
    });
  }

  // 📝 Handle beta registration
  private async handleBetaRegistration(form: HTMLFormElement, modal: HTMLElement): Promise<void> {
    try {
      const formData = new FormData(form);
      const goals: string[] = [];

      // Collect selected goals
      form.querySelectorAll('input[type="checkbox"][value]').forEach(checkbox => {
        if ((checkbox as HTMLInputElement).checked) {
          goals.push((checkbox as HTMLInputElement).value);
        }
      });

      const userId = await this.betaManager.registerBetaUser({
        name: formData.get('name') as string,
        email: formData.get('email') as string || '',
        experience: formData.get('experience') as any,
        goals,
        consentGiven: true,
        analyticsOptIn: (form.querySelector('#beta-analytics') as HTMLInputElement).checked
      });

      document.body.removeChild(modal);
      this.showToast(`🎉 Welcome to the beta program! Your feedback will help shape V2.0`, 'success');

      console.log('🧪 Beta user registered:', userId);
    } catch (error) {
      console.error('❌ Beta registration failed:', error);
      this.showToast('Registration failed. You can try again from settings.', 'error');
    }
  }

  // 🎨 Load feedback modal styles
  private loadFeedbackStyles(): void {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'src/styles/feedback-modal.css';
    document.head.appendChild(link);
  }
}