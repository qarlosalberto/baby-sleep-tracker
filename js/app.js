// Main application initialization
class App {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Initialize everything when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            // Set initial status
            window.firebaseConfig.updateConnectionStatus(false, 'Initializing...');
            
            // Initialize language first
            window.language.initialize();
            
            // Set default values
            window.utils.setDefaultValues();
            
            // Load Firebase configuration
            window.firebaseConfig.loadSavedConfig();
            
            // Initialize all event listeners
            this.initEventListeners();
            
            // Default to Config tab if no user is authenticated
            if (!window.auth || !window.auth.currentUser) {
                // Switch to config tab by default
                document.querySelector('[data-tab="config"]').click();
            }
            
            // Auto-load data if Firebase is already configured and user is authenticated
            setTimeout(() => {
                if (window.firestoreDB && window.auth && window.auth.currentUser) {
                    window.napCalculator.calcularProximaSiestaPonderada();
                    // Data for history and chart will be loaded when those tabs are accessed
                }
            }, 500);
        });
    }

    initEventListeners() {
        // Initialize all component event listeners
        window.firebaseConfig.initEventListeners();
        window.auth.initEventListeners();
        window.language.initEventListeners();
        // Note: sleepForm, history, and chart initialize their own listeners in their constructors
    }
}

// Initialize the application
window.app = new App();
