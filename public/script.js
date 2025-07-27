// Strength Training Log Application
class StrengthLog {
    constructor() {
        this.exercises = [];
        this.workouts = [];
        this.currentEditingExercise = null;
        this.currentEditingWorkout = null;

        // GitHub backup settings
        this.githubSettings = {
            token: null,
            username: null,
            repository: null,
            enabled: false
        };

        this.lastBackupTime = null;
        this.backupInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderExercises();
        this.renderHistory();
        this.updateWorkoutSelectors();
        this.setDefaultDate();

        // Ensure default exercises exist
        this.ensureDefaultExercises();

        // Add default set when app loads
        this.ensureMinimumSets();
    }

    // Data Management
    loadData() {
        const savedExercises = localStorage.getItem('strengthlog-exercises');
        const savedWorkouts = localStorage.getItem('strengthlog-workouts');
        const savedGithubSettings = localStorage.getItem('strengthlog-github-settings');
        const savedLastBackup = localStorage.getItem('strengthlog-last-backup');

        this.exercises = savedExercises ? JSON.parse(savedExercises) : [];
        this.workouts = savedWorkouts ? JSON.parse(savedWorkouts) : [];

        // GitHub settings are now server-managed, no need to load from client
        // Keep basic structure for backward compatibility
        this.githubSettings = {
            enabled: false // Always false since it's server-managed now
        };

        this.lastBackupTime = savedLastBackup ? new Date(savedLastBackup) : null;
    }

    saveData() {
        localStorage.setItem('strengthlog-exercises', JSON.stringify(this.exercises));
        localStorage.setItem('strengthlog-workouts', JSON.stringify(this.workouts));
        // GitHub settings no longer saved to localStorage since they're server-managed
        if (this.lastBackupTime) {
            localStorage.setItem('strengthlog-last-backup', this.lastBackupTime.toISOString());
        }

        // Check if auto-backup is needed
        this.checkAutoBackup();
    }

    ensureDefaultExercises() {
        const defaultExercises = [
            'Right One Hand Assisted Chin Up',
            'Left One Hand Assisted Chin Up'
        ];

        defaultExercises.forEach(exerciseName => {
            const exists = this.exercises.some(ex => ex.name === exerciseName);
            if (!exists) {
                const newExercise = {
                    id: this.generateId(),
                    name: exerciseName,
                    notes: '',
                    dateCreated: new Date().toISOString()
                };
                this.exercises.push(newExercise);
            }
        });

        // Save if we added any new exercises
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
        document.getElementById('year-filter').addEventListener('change', () => this.filterHistory());
        document.getElementById('month-filter').addEventListener('change', () => this.filterHistory());

        // Settings
        document.getElementById('export-btn').addEventListener('click', () => this.exportData());
        document.getElementById('import-btn').addEventListener('click', () => this.importData());
        document.getElementById('import-file').addEventListener('change', (e) => this.handleFileImport(e));

        // GitHub Backup
        document.getElementById('save-github-settings-btn').addEventListener('click', () => this.saveGitHubSettings());
        document.getElementById('backup-now-btn').addEventListener('click', () => this.manualBackup());
        document.getElementById('restore-backup-btn').addEventListener('click', () => this.manualRestore());

                // History workout actions will be handled by direct listeners in renderHistory

        // Modal background click
        document.getElementById('exercise-modal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeExerciseModal();
            }
        });
    }

    // Navigation
    switchSection(sectionName) {
        console.log('Switching to section:', sectionName);

        // Clear any editing states and reset forms when switching sections
        this.clearSectionState();

        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const activeNavBtn = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeNavBtn) {
            activeNavBtn.classList.add('active');
            console.log('Activated nav button for:', sectionName);
        } else {
            console.log('Nav button not found for:', sectionName);
        }

        // Update sections - explicitly hide all sections first
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none'; // Explicitly hide all sections
        });

        // Then show only the active section
        const activeSection = document.getElementById(sectionName);
        if (activeSection) {
            activeSection.classList.add('active');
            activeSection.style.display = 'block';
            console.log('Activated section:', sectionName);
        } else {
            console.log('Section not found:', sectionName);
        }

        // Double-check the section is visible
        setTimeout(() => {
            const checkSection = document.getElementById(sectionName);
            if (checkSection) {
                console.log('Section visibility check:', {
                    hasActiveClass: checkSection.classList.contains('active'),
                    display: window.getComputedStyle(checkSection).display,
                    visibility: window.getComputedStyle(checkSection).visibility
                });
            }
        }, 100);

        // Section-specific initialization
        if (sectionName === 'history') {
            this.initializeHistorySection();
        } else if (sectionName === 'workout') {
            this.initializeWorkoutSection();
        } else if (sectionName === 'settings') {
            this.initializeSettingsSection();
        }
    }

            // Clear all editing states and reset forms
    clearSectionState() {
        // Clear all editing states
        this.currentEditingExercise = null;
        this.currentEditingWorkout = null;

        // Close any open modals
        const modal = document.getElementById('exercise-modal');
        if (modal) {
            modal.classList.remove('active');
        }

        // Clear ALL form inputs across all sections
        this.clearAllFormInputs();

        // Remove any existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
    }

    // Clear all form inputs across all sections
    clearAllFormInputs() {
        // === WORKOUT SECTION ===
        const exerciseSelect = document.getElementById('exercise-select');
        const workoutNotes = document.getElementById('workout-notes');
        const workoutDate = document.getElementById('workout-date');
        const setsContainer = document.getElementById('sets-container');
        const saveBtn = document.getElementById('save-workout-btn');

        if (exerciseSelect) exerciseSelect.value = '';
        if (workoutNotes) workoutNotes.value = '';
        if (setsContainer) setsContainer.innerHTML = '';
        if (saveBtn) {
            saveBtn.textContent = 'Save Workout';
            saveBtn.style.background = '';
            saveBtn.disabled = false;
        }
        if (workoutDate) {
            workoutDate.value = new Date().toISOString().split('T')[0];
        }

        // === HISTORY SECTION FILTERS ===
        const exerciseFilter = document.getElementById('exercise-filter');
        const yearFilter = document.getElementById('year-filter');
        const monthFilter = document.getElementById('month-filter');

        if (exerciseFilter) exerciseFilter.value = '';
        if (yearFilter) yearFilter.value = '';
        if (monthFilter) monthFilter.value = '';

        // === EXERCISE MODAL ===
        const exerciseName = document.getElementById('exercise-name');
        const exerciseNotes = document.getElementById('exercise-notes');
        const modalTitle = document.getElementById('modal-title');

        if (exerciseName) exerciseName.value = '';
        if (exerciseNotes) exerciseNotes.value = '';
        if (modalTitle) modalTitle.textContent = 'Add Exercise';

        // === SETTINGS SECTION (partially clear for security) ===
        // Don't clear GitHub settings completely as user might be working on them
        // But reset any temporary states
        const backupBtn = document.getElementById('backup-now-btn');
        const restoreBtn = document.getElementById('restore-backup-btn');

        if (backupBtn) {
            backupBtn.disabled = false;
            backupBtn.textContent = 'Backup Now';
        }
        if (restoreBtn) {
            restoreBtn.disabled = false;
            restoreBtn.textContent = 'Restore from Backup';
        }
    }

        // Initialize workout section with clean state
    initializeWorkoutSection() {
        // Don't clear form again - it was already cleared in clearSectionState
        // Just ensure at least one set is present
        this.ensureMinimumSets();

        // Set focus to exercise selector
        setTimeout(() => {
            const exerciseSelect = document.getElementById('exercise-select');
            if (exerciseSelect) {
                exerciseSelect.focus();
            }
        }, 100);
    }

    // Initialize history section with clean state
    initializeHistorySection() {
        // Update filter options (but don't select anything - filters were cleared)
        this.updateHistoryFilters();

        // Render all history (since filters are cleared, show everything)
        this.renderHistory();
    }

    // Initialize settings section with clean state
    initializeSettingsSection() {
        // Update GitHub settings UI (preserves user's settings)
        this.updateGitHubSettingsUI();

        // Update backup status
        this.updateBackupStatus();
    }



    // Switch to workout section while preserving editing state
    switchToWorkoutForEdit() {
        console.log('Switching to workout section for editing');

        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const activeNavBtn = document.querySelector(`[data-section="workout"]`);
        if (activeNavBtn) {
            activeNavBtn.classList.add('active');
        }

        // Update sections - explicitly hide all sections first
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none'; // Explicitly hide all sections
        });

        // Then show only the workout section
        const activeSection = document.getElementById('workout');
        if (activeSection) {
            activeSection.classList.add('active');
            activeSection.style.display = 'block';
        }

        // Clear existing form data to prepare for editing data population
        const setsContainer = document.getElementById('sets-container');
        if (setsContainer) {
            setsContainer.innerHTML = '';
        }

        // Reset save button for editing mode
        const saveBtn = document.getElementById('save-workout-btn');
        if (saveBtn) {
            saveBtn.textContent = 'Update Workout';
            saveBtn.style.background = 'var(--accent-gradient)';
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

    ensureMinimumSets() {
        const setsContainer = document.getElementById('sets-container');
        if (setsContainer.children.length === 0) {
            this.addSet();
        }
    }

    saveWorkout() {
        const exerciseId = document.getElementById('exercise-select').value;
        const workoutDate = document.getElementById('workout-date').value;
        const workoutNotesValue = document.getElementById('workout-notes').value.trim();
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

        if (this.currentEditingWorkout) {
            // Update existing workout - preserve original ID and dateCreated
            const workout = {
                id: this.currentEditingWorkout.id,
                exerciseId,
                date: workoutDate,
                sets,
                notes: workoutNotesValue,
                dateCreated: this.currentEditingWorkout.dateCreated
            };
            const index = this.workouts.findIndex(w => w.id === this.currentEditingWorkout.id);
            if (index !== -1) {
                this.workouts[index] = workout;
                this.showMessage('Workout updated successfully', 'success');
            } else {
                this.showMessage('Error: Could not find workout to update', 'error');
                return;
            }
        } else {
            // Add new workout
            const workout = {
                id: this.generateId(),
                exerciseId,
                date: workoutDate,
                sets,
                notes: workoutNotesValue,
                dateCreated: new Date().toISOString()
            };
            this.workouts.push(workout);
            this.showMessage('Workout saved successfully', 'success');
        }

        this.saveData();
        this.renderHistory();

                        // Handle navigation after save/update
        const wasEditing = !!this.currentEditingWorkout;

        // Clear the editing state and form
        this.currentEditingWorkout = null;

                // Reset workout form to clean state
        const exerciseSelectElement = document.getElementById('exercise-select');
        const workoutNotesElement = document.getElementById('workout-notes');
        const setsContainerElement = document.getElementById('sets-container');
        const saveBtnElement = document.getElementById('save-workout-btn');

        if (exerciseSelectElement) exerciseSelectElement.value = '';
        if (workoutNotesElement) workoutNotesElement.value = '';
        if (setsContainerElement) setsContainerElement.innerHTML = '';
        if (saveBtnElement) {
            saveBtnElement.textContent = 'Save Workout';
            saveBtnElement.style.background = '';
            saveBtnElement.disabled = false;
        }
        this.setDefaultDate();

        // Add default set for next workout
        this.ensureMinimumSets();

        // If we were editing, redirect back to history to see the changes
        if (wasEditing) {
            setTimeout(() => {
                this.switchSection('history');
                this.showMessage('Workout updated successfully! You can see your changes in the history below.', 'success');
            }, 500);
        }
    }

    editWorkout(workoutId) {
        console.log('editWorkout called with ID:', workoutId);
        console.log('Available workouts:', this.workouts.map(w => ({id: w.id, exercise: w.exerciseId})));

        const workout = this.workouts.find(w => w.id === workoutId);
        if (!workout) {
            console.log('Workout not found!');
            this.showMessage('Error: Workout not found', 'error');
            return;
        }

        console.log('Found workout:', workout);

        // Set editing state before switching (to prevent it from being cleared)
        this.currentEditingWorkout = workout;

        // Clear section state manually but preserve the editing workout
        this.currentEditingExercise = null;

        // Close any open modals
        const modal = document.getElementById('exercise-modal');
        if (modal) {
            modal.classList.remove('active');
        }

        // Remove any existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        // Switch to log workout section (this will now skip clearing currentEditingWorkout)
        this.switchToWorkoutForEdit();

        // Add delay to ensure DOM elements are ready
        setTimeout(() => {
            try {
                console.log('Starting form population...');

                // Populate the form with workout data
                const dateInput = document.getElementById('workout-date');
                const exerciseSelect = document.getElementById('exercise-select');
                const notesInput = document.getElementById('workout-notes');
                const setsContainer = document.getElementById('sets-container');

                console.log('Form elements found:', {
                    dateInput: !!dateInput,
                    exerciseSelect: !!exerciseSelect,
                    notesInput: !!notesInput,
                    setsContainer: !!setsContainer
                });

                if (dateInput) {
                    dateInput.value = workout.date;
                    console.log('Set date to:', workout.date);
                }
                if (exerciseSelect) {
                    exerciseSelect.value = workout.exerciseId;
                    console.log('Set exercise to:', workout.exerciseId);
                }
                if (notesInput) {
                    notesInput.value = workout.notes || '';
                    console.log('Set notes to:', workout.notes);
                }

                // Clear existing sets
                if (setsContainer) {
                    setsContainer.innerHTML = '';
                    console.log('Cleared existing sets');
                }

                // Add sets from the workout
                console.log('Adding sets:', workout.sets);
                workout.sets.forEach((set, index) => {
                    console.log(`Adding set ${index + 1}:`, set);
                    this.addSet();
                    const setElements = document.querySelectorAll('.set-item');
                    const currentSet = setElements[setElements.length - 1];
                    if (currentSet) {
                        const weightInput = currentSet.querySelector('.weight-input');
                        const repsInput = currentSet.querySelector('.reps-input');
                        if (weightInput) {
                            weightInput.value = set.weight;
                            console.log(`Set weight input to: ${set.weight}`);
                        }
                        if (repsInput) {
                            repsInput.value = set.reps;
                            console.log(`Set reps input to: ${set.reps}`);
                        }
                    }
                });

                console.log('Form population completed successfully');
            } catch (error) {
                console.error('Error in editWorkout:', error);
                this.showMessage('Error editing workout', 'error');
            }
        }, 300);

        setTimeout(() => {
            this.showMessage('Editing workout - make your changes and click "Update Workout"', 'success');
        }, 200);
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
        const exerciseFilter = document.getElementById('exercise-filter');
        const yearFilter = document.getElementById('year-filter');
        const monthFilter = document.getElementById('month-filter');

        // Update exercise filter options
        exerciseFilter.innerHTML = '<option value="">All Exercises</option>' +
            this.exercises.map(ex => `<option value="${ex.id}">${this.escapeHtml(ex.name)}</option>`).join('');

        // Get unique years and months from workouts
        const years = [...new Set(this.workouts.map(w => w.date.substring(0, 4)))].sort().reverse();
        const yearMonths = [...new Set(this.workouts.map(w => w.date.substring(0, 7)))].sort().reverse();

        // Update year filter
        yearFilter.innerHTML = '<option value="">All Years</option>' +
            years.map(year => `<option value="${year}">${year}</option>`).join('');

        // Update month filter
        monthFilter.innerHTML = '<option value="">All Months</option>' +
            yearMonths.map(yearMonth => {
                const [year, month] = yearMonth.split('-');
                const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                return `<option value="${yearMonth}">${monthName}</option>`;
            }).join('');
    }

    filterHistory() {
        const exerciseFilter = document.getElementById('exercise-filter').value;
        const yearFilter = document.getElementById('year-filter').value;
        const monthFilter = document.getElementById('month-filter').value;

        let filteredWorkouts = [...this.workouts];

        if (exerciseFilter) {
            filteredWorkouts = filteredWorkouts.filter(w => w.exerciseId === exerciseFilter);
        }

        if (yearFilter) {
            filteredWorkouts = filteredWorkouts.filter(w => w.date.startsWith(yearFilter));
        }

        if (monthFilter) {
            filteredWorkouts = filteredWorkouts.filter(w => w.date.startsWith(monthFilter));
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

        // Re-attach event listeners after HTML update
        this.attachHistoryEventListeners();
    }

        attachHistoryEventListeners() {
        // Add small delay to ensure DOM is fully rendered
        setTimeout(() => {
            const editBtns = document.querySelectorAll('.edit-workout-btn');
            const deleteBtns = document.querySelectorAll('.delete-workout-btn');

            console.log(`Found ${editBtns.length} edit buttons and ${deleteBtns.length} delete buttons`);

            editBtns.forEach((btn, index) => {
                if (btn) { // Check if button exists
                    const workoutId = btn.getAttribute('data-workout-id');
                    console.log(`Attaching listener to edit button ${index}, workout ID: ${workoutId}`);

                    btn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Edit button clicked via onclick! Workout ID:', workoutId);
                        this.editWorkout(workoutId);
                    };
                }
            });

            deleteBtns.forEach((btn, index) => {
                if (btn) { // Check if button exists
                    const workoutId = btn.getAttribute('data-workout-id');
                    console.log(`Attaching listener to delete button ${index}, workout ID: ${workoutId}`);

                    btn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Delete button clicked via onclick! Workout ID:', workoutId);
                        this.deleteWorkout(workoutId);
                    };
                }
            });
        }, 100);
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
        if (activeSection && activeSection.firstChild) {
            activeSection.insertBefore(message, activeSection.firstChild);
        } else {
            // Fallback: append to body if no active section found
            document.body.appendChild(message);
        }

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 3000);
    }

    // Secure GitHub Backup System (Server-side)
    async checkAutoBackup() {
        // Check if backup is configured server-side
        try {
            const statusResponse = await fetch('/api/backup-status');
            const status = await statusResponse.json();

            if (!status.configured) {
                console.log('Backup not configured on server:', status.message);
                return;
            }

            // Auto-backup logic based on localStorage timestamp
            const now = new Date();
            const shouldBackup = !this.lastBackupTime ||
                               (now - this.lastBackupTime) > this.backupInterval;

            if (shouldBackup) {
                try {
                    await this.backupToGitHub();
                    this.showMessage('Data automatically backed up to GitHub', 'success');
                } catch (error) {
                    console.error('Auto-backup failed:', error);
                    this.showMessage('Auto-backup failed - server error', 'error');
                }
            }
        } catch (error) {
            console.error('Could not check backup status:', error);
        }
    }

    async backupToGitHub() {
        const backupData = {
            exercises: this.exercises,
            workouts: this.workouts
        };

        const response = await fetch('/api/backup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(backupData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Backup failed');
        }

        const result = await response.json();

        this.lastBackupTime = new Date(result.backupDate);
        localStorage.setItem('strengthlog-last-backup', this.lastBackupTime.toISOString());

        return result;
    }

    async restoreFromGitHub() {
        const response = await fetch('/api/backup');

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Restore failed');
        }

        const result = await response.json();
        const backupData = result.data;

        // Smart merge instead of overwrite
        const mergedData = this.mergeBackupData(backupData);

        this.exercises = mergedData.exercises;
        this.workouts = mergedData.workouts;
        this.saveData();

        // Update UI
        this.renderExercises();
        this.renderHistory();
        this.updateWorkoutSelectors();

        return result.backupDate;
    }

    // 🧠 Smart merge logic to prevent data loss
    mergeBackupData(backupData) {
        const localExercises = this.exercises || [];
        const localWorkouts = this.workouts || [];
        const backupExercises = backupData.exercises || [];
        const backupWorkouts = backupData.workouts || [];

        // Merge exercises (prevent duplicates by name)
        const mergedExercises = [...localExercises];
        backupExercises.forEach(backupExercise => {
            const exists = localExercises.find(local =>
                local.name.toLowerCase() === backupExercise.name.toLowerCase()
            );
            if (!exists) {
                mergedExercises.push(backupExercise);
            }
        });

        // Merge workouts (prevent duplicates by ID, keep newer timestamps)
        const mergedWorkouts = [...localWorkouts];
        backupWorkouts.forEach(backupWorkout => {
            const existingIndex = localWorkouts.findIndex(local => local.id === backupWorkout.id);

            if (existingIndex === -1) {
                // New workout, add it
                mergedWorkouts.push(backupWorkout);
            } else {
                // Workout exists, keep the newer one based on dateCreated
                const localDate = new Date(localWorkouts[existingIndex].dateCreated);
                const backupDate = new Date(backupWorkout.dateCreated);

                if (backupDate > localDate) {
                    mergedWorkouts[existingIndex] = backupWorkout;
                }
                // Otherwise keep local version (it's newer)
            }
        });

        return {
            exercises: mergedExercises,
            workouts: mergedWorkouts
        };
    }

    async getBackupStatus() {
        try {
            const response = await fetch('/api/backup-status');
            if (!response.ok) {
                return { status: 'error', message: 'Cannot connect to backup service' };
            }

            const serverStatus = await response.json();

            if (!serverStatus.configured) {
                return { status: 'disabled', message: serverStatus.message };
            }

            if (!this.lastBackupTime) {
                return { status: 'pending', message: 'No backup yet' };
            }

            const timeSinceBackup = new Date() - this.lastBackupTime;
            const hours = Math.floor(timeSinceBackup / (1000 * 60 * 60));

            if (hours < 24) {
                return { status: 'success', message: `Last backup: ${hours}h ago` };
            } else {
                return { status: 'warning', message: `Last backup: ${Math.floor(hours/24)}d ago` };
            }
        } catch (error) {
            return { status: 'error', message: 'Cannot connect to backup service' };
        }
    }



    // GitHub Settings UI Management (Server-side)
    updateGitHubSettingsUI() {
        // Hide the manual configuration form since backup is now server-managed
        const githubSettings = document.querySelector('.github-settings');
        if (githubSettings) {
            githubSettings.style.display = 'none';
        }

        // Update save button to show it's server-managed
        const saveBtn = document.getElementById('save-github-settings-btn');
        if (saveBtn) {
            saveBtn.textContent = 'Server Managed';
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.6';
        }

        // Show server-managed message
        const serverManagedDiv = document.createElement('div');
        serverManagedDiv.className = 'server-managed-notice';
        serverManagedDiv.innerHTML = `
            <div class="info-box">
                <h4>🔒 Secure Server-Side Backup</h4>
                <p>GitHub backup is now securely managed on the server. Your GitHub token is safely stored as an environment variable and never exposed to the browser.</p>
                <p>Contact your administrator to configure GitHub backup settings.</p>
            </div>
        `;

                // Insert after the GitHub settings header
        const githubHeader = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes('GitHub Backup'));
        if (githubHeader && !document.querySelector('.server-managed-notice')) {
            githubHeader.parentNode.insertBefore(serverManagedDiv, githubSettings);
        }
    }

    async updateBackupStatus() {
        const statusDiv = document.getElementById('backup-status');
        const status = await this.getBackupStatus();

        const statusClass = {
            'disabled': 'status-disabled',
            'error': 'status-error',
            'pending': 'status-pending',
            'success': 'status-success',
            'warning': 'status-warning'
        }[status.status] || 'status-disabled';

        statusDiv.innerHTML = `
            <div class="backup-status-indicator ${statusClass}">
                <span class="status-dot"></span>
                <span class="status-text">${status.message}</span>
            </div>
        `;
    }

    async saveGitHubSettings() {
        // Since GitHub settings are now server-managed, this method is disabled
        this.showMessage('GitHub backup is now managed securely on the server', 'info');
    }

    async manualBackup() {
        // Check if backup is configured on server
        try {
            const statusResponse = await fetch('/api/backup-status');
            const status = await statusResponse.json();

            if (!status.configured) {
                this.showMessage('GitHub backup not configured on server', 'error');
                return;
            }
        } catch (error) {
            this.showMessage('Cannot connect to backup service', 'error');
            return;
        }

        const backupBtn = document.getElementById('backup-now-btn');
        backupBtn.disabled = true;
        backupBtn.textContent = 'Backing up...';

        try {
            await this.backupToGitHub();
            this.showMessage('Manual backup completed successfully!', 'success');
            this.updateBackupStatus();
        } catch (error) {
            console.error('Manual backup failed:', error);
            this.showMessage(`Backup failed: ${error.message}`, 'error');
        } finally {
            backupBtn.disabled = false;
            backupBtn.textContent = 'Backup Now';
        }
    }

        async manualRestore() {
        // Check if backup is configured on server
        try {
            const statusResponse = await fetch('/api/backup-status');
            const status = await statusResponse.json();

            if (!status.configured) {
                this.showMessage('GitHub backup not configured on server', 'error');
                return;
            }
        } catch (error) {
            this.showMessage('Cannot connect to backup service', 'error');
            return;
        }

        // Smart restore with merge option
        const hasLocalData = this.exercises.length > 0 || this.workouts.length > 0;

        let confirmed = false;
        if (hasLocalData) {
            confirmed = confirm(
                '🔄 SMART MERGE MODE\n\n' +
                'This will intelligently merge your local data with the backup:\n' +
                '• Keeps all unique workouts from both devices\n' +
                '• Prevents duplicates\n' +
                '• Preserves newest version of any conflicts\n\n' +
                'Continue with smart merge?'
            );
        } else {
            confirmed = confirm('This will restore data from your GitHub backup. Continue?');
        }

        if (!confirmed) return;

        const restoreBtn = document.getElementById('restore-backup-btn');
        restoreBtn.disabled = true;
        restoreBtn.textContent = hasLocalData ? 'Merging...' : 'Restoring...';

        try {
            const backupDate = await this.restoreFromGitHub();

            if (hasLocalData) {
                this.showMessage(
                    `✅ Smart merge completed! Combined data from backup (${new Date(backupDate).toLocaleDateString()}) with your local workouts.`,
                    'success'
                );
            } else {
                this.showMessage(`Data restored from backup created on ${new Date(backupDate).toLocaleDateString()}`, 'success');
            }
        } catch (error) {
            console.error('Restore failed:', error);
            this.showMessage(`Restore failed: ${error.message}`, 'error');
        } finally {
            restoreBtn.disabled = false;
            restoreBtn.textContent = 'Smart Sync';
        }
    }
}

// Initialize the application
const app = new StrengthLog();