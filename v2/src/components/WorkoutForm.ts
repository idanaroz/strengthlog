// 🏋️ Modern Workout Form Component

import type { Exercise, WorkoutSession, WorkoutExercise, WorkoutSet } from '@types/index.js';

export class WorkoutForm {
  private container: HTMLElement;
  private exercises: Exercise[];
  private currentWorkout: WorkoutSession;
  private onSave: (workout: WorkoutSession) => void;
  private restTimer: number | null = null;

  constructor(
    container: HTMLElement,
    exercises: Exercise[],
    onSave: (workout: WorkoutSession) => void
  ) {
    this.container = container;
    this.exercises = exercises;
    this.onSave = onSave;
    this.currentWorkout = this.createEmptyWorkout();
  }

  // 🏗️ Create empty workout template
  private createEmptyWorkout(): WorkoutSession {
    return {
      id: this.generateId(),
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toTimeString().slice(0, 5),
      exercises: [],
      notes: '',
      mood: 3,
      duration: 0,
      totalVolume: 0,
      dateCreated: new Date().toISOString()
    };
  }

  // 🎨 Render the complete workout form
  render(): void {
    this.container.innerHTML = `
      <div class="workout-form-container">
        <!-- Header Section -->
        <div class="workout-header">
          <h2 class="workout-title">
            <span class="icon">🏋️</span>
            New Workout
          </h2>
          <div class="workout-meta">
            <input
              type="date"
              id="workout-date"
              value="${this.currentWorkout.date}"
              class="date-input"
            >
            <input
              type="time"
              id="workout-time"
              value="${this.currentWorkout.startTime}"
              class="time-input"
            >
          </div>
        </div>

        <!-- Mood Tracker -->
        <div class="mood-section">
          <label class="section-label">How are you feeling?</label>
          <div class="mood-selector">
            ${[1, 2, 3, 4, 5].map(mood => `
              <button
                class="mood-btn ${this.currentWorkout.mood === mood ? 'active' : ''}"
                data-mood="${mood}"
              >
                ${this.getMoodEmoji(mood)}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Exercise Section -->
        <div class="exercises-section">
          <div class="section-header">
            <label class="section-label">Exercises</label>
            <button class="add-exercise-btn" id="add-exercise">
              <span class="icon">➕</span> Add Exercise
            </button>
          </div>

          <div class="exercises-list" id="exercises-list">
            ${this.renderExercises()}
          </div>
        </div>

        <!-- Notes Section -->
        <div class="notes-section">
          <label class="section-label" for="workout-notes">Workout Notes</label>
          <textarea
            id="workout-notes"
            placeholder="How did the workout feel? Any observations?"
            class="notes-input"
          >${this.currentWorkout.notes}</textarea>
        </div>

        <!-- Action Buttons -->
        <div class="form-actions">
          <button class="cancel-btn" id="cancel-workout">Cancel</button>
          <button class="save-btn" id="save-workout">
            <span class="icon">💾</span> Save Workout
          </button>
        </div>

        <!-- Rest Timer Modal -->
        <div class="rest-timer-modal hidden" id="rest-timer">
          <div class="timer-content">
            <h3>Rest Timer</h3>
            <div class="timer-display" id="timer-display">1:30</div>
            <div class="timer-controls">
              <button class="timer-btn" id="timer-stop">Stop</button>
              <button class="timer-btn" id="timer-reset">Reset</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  // 🏋️ Render individual exercises
  private renderExercises(): string {
    if (this.currentWorkout.exercises.length === 0) {
      return `
        <div class="empty-exercises">
          <span class="empty-icon">🎯</span>
          <p>No exercises added yet</p>
          <p class="empty-hint">Click "Add Exercise" to start your workout</p>
        </div>
      `;
    }

    return this.currentWorkout.exercises.map(exercise =>
      this.renderExercise(exercise)
    ).join('');
  }

  // 🎯 Render individual exercise block
  private renderExercise(exercise: WorkoutExercise): string {
    const exerciseDetails = this.exercises.find(ex => ex.id === exercise.exerciseId);

    return `
      <div class="exercise-block" data-exercise-id="${exercise.id}">
        <div class="exercise-header">
          <h3 class="exercise-name">${exerciseDetails?.name || 'Unknown Exercise'}</h3>
          <div class="exercise-actions">
            <button class="exercise-action-btn" data-action="notes">📝</button>
            <button class="exercise-action-btn" data-action="delete">🗑️</button>
          </div>
        </div>

        <!-- Sets Table -->
        <div class="sets-container">
          <div class="sets-header">
            <span>Set</span>
            <span>Weight (kg)</span>
            <span>Reps</span>
            <span>RPE</span>
            <span>Actions</span>
          </div>

          <div class="sets-list">
            ${exercise.sets.map((set, index) =>
              this.renderSet(exercise.id, set, index + 1)
            ).join('')}
          </div>

          <button class="add-set-btn" data-exercise-id="${exercise.id}">
            <span class="icon">➕</span> Add Set
          </button>
        </div>

        <!-- Exercise Notes -->
        ${exercise.notes ? `
          <div class="exercise-notes">
            <span class="notes-label">Notes:</span>
            <span class="notes-text">${exercise.notes}</span>
          </div>
        ` : ''}

        <!-- Exercise Metrics Preview -->
        <div class="exercise-metrics">
          <div class="metric">
            <span class="metric-label">Volume</span>
            <span class="metric-value">${exercise.metrics?.totalVolume || 0}kg</span>
          </div>
          <div class="metric">
            <span class="metric-label">Max Weight</span>
            <span class="metric-value">${exercise.metrics?.maxWeight || 0}kg</span>
          </div>
          <div class="metric">
            <span class="metric-label">Est. 1RM</span>
            <span class="metric-value">${exercise.metrics?.estimatedOneRepMax || 0}kg</span>
          </div>
        </div>
      </div>
    `;
  }

  // 📊 Render individual set
  private renderSet(exerciseId: string, set: WorkoutSet, setNumber: number): string {
    return `
      <div class="set-row" data-set-id="${set.id}">
        <span class="set-number">${setNumber}</span>
        <input
          type="number"
          class="weight-input"
          value="${set.weight}"
          min="0"
          step="0.5"
          data-field="weight"
        >
        <input
          type="number"
          class="reps-input"
          value="${set.reps}"
          min="0"
          step="1"
          data-field="reps"
        >
        <select class="rpe-select" data-field="rpe">
          <option value="">-</option>
          ${[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(rpe => `
            <option value="${rpe}" ${set.rpe === rpe ? 'selected' : ''}>${rpe}</option>
          `).join('')}
        </select>
        <div class="set-actions">
          <button class="set-action-btn timer-btn" data-action="timer">⏱️</button>
          <button class="set-action-btn delete-btn" data-action="delete">❌</button>
        </div>
      </div>
    `;
  }

  // 🎭 Get mood emoji
  private getMoodEmoji(mood: number): string {
    const emojis = ['😞', '😐', '🙂', '😊', '🤩'];
    return emojis[mood - 1] || '🙂';
  }

  // 🎧 Attach event listeners
  private attachEventListeners(): void {
    // Basic form inputs
    this.container.addEventListener('change', this.handleFormChange.bind(this));
    this.container.addEventListener('click', this.handleClick.bind(this));
    this.container.addEventListener('input', this.handleInput.bind(this));

    // Mood selector
    this.container.querySelectorAll('.mood-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.selectMood(parseInt((e.target as HTMLElement).dataset.mood || '3'));
      });
    });
  }

  // 🔄 Handle form changes
  private handleFormChange(e: Event): void {
    const target = e.target as HTMLInputElement;

    switch (target.id) {
      case 'workout-date':
        this.currentWorkout.date = target.value;
        break;
      case 'workout-time':
        this.currentWorkout.startTime = target.value;
        break;
      case 'workout-notes':
        this.currentWorkout.notes = target.value;
        break;
    }
  }

  // 👆 Handle click events
  private handleClick(e: Event): void {
    const target = e.target as HTMLElement;
    const action = target.dataset.action;

    switch (target.id) {
      case 'add-exercise':
        this.showExerciseSelector();
        break;
      case 'save-workout':
        this.saveWorkout();
        break;
      case 'cancel-workout':
        this.cancelWorkout();
        break;
    }

    // Handle dynamic actions
    if (action) {
      switch (action) {
        case 'delete':
          this.handleDelete(target);
          break;
        case 'timer':
          this.startRestTimer();
          break;
        case 'notes':
          this.editExerciseNotes(target);
          break;
      }
    }

    // Handle add set buttons
    if (target.classList.contains('add-set-btn')) {
      const exerciseId = target.dataset.exerciseId;
      if (exerciseId) this.addSet(exerciseId);
    }
  }

  // ⌨️ Handle input events (real-time updates)
  private handleInput(e: Event): void {
    const target = e.target as HTMLInputElement;

    if (target.classList.contains('weight-input') ||
        target.classList.contains('reps-input') ||
        target.classList.contains('rpe-select')) {
      this.updateSet(target);
    }
  }

  // 😊 Select mood
  private selectMood(mood: number): void {
    this.currentWorkout.mood = mood;

    // Update UI
    this.container.querySelectorAll('.mood-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.mood || '0') === mood);
    });
  }

  // 🏋️ Show exercise selector modal
  private showExerciseSelector(): void {
    // Create modal for exercise selection
    const modal = document.createElement('div');
    modal.className = 'exercise-selector-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Select Exercise</h3>
          <button class="close-btn">&times;</button>
        </div>
        <div class="exercise-search">
          <input type="text" placeholder="Search exercises..." id="exercise-search">
        </div>
        <div class="exercise-list">
          ${this.exercises.map(exercise => `
            <div class="exercise-option" data-exercise-id="${exercise.id}">
              <span class="exercise-name">${exercise.name}</span>
              <span class="exercise-category">${exercise.category}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Add to DOM
    document.body.appendChild(modal);

    // Event listeners
    modal.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (target.classList.contains('close-btn') || target === modal) {
        document.body.removeChild(modal);
      } else if (target.classList.contains('exercise-option')) {
        const exerciseId = target.dataset.exerciseId;
        if (exerciseId) {
          this.addExercise(exerciseId);
          document.body.removeChild(modal);
        }
      }
    });
  }

  // ➕ Add new exercise to workout
  private addExercise(exerciseId: string): void {
    const newExercise: WorkoutExercise = {
      id: this.generateId(),
      exerciseId,
      sets: [this.createEmptySet()],
      notes: '',
      restTime: 90,
      metrics: this.calculateEmptyMetrics(),
      progression: this.createEmptyProgression()
    };

    this.currentWorkout.exercises.push(newExercise);
    this.updateExerciseList();
  }

  // ➕ Add new set to exercise
  private addSet(exerciseId: string): void {
    const exercise = this.currentWorkout.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    // Copy values from last set as starting point
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet = this.createEmptySet();

    if (lastSet) {
      newSet.weight = lastSet.weight;
      newSet.reps = lastSet.reps;
    }

    exercise.sets.push(newSet);
    this.updateExerciseMetrics(exercise);
    this.updateExerciseList();
  }

  // 🗑️ Handle delete actions
  private handleDelete(target: HTMLElement): void {
    const setRow = target.closest('.set-row');
    const exerciseBlock = target.closest('.exercise-block');

    if (setRow) {
      // Delete set
      const setId = setRow.dataset.setId;
      this.deleteSet(setId!);
    } else if (exerciseBlock) {
      // Delete exercise
      const exerciseId = exerciseBlock.dataset.exerciseId;
      this.deleteExercise(exerciseId!);
    }
  }

  // 🔄 Update set data
  private updateSet(input: HTMLInputElement): void {
    const setRow = input.closest('.set-row');
    if (!setRow) return;

    const setId = setRow.dataset.setId;
    const field = input.dataset.field;
    const value = input.value;

    // Find and update the set
    for (const exercise of this.currentWorkout.exercises) {
      const set = exercise.sets.find(s => s.id === setId);
      if (set) {
        switch (field) {
          case 'weight':
            set.weight = parseFloat(value) || 0;
            break;
          case 'reps':
            set.reps = parseInt(value) || 0;
            break;
          case 'rpe':
            set.rpe = value ? parseFloat(value) : undefined;
            break;
        }

        this.updateExerciseMetrics(exercise);
        this.updateMetricsDisplay(exercise);
        break;
      }
    }
  }

  // 📊 Update exercise metrics
  private updateExerciseMetrics(exercise: WorkoutExercise): void {
    const totalVolume = exercise.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
    const maxWeight = Math.max(...exercise.sets.map(set => set.weight));
    const maxReps = Math.max(...exercise.sets.map(set => set.reps));
    const avgRPE = exercise.sets
      .filter(set => set.rpe)
      .reduce((sum, set, _, arr) => sum + (set.rpe || 0) / arr.length, 0);

    exercise.metrics = {
      totalVolume,
      maxWeight,
      maxReps,
      averageRPE: avgRPE || undefined,
      estimatedOneRepMax: this.calculateOneRepMax(exercise.sets),
      volumePerMinute: totalVolume / (exercise.restTime * exercise.sets.length / 60),
      intensityScore: (maxWeight * maxReps) / totalVolume * 100
    };
  }

  // 🧮 Calculate estimated 1RM
  private calculateOneRepMax(sets: WorkoutSet[]): number {
    let best = 0;

    sets.forEach(set => {
      if (set.reps === 0 || set.weight === 0) return;

      // Epley formula: weight × (1 + reps/30)
      const estimate = set.weight * (1 + set.reps / 30);
      best = Math.max(best, estimate);
    });

    return Math.round(best * 10) / 10;
  }

  // 💾 Save workout
  private saveWorkout(): void {
    // Validate workout
    if (this.currentWorkout.exercises.length === 0) {
      alert('Please add at least one exercise to save the workout.');
      return;
    }

    // Calculate final metrics
    this.currentWorkout.totalVolume = this.currentWorkout.exercises
      .reduce((sum, ex) => sum + (ex.metrics?.totalVolume || 0), 0);

    this.currentWorkout.endTime = new Date().toTimeString().slice(0, 5);

    // Calculate duration
    const start = new Date(`2000-01-01T${this.currentWorkout.startTime}`);
    const end = new Date(`2000-01-01T${this.currentWorkout.endTime}`);
    this.currentWorkout.duration = Math.round((end.getTime() - start.getTime()) / 1000 / 60);

    this.onSave(this.currentWorkout);
  }

  // Helper methods
  private createEmptySet(): WorkoutSet {
    return {
      id: this.generateId(),
      weight: 0,
      reps: 0,
      isWarmup: false,
      isFailure: false
    };
  }

  private calculateEmptyMetrics() {
    return {
      totalVolume: 0,
      maxWeight: 0,
      maxReps: 0,
      estimatedOneRepMax: 0,
      volumePerMinute: 0,
      intensityScore: 0
    };
  }

  private createEmptyProgression() {
    return {
      weightChange: 0,
      volumeChange: 0,
      strengthChange: 0,
      isPersonalBest: false,
      streak: 0,
      lastImprovement: ''
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private updateExerciseList(): void {
    const listContainer = this.container.querySelector('#exercises-list');
    if (listContainer) {
      listContainer.innerHTML = this.renderExercises();
    }
  }

  private updateMetricsDisplay(exercise: WorkoutExercise): void {
    const exerciseBlock = this.container.querySelector(`[data-exercise-id="${exercise.id}"]`);
    if (!exerciseBlock) return;

    const metricsContainer = exerciseBlock.querySelector('.exercise-metrics');
    if (metricsContainer) {
      metricsContainer.innerHTML = `
        <div class="metric">
          <span class="metric-label">Volume</span>
          <span class="metric-value">${exercise.metrics?.totalVolume || 0}kg</span>
        </div>
        <div class="metric">
          <span class="metric-label">Max Weight</span>
          <span class="metric-value">${exercise.metrics?.maxWeight || 0}kg</span>
        </div>
        <div class="metric">
          <span class="metric-label">Est. 1RM</span>
          <span class="metric-value">${exercise.metrics?.estimatedOneRepMax || 0}kg</span>
        </div>
      `;
    }
  }

  private deleteSet(setId: string): void {
    for (const exercise of this.currentWorkout.exercises) {
      const setIndex = exercise.sets.findIndex(s => s.id === setId);
      if (setIndex !== -1) {
        exercise.sets.splice(setIndex, 1);
        this.updateExerciseMetrics(exercise);
        this.updateExerciseList();
        break;
      }
    }
  }

  private deleteExercise(exerciseId: string): void {
    const index = this.currentWorkout.exercises.findIndex(ex => ex.id === exerciseId);
    if (index !== -1) {
      this.currentWorkout.exercises.splice(index, 1);
      this.updateExerciseList();
    }
  }

  private editExerciseNotes(target: HTMLElement): void {
    const exerciseBlock = target.closest('.exercise-block');
    if (!exerciseBlock) return;

    const exerciseId = exerciseBlock.dataset.exerciseId;
    const exercise = this.currentWorkout.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const newNotes = prompt('Exercise notes:', exercise.notes);
    if (newNotes !== null) {
      exercise.notes = newNotes;
      this.updateExerciseList();
    }
  }

  private startRestTimer(): void {
    // Implementation for rest timer
    console.log('Starting rest timer...');
  }

  private cancelWorkout(): void {
    if (confirm('Are you sure you want to cancel? All progress will be lost.')) {
      this.currentWorkout = this.createEmptyWorkout();
      this.render();
    }
  }
}