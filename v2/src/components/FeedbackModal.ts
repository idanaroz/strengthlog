// 📝 Feedback Modal Component - Beta user feedback collection

import { BetaManager, type Feedback, type FeedbackAttachment } from '@core/BetaManager.js';

export class FeedbackModal {
  private modal: HTMLElement | null = null;
  private betaManager: BetaManager;
  private attachments: FeedbackAttachment[] = [];

  constructor(betaManager: BetaManager) {
    this.betaManager = betaManager;
  }

  // 🎨 Show feedback modal
  show(prefillData?: Partial<Feedback>): void {
    if (this.modal) {
      this.hide();
    }

    this.modal = this.createModal(prefillData);
    document.body.appendChild(this.modal);

    // Focus first input
    const firstInput = this.modal.querySelector('input, textarea, select') as HTMLElement;
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }

    // Add escape key handler
    document.addEventListener('keydown', this.handleEscapeKey);
  }

  // 🔒 Hide feedback modal
  hide(): void {
    if (this.modal) {
      document.body.removeChild(this.modal);
      this.modal = null;
      this.attachments = [];
    }

    document.removeEventListener('keydown', this.handleEscapeKey);
  }

  // 🏗️ Create modal HTML
  private createModal(prefillData?: Partial<Feedback>): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'feedback-modal-overlay';
    modal.innerHTML = `
      <div class="feedback-modal">
        <div class="feedback-header">
          <h2>
            <span class="feedback-icon">💭</span>
            Beta Feedback
          </h2>
          <button class="close-btn" id="feedback-close">&times;</button>
        </div>

        <form class="feedback-form" id="feedback-form">
          <!-- Feedback Type -->
          <div class="form-group">
            <label for="feedback-type">Type of Feedback</label>
            <select id="feedback-type" required>
              <option value="">Select feedback type...</option>
              <option value="bug">🐛 Bug Report</option>
              <option value="feature">💡 Feature Request</option>
              <option value="analytics">📊 Analytics Feedback</option>
              <option value="usability">👤 Usability Issue</option>
              <option value="performance">⚡ Performance Issue</option>
            </select>
          </div>

          <!-- Category -->
          <div class="form-group">
            <label for="feedback-category">Category</label>
            <select id="feedback-category" required>
              <option value="">Select category...</option>
              <option value="workout-logging">🏋️ Workout Logging</option>
              <option value="analytics">📈 Progress Analytics</option>
              <option value="exercise-management">💪 Exercise Management</option>
              <option value="data-sync">🔄 Data Sync</option>
              <option value="ui-ux">🎨 User Interface</option>
              <option value="performance">⚡ Performance</option>
              <option value="other">🔧 Other</option>
            </select>
          </div>

          <!-- Title -->
          <div class="form-group">
            <label for="feedback-title">Title</label>
            <input
              type="text"
              id="feedback-title"
              placeholder="Brief summary of your feedback"
              value="${prefillData?.title || ''}"
              required
              maxlength="100"
            >
            <div class="char-counter">
              <span id="title-counter">0</span>/100
            </div>
          </div>

          <!-- Description -->
          <div class="form-group">
            <label for="feedback-description">Description</label>
            <textarea
              id="feedback-description"
              placeholder="Please provide detailed information about your feedback..."
              rows="6"
              required
              maxlength="2000"
            >${prefillData?.description || ''}</textarea>
            <div class="char-counter">
              <span id="description-counter">0</span>/2000
            </div>
          </div>

          <!-- Severity (for bugs) -->
          <div class="form-group severity-group hidden">
            <label for="feedback-severity">Severity</label>
            <div class="severity-options">
              <label class="severity-option">
                <input type="radio" name="severity" value="1">
                <span class="severity-label">1 - Minor</span>
                <small>Cosmetic issue, doesn't affect functionality</small>
              </label>
              <label class="severity-option">
                <input type="radio" name="severity" value="2">
                <span class="severity-label">2 - Low</span>
                <small>Minor functionality issue with workaround</small>
              </label>
              <label class="severity-option">
                <input type="radio" name="severity" value="3" checked>
                <span class="severity-label">3 - Medium</span>
                <small>Noticeable issue affecting user experience</small>
              </label>
              <label class="severity-option">
                <input type="radio" name="severity" value="4">
                <span class="severity-label">4 - High</span>
                <small>Major functionality broken</small>
              </label>
              <label class="severity-option">
                <input type="radio" name="severity" value="5">
                <span class="severity-label">5 - Critical</span>
                <small>App unusable or data loss</small>
              </label>
            </div>
          </div>

          <!-- Steps to Reproduce (for bugs) -->
          <div class="form-group steps-group hidden">
            <label for="feedback-steps">Steps to Reproduce</label>
            <textarea
              id="feedback-steps"
              placeholder="1. Go to...&#10;2. Click on...&#10;3. Expected: ...&#10;4. Actual: ..."
              rows="4"
            ></textarea>
          </div>

          <!-- Expected vs Actual (for bugs) -->
          <div class="bug-details hidden">
            <div class="form-group">
              <label for="expected-behavior">Expected Behavior</label>
              <textarea
                id="expected-behavior"
                placeholder="What should have happened?"
                rows="2"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="actual-behavior">Actual Behavior</label>
              <textarea
                id="actual-behavior"
                placeholder="What actually happened?"
                rows="2"
              ></textarea>
            </div>
          </div>

          <!-- Attachments -->
          <div class="form-group">
            <label>Attachments</label>
            <div class="attachment-section">
              <button type="button" class="attachment-btn" id="screenshot-btn">
                📸 Add Screenshot
              </button>
              <button type="button" class="attachment-btn" id="logs-btn">
                📋 Include Debug Logs
              </button>
              <div class="attachments-list" id="attachments-list"></div>
            </div>
          </div>

          <!-- Tags -->
          <div class="form-group">
            <label for="feedback-tags">Tags (optional)</label>
            <input
              type="text"
              id="feedback-tags"
              placeholder="Add tags separated by commas (e.g., mobile, charts, sync)"
            >
            <small>Tags help us categorize and prioritize feedback</small>
          </div>

          <!-- Contact Permission -->
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="contact-permission" checked>
              <span class="checkmark"></span>
              Allow us to contact you for follow-up questions
            </label>
          </div>

          <!-- Submit Actions -->
          <div class="form-actions">
            <button type="button" class="cancel-btn" id="feedback-cancel">
              Cancel
            </button>
            <button type="submit" class="submit-btn" id="feedback-submit">
              <span class="submit-icon">📤</span>
              Submit Feedback
            </button>
          </div>
        </form>

        <!-- Loading State -->
        <div class="feedback-loading hidden" id="feedback-loading">
          <div class="loading-spinner"></div>
          <p>Submitting your feedback...</p>
        </div>

        <!-- Success State -->
        <div class="feedback-success hidden" id="feedback-success">
          <div class="success-icon">✅</div>
          <h3>Thank you for your feedback!</h3>
          <p>Your feedback has been submitted successfully. We'll review it and get back to you if needed.</p>
          <button class="success-btn" id="feedback-done">Done</button>
        </div>
      </div>
    `;

    this.attachEventListeners(modal);
    return modal;
  }

  // 🎧 Attach event listeners
  private attachEventListeners(modal: HTMLElement): void {
    // Close button
    modal.querySelector('#feedback-close')?.addEventListener('click', () => this.hide());
    modal.querySelector('#feedback-cancel')?.addEventListener('click', () => this.hide());
    modal.querySelector('#feedback-done')?.addEventListener('click', () => this.hide());

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.hide();
    });

    // Form type change
    modal.querySelector('#feedback-type')?.addEventListener('change', (e) => {
      this.handleTypeChange(e.target as HTMLSelectElement);
    });

    // Character counters
    modal.querySelector('#feedback-title')?.addEventListener('input', (e) => {
      this.updateCharCounter(e.target as HTMLInputElement, 'title-counter', 100);
    });

    modal.querySelector('#feedback-description')?.addEventListener('input', (e) => {
      this.updateCharCounter(e.target as HTMLTextAreaElement, 'description-counter', 2000);
    });

    // Attachment buttons
    modal.querySelector('#screenshot-btn')?.addEventListener('click', () => {
      this.addScreenshot();
    });

    modal.querySelector('#logs-btn')?.addEventListener('click', () => {
      this.addDebugLogs();
    });

    // Form submission
    modal.querySelector('#feedback-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit(e.target as HTMLFormElement);
    });
  }

  // 🔄 Handle feedback type change
  private handleTypeChange(select: HTMLSelectElement): void {
    const type = select.value;
    const severityGroup = this.modal?.querySelector('.severity-group');
    const stepsGroup = this.modal?.querySelector('.steps-group');
    const bugDetails = this.modal?.querySelector('.bug-details');

    // Show/hide bug-specific fields
    const showBugFields = type === 'bug';

    severityGroup?.classList.toggle('hidden', !showBugFields);
    stepsGroup?.classList.toggle('hidden', !showBugFields);
    bugDetails?.classList.toggle('hidden', !showBugFields);

    // Update category options based on type
    this.updateCategoryOptions(type);
  }

  // 📂 Update category options based on feedback type
  private updateCategoryOptions(type: string): void {
    const categorySelect = this.modal?.querySelector('#feedback-category') as HTMLSelectElement;
    if (!categorySelect) return;

    const categories: Record<string, string[]> = {
      'bug': [
        'workout-logging:🏋️ Workout Logging',
        'analytics:📈 Progress Analytics',
        'exercise-management:💪 Exercise Management',
        'data-sync:🔄 Data Sync',
        'ui-ux:🎨 User Interface',
        'performance:⚡ Performance'
      ],
      'feature': [
        'workout-logging:🏋️ Workout Features',
        'analytics:📊 Analytics Features',
        'social:👥 Social Features',
        'export:📤 Export/Import',
        'mobile:📱 Mobile Features',
        'other:🔧 Other'
      ],
      'analytics': [
        'charts:📈 Charts & Graphs',
        'metrics:📊 Metrics Calculation',
        'insights:💡 Insights & Recommendations',
        'data-accuracy:🎯 Data Accuracy',
        'visualization:👁️ Data Visualization'
      ],
      'usability': [
        'navigation:🧭 Navigation',
        'forms:📝 Form Usability',
        'mobile:📱 Mobile Experience',
        'accessibility:♿ Accessibility',
        'workflow:🔄 User Workflow'
      ],
      'performance': [
        'loading:⏳ Loading Speed',
        'responsiveness:⚡ UI Responsiveness',
        'memory:🧠 Memory Usage',
        'battery:🔋 Battery Usage',
        'offline:📵 Offline Performance'
      ]
    };

    const options = categories[type] || categories['bug'];

    // Clear existing options (except first)
    while (categorySelect.children.length > 1) {
      categorySelect.removeChild(categorySelect.lastChild!);
    }

    // Add new options
    options.forEach(option => {
      const [value, label] = option.split(':');
      const optionElement = document.createElement('option');
      optionElement.value = value;
      optionElement.textContent = label;
      categorySelect.appendChild(optionElement);
    });
  }

  // 🔤 Update character counter
  private updateCharCounter(input: HTMLInputElement | HTMLTextAreaElement, counterId: string, maxLength: number): void {
    const counter = this.modal?.querySelector(`#${counterId}`);
    if (counter) {
      const length = input.value.length;
      counter.textContent = length.toString();

      // Color coding
      const percentage = length / maxLength;
      if (percentage > 0.9) {
        counter.classList.add('near-limit');
      } else {
        counter.classList.remove('near-limit');
      }
    }
  }

  // 📸 Add screenshot attachment
  private async addScreenshot(): Promise<void> {
    try {
      const screenshot = await this.betaManager.captureScreenshot();
      this.attachments.push(screenshot);
      this.updateAttachmentsList();

      this.showTemporaryMessage('Screenshot captured!', 'success');
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      this.showTemporaryMessage('Screenshot capture failed', 'error');
    }
  }

  // 📋 Add debug logs
  private addDebugLogs(): void {
    const logs = this.getDebugLogs();
    const logAttachment: FeedbackAttachment = {
      id: this.generateId(),
      name: `debug-logs-${Date.now()}.json`,
      type: 'log',
      data: btoa(JSON.stringify(logs, null, 2)),
      size: JSON.stringify(logs).length,
      timestamp: new Date().toISOString()
    };

    this.attachments.push(logAttachment);
    this.updateAttachmentsList();

    this.showTemporaryMessage('Debug logs attached!', 'success');
  }

  // 📎 Update attachments list display
  private updateAttachmentsList(): void {
    const attachmentsList = this.modal?.querySelector('#attachments-list');
    if (!attachmentsList) return;

    attachmentsList.innerHTML = this.attachments.map(attachment => `
      <div class="attachment-item" data-id="${attachment.id}">
        <span class="attachment-icon">${this.getAttachmentIcon(attachment.type)}</span>
        <span class="attachment-name">${attachment.name}</span>
        <span class="attachment-size">${this.formatFileSize(attachment.size)}</span>
        <button type="button" class="remove-attachment" data-id="${attachment.id}">×</button>
      </div>
    `).join('');

    // Add remove handlers
    attachmentsList.querySelectorAll('.remove-attachment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).dataset.id;
        this.removeAttachment(id!);
      });
    });
  }

  // 🗑️ Remove attachment
  private removeAttachment(id: string): void {
    this.attachments = this.attachments.filter(a => a.id !== id);
    this.updateAttachmentsList();
  }

  // 📤 Handle form submission
  private async handleSubmit(form: HTMLFormElement): Promise<void> {
    const formData = new FormData(form);
    const data = this.extractFormData(form);

    // Validate required fields
    if (!data.type || !data.category || !data.title || !data.description) {
      this.showTemporaryMessage('Please fill in all required fields', 'error');
      return;
    }

    // Show loading state
    this.showLoadingState(true);

    try {
      const feedbackId = await this.betaManager.submitFeedback({
        type: data.type as any,
        category: data.category,
        title: data.title,
        description: data.description,
        severity: data.severity as any,
        steps: data.steps ? data.steps.split('\n').filter(s => s.trim()) : undefined,
        expectedBehavior: data.expectedBehavior,
        actualBehavior: data.actualBehavior,
        attachments: this.attachments,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(t => t) : []
      });

      console.log('Feedback submitted:', feedbackId);
      this.showSuccessState();

    } catch (error) {
      console.error('Feedback submission failed:', error);
      this.showTemporaryMessage('Failed to submit feedback. Please try again.', 'error');
      this.showLoadingState(false);
    }
  }

  // 📊 Extract form data
  private extractFormData(form: HTMLFormElement): Record<string, string> {
    const data: Record<string, string> = {};

    // Get all form elements
    const elements = form.querySelectorAll('input, textarea, select');
    elements.forEach(element => {
      const el = element as HTMLInputElement;
      if (el.name === 'severity' && el.checked) {
        data.severity = el.value;
      } else if (el.id && el.value) {
        const key = el.id.replace('feedback-', '').replace('-', '');
        if (key === 'expectedbehavior') data.expectedBehavior = el.value;
        else if (key === 'actualbehavior') data.actualBehavior = el.value;
        else data[key] = el.value;
      }
    });

    return data;
  }

  // 🔄 Show/hide loading state
  private showLoadingState(show: boolean): void {
    const form = this.modal?.querySelector('.feedback-form');
    const loading = this.modal?.querySelector('#feedback-loading');

    form?.classList.toggle('hidden', show);
    loading?.classList.toggle('hidden', !show);
  }

  // ✅ Show success state
  private showSuccessState(): void {
    const form = this.modal?.querySelector('.feedback-form');
    const loading = this.modal?.querySelector('#feedback-loading');
    const success = this.modal?.querySelector('#feedback-success');

    form?.classList.add('hidden');
    loading?.classList.add('hidden');
    success?.classList.remove('hidden');

    // Auto-close after 5 seconds
    setTimeout(() => this.hide(), 5000);
  }

  // 💬 Show temporary message
  private showTemporaryMessage(message: string, type: 'success' | 'error'): void {
    const messageDiv = document.createElement('div');
    messageDiv.className = `feedback-message feedback-message-${type}`;
    messageDiv.textContent = message;

    this.modal?.appendChild(messageDiv);

    setTimeout(() => {
      this.modal?.removeChild(messageDiv);
    }, 3000);
  }

  // 🔧 Utility methods
  private handleEscapeKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.hide();
    }
  };

  private getAttachmentIcon(type: string): string {
    const icons = {
      'screenshot': '📸',
      'log': '📋',
      'video': '🎥',
      'other': '📎'
    };
    return icons[type as keyof typeof icons] || '📎';
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  }

  private getDebugLogs(): any {
    return {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      localStorage: { ...localStorage },
      sessionStorage: { ...sessionStorage },
      errors: JSON.parse(localStorage.getItem('error-logs') || '[]'),
      performance: {
        navigation: performance.getEntriesByType('navigation')[0],
        memory: 'memory' in performance ? (performance as any).memory : null
      }
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}