// Profile management
class ProfileManager {
    constructor() {
        this.profile = null;
        this.init();
    }

    async init() {
        try {
            await this.fetchProfile();
            this.setupEventListeners();
        } catch (error) {
            console.error('Profile initialization error:', error);
            this.showError('Failed to load profile');
        }
    }

    async fetchProfile() {
        try {
            const response = await fetch('/api/profile');
            const data = await response.json();
            
            if (data.success) {
                this.profile = data.user.profile || {};
                this.updateUI();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Profile fetch error:', error);
            this.showError('Failed to load profile');
        }
    }

    async updateProfile(formData) {
        try {
            const response = await fetch('/api/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (data.success) {
                this.profile = data.profile;
                this.updateUI();
                this.showSuccess('Profile updated successfully');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Profile update error:', error);
            this.showError('Failed to update profile');
        }
    }

    updateUI() {
        // Update form fields with current profile data
        const form = document.getElementById('profileForm');
        if (form) {
            Object.keys(this.profile).forEach(key => {
                const input = form.elements[key];
                if (input) {
                    input.value = this.profile[key] || '';
                }
            });
        }
    }

    setupEventListeners() {
        const form = document.getElementById('profileForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                await this.updateProfile(data);
            });
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 5000);
        }
    }
}

// Initialize profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
}); 