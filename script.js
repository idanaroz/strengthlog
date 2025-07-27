// Strength Training Log Application
class StrengthLog {
    constructor() {
        this.exercises = [];
        this.workouts = [];
        this.currentEditingExercise = null;

        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderExercises();
        this.renderHistory();
        this.updateWorkoutSelectors();
        this.setDefaultDate();

        // Pre-load initial exercise if empty
        if (this.exercises.length === 0) {
            this.addInitialExercise();
        }
    }

    // Data Management
    loadData() {
        const savedExercises = localStorage.getItem('strengthlog-exercises');
        const savedWorkouts = localStorage.getItem('strengthlog-workouts');

        this.exercises = savedExercises ? JSON.parse(savedExercises) : [];
        this.workouts = savedWorkouts ? JSON.parse(savedWorkouts) : [];
    }

    saveData() {
        localStorage.setItem('strengthlog-exercises', JSON.stringify(this.exercises));
        localStorage.setItem('strengthlog-workouts', JSON.stringify(this.workouts));
    }

    addInitialExercise() {
        const initialExercise = {
            id: this.generateId(),
            name: 'One Hand Assisted Chin Up',
            notes: 'Pull-up variation with assistance for building strength toward one-handed chin-ups',
            dateCreated: new Date().toISOString()
        };

        this.exercises.push(initialExercise);
        this.saveData();
        this.renderExercises();
        this.updateWorkoutSelectors();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchSection(e.target.dataset.section));
        });

        // Exercise Management
        document.getElementById('add-exercise-btn').addEventListener('click', () => this.openExerciseModal());
        document.getElementById('exercise-form').addEventListener('submit', (e) => this.saveExercise(e));
        document.querySelector('.modal-close').addEventListener('click', () => this.closeExerciseModal());
        document.querySelector('.modal-cancel').addEventListener('click', () => this.closeExerciseModal());

        // Workout Logging
        document.getElementById('add-set-btn').addEventListener('click', () => this.addSet());
        document.getElementById('save-workout-btn').addEventListener('click', () => this.saveWorkout());

        // History Filters
        document.getElementById('exercise-filter').addEventListener('change', () => this.filterHistory());
        document.getElementById('date-from').addEventListener('change', () => this.filterHistory());
        document.getElementById('date-to').addEventListener('change', () => this.filterHistory());

        // Settings
        document.getElementById('export-btn').addEventListener('click', () => this.exportData());
        document.getElementById('import-btn').addEventListener('click', () => this.importData());
        document.getElementById('import-file').addEventListener('change', (e) => this.handleFileImport(e));
        document.getElementById('clear-data-btn').addEventListener('click', () => this.clearData());

        // History workout actions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-workout-btn')) {
                const workoutId = e.target.getAttribute('data-workout-id');
                this.editWorkout(workoutId);
            }
            if (e.target.classList.contains('delete-workout-btn')) {
                const workoutId = e.target.getAttribute('data-workout-id');
                this.deleteWorkout(workoutId);
            }
        });

        // Modal background click
        document.getElementById('exercise-modal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeExerciseModal();
            }
        });
    }

    // Navigation
    switchSection(sectionName) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
        document.getElementById(sectionName).classList.add('active');

        // Update history filters when switching to history
        if (sectionName === 'history') {
            this.updateHistoryFilters();
        }
    }

    // Exercise Management
    openExerciseModal(exercise = null) {
        this.currentEditingExercise = exercise;
        const modal = document.getElementById('exercise-modal');
        const title = document.getElementById('modal-title');
        const nameInput = document.getElementById('exercise-name');
        const notesInput = document.getElementById('exercise-notes');

        if (exercise) {
            title.textContent = 'Edit Exercise';
            nameInput.value = exercise.name;
            notesInput.value = exercise.notes || '';
        } else {
            title.textContent = 'Add Exercise';
            nameInput.value = '';
            notesInput.value = '';
        }

        modal.classList.add('active');
        nameInput.focus();
    }

    closeExerciseModal() {
        const modal = document.getElementById('exercise-modal');
        modal.classList.remove('active');
        this.currentEditingExercise = null;
        this.currentEditingWorkout = null;
    }

    saveExercise(e) {
        e.preventDefault();

        const nameInput = document.getElementById('exercise-name');
        const notesInput = document.getElementById('exercise-notes');

        const exerciseData = {
            name: nameInput.value.trim(),
            notes: notesInput.value.trim()
        };

        if (!exerciseData.name) {
            this.showMessage('Exercise name is required', 'error');
            return;
        }

        if (this.currentEditingExercise) {
            // Update existing exercise
            const index = this.exercises.findIndex(ex => ex.id === this.currentEditingExercise.id);
            this.exercises[index] = { ...this.currentEditingExercise, ...exerciseData };
            this.showMessage('Exercise updated successfully', 'success');
        } else {
            // Add new exercise
            const newExercise = {
                id: this.generateId(),
                ...exerciseData,
                dateCreated: new Date().toISOString()
            };
            this.exercises.push(newExercise);
            this.showMessage('Exercise added successfully', 'success');
        }

        this.saveData();
        this.renderExercises();
        this.updateWorkoutSelectors();
        this.closeExerciseModal();
    }

    deleteExercise(exerciseId) {
        if (confirm('Are you sure you want to delete this exercise? This will also remove all associated workouts.')) {
            this.exercises = this.exercises.filter(ex => ex.id !== exerciseId);
            this.workouts = this.workouts.filter(w => w.exerciseId !== exerciseId);
            this.saveData();
            this.renderExercises();
            this.updateWorkoutSelectors();
            this.renderHistory();
            this.showMessage('Exercise deleted successfully', 'success');
        }
    }

    renderExercises() {
        const container = document.getElementById('exercise-list');

        if (this.exercises.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>🚀 Ready to Start Your Journey?</h3>
                    <p>Add your first exercise and begin building strength, one rep at a time!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.exercises.map(exercise => `
            <div class="exercise-item">
                <div class="exercise-header">
                    <h3 class="exercise-name">${this.escapeHtml(exercise.name)}</h3>
                    <div class="exercise-actions">
                        <button class="btn btn-secondary btn-small" onclick="app.openExerciseModal(${JSON.stringify(exercise).replace(/"/g, '&quot;')})">
                            Edit
                        </button>
                        <button class="btn btn-danger btn-small" onclick="app.deleteExercise('${exercise.id}')">
                            Delete
                        </button>
                    </div>
                </div>
                ${exercise.notes ? `<div class="exercise-notes">${this.escapeHtml(exercise.notes)}</div>` : ''}
            </div>
        `).join('');
    }

    // Workout Logging
    setDefaultDate() {
        const dateInput = document.getElementById('workout-date');
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    updateWorkoutSelectors() {
        const exerciseSelect = document.getElementById('exercise-select');
        const exerciseFilter = document.getElementById('exercise-filter');

        // Update workout exercise selector
        exerciseSelect.innerHTML = '<option value="">Select an exercise...</option>' +
            this.exercises.map(ex => `<option value="${ex.id}">${this.escapeHtml(ex.name)}</option>`).join('');

        // Update history filter
        exerciseFilter.innerHTML = '<option value="">All Exercises</option>' +
            this.exercises.map(ex => `<option value="${ex.id}">${this.escapeHtml(ex.name)}</option>`).join('');
    }

    addSet() {
        const container = document.getElementById('sets-container');
        const setNumber = container.children.length + 1;

        const setElement = document.createElement('div');
        setElement.className = 'set-item';
        setElement.innerHTML = `
            <div class="set-number">Set ${setNumber}</div>
            <div class="set-input-group">
                <label>Weight (kg)</label>
                <input type="number" class="set-input weight-input" min="0" step="0.5" placeholder="0">
            </div>
            <div class="set-input-group">
                <label>Reps</label>
                <input type="number" class="set-input reps-input" min="1" placeholder="0">
            </div>
            <button type="button" class="remove-set" onclick="this.parentElement.remove(); app.updateSetNumbers();">×</button>
        `;

        container.appendChild(setElement);
        setElement.querySelector('.weight-input').focus();
    }

    updateSetNumbers() {
        const sets = document.querySelectorAll('.set-item');
        sets.forEach((set, index) => {
            set.querySelector('.set-number').textContent = `Set ${index + 1}`;
        });
    }

    saveWorkout() {
        const exerciseId = document.getElementById('exercise-select').value;
        const workoutDate = document.getElementById('workout-date').value;
        const workoutNotes = document.getElementById('workout-notes').value.trim();
        const sets = Array.from(document.querySelectorAll('.set-item')).map(setElement => ({
            weight: parseFloat(setElement.querySelector('.weight-input').value) || 0,
            reps: parseInt(setElement.querySelector('.reps-input').value) || 0
        }));

        if (!exerciseId) {
            this.showMessage('Please select an exercise', 'error');
            return;
        }

        if (!sets.length) {
            this.showMessage('Please add at least one set', 'error');
            return;
        }

        if (sets.some(set => set.reps === 0)) {
            this.showMessage('Please enter reps for all sets', 'error');
            return;
        }

        const workout = {
            id: this.generateId(),
            exerciseId,
            date: workoutDate,
            sets,
            notes: workoutNotes,
            dateCreated: new Date().toISOString()
        };

        if (this.currentEditingWorkout) {
            // Update existing workout
            const index = this.workouts.findIndex(w => w.id === this.currentEditingWorkout.id);
            this.workouts[index] = workout;
            this.showMessage('Workout updated successfully', 'success');
        } else {
            // Add new workout
            this.workouts.push(workout);
            this.showMessage('Workout saved successfully', 'success');
        }

        this.saveData();
        this.renderHistory();

        // Clear the form and reset button
        document.getElementById('exercise-select').value = '';
        document.getElementById('sets-container').innerHTML = '';
        document.getElementById('workout-notes').value = '';
        this.setDefaultDate();
        this.currentEditingWorkout = null;

        // Reset save button
        const saveBtn = document.getElementById('save-workout-btn');
        saveBtn.textContent = 'Save Workout';
        saveBtn.style.background = '';
    }

    editWorkout(workoutId) {
        const workout = this.workouts.find(w => w.id === workoutId);
        if (!workout) return;

        this.currentEditingWorkout = workout;

        // Switch to log workout section
        this.switchSection('log');

        // Populate the form with workout data
        document.getElementById('workout-date').value = workout.date;
        document.getElementById('exercise-select').value = workout.exerciseId;
        document.getElementById('workout-notes').value = workout.notes || '';

        // Clear existing sets
        document.getElementById('sets-container').innerHTML = '';

        // Add sets from the workout
        workout.sets.forEach((set, index) => {
            this.addSet();
            const setElements = document.querySelectorAll('.set-item');
            const currentSet = setElements[setElements.length - 1];
            currentSet.querySelector('.weight-input').value = set.weight;
            currentSet.querySelector('.reps-input').value = set.reps;
        });

        // Show editing indicator
        const saveBtn = document.getElementById('save-workout-btn');
        saveBtn.textContent = 'Update Workout';
        saveBtn.style.background = 'var(--accent-gradient)';

        this.showMessage('Editing workout - make your changes and click "Update Workout"', 'success');
    }

    deleteWorkout(workoutId) {
        if (!confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
            return;
        }

        const index = this.workouts.findIndex(w => w.id === workoutId);
        if (index !== -1) {
            this.workouts.splice(index, 1);
            this.saveData();
            this.renderHistory();
            this.showMessage('Workout deleted successfully', 'success');
        }
    }

    // History Management
    updateHistoryFilters() {
        this.updateWorkoutSelectors();  // This updates both selectors
    }

    filterHistory() {
        const exerciseFilter = document.getElementById('exercise-filter').value;
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;

        let filteredWorkouts = [...this.workouts];

        if (exerciseFilter) {
            filteredWorkouts = filteredWorkouts.filter(w => w.exerciseId === exerciseFilter);
        }

        if (dateFrom) {
            filteredWorkouts = filteredWorkouts.filter(w => w.date >= dateFrom);
        }

        if (dateTo) {
            filteredWorkouts = filteredWorkouts.filter(w => w.date <= dateTo);
        }

        this.renderHistory(filteredWorkouts);
    }

    renderHistory(workoutsToShow = null) {
        const container = document.getElementById('history-list');
        const workouts = workoutsToShow || this.workouts;

        if (workouts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>💪 Your Strength Story Begins Here</h3>
                    <p>Log your first workout and watch your progress unfold. Every rep counts!</p>
                </div>
            `;
            return;
        }

        // Sort workouts by date (newest first)
        const sortedWorkouts = workouts.sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = sortedWorkouts.map(workout => {
            const exercise = this.exercises.find(ex => ex.id === workout.exerciseId);
            const exerciseName = exercise ? exercise.name : 'Unknown Exercise';

            return `
                <div class="history-item">
                    <div class="history-header">
                        <div class="history-date">${this.formatDate(workout.date)}</div>
                        <div class="history-exercise">${this.escapeHtml(exerciseName)}</div>
                        <div class="history-actions">
                            <button class="btn btn-secondary btn-small edit-workout-btn" data-workout-id="${workout.id}">Edit</button>
                            <button class="btn btn-danger btn-small delete-workout-btn" data-workout-id="${workout.id}">Delete</button>
                        </div>
                    </div>
                    <div class="history-sets">
                        ${workout.sets.map((set, index) => `
                            <div class="history-set">
                                <span>Set ${index + 1}</span>
                                <span>${set.weight > 0 ? set.weight + ' kg' : 'Bodyweight'} × ${set.reps} reps</span>
                            </div>
                        `).join('')}
                    </div>
                    ${workout.notes ? `
                        <div class="history-notes">
                            <strong>Notes:</strong> ${this.escapeHtml(workout.notes)}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    // Data Import/Export
    exportData() {
        const data = {
            exercises: this.exercises,
            workouts: this.workouts,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `strength-log-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showMessage('Data exported successfully', 'success');
    }

    importData() {
        document.getElementById('import-file').click();
    }

    handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);

                if (!data.exercises || !data.workouts) {
                    throw new Error('Invalid backup file format');
                }

                if (confirm('This will replace all your current data. Are you sure you want to continue?')) {
                    this.exercises = data.exercises;
                    this.workouts = data.workouts;
                    this.saveData();
                    this.renderExercises();
                    this.renderHistory();
                    this.updateWorkoutSelectors();
                    this.showMessage('Data imported successfully', 'success');
                }
            } catch (error) {
                this.showMessage('Error importing data: Invalid file format', 'error');
            }
        };
        reader.readAsText(file);

        // Clear the file input
        e.target.value = '';
    }

    clearData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            if (confirm('This will permanently delete all exercises and workout history. Continue?')) {
                this.exercises = [];
                this.workouts = [];
                localStorage.removeItem('strengthlog-exercises');
                localStorage.removeItem('strengthlog-workouts');
                this.renderExercises();
                this.renderHistory();
                this.updateWorkoutSelectors();
                this.showMessage('All data cleared', 'success');
            }
        }
    }

    // Utility Functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    showMessage(text, type = 'success') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;

        // Insert at the top of the active section
        const activeSection = document.querySelector('.section.active');
        activeSection.insertBefore(message, activeSection.firstChild);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 3000);
    }
}

// Initialize the application
const app = new StrengthLog();