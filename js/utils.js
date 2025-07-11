// Utility functions and navigation
class Utils {
    constructor() {
        this.initTabNavigation();
    }

    // Function to set default values with user-specific data
    setDefaultValues() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        // 30 días antes
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Current time
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`;

        // 30 minutes ago
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
        const startHours = String(thirtyMinutesAgo.getHours()).padStart(2, '0');
        const startMinutes = String(thirtyMinutesAgo.getMinutes()).padStart(2, '0');
        const startTime = `${startHours}:${startMinutes}`;

        // Set birth date default (load from user-specific localStorage)
        const userKey = window.auth && window.auth.currentUser ? `babyBirthDate_${window.auth.currentUser.uid}` : 'babyBirthDate_guest';
        const savedBirthDate = localStorage.getItem(userKey) || '2025-04-19';
        document.getElementById('birthDate').value = savedBirthDate;

        // Set insert form defaults
        document.getElementById('napDate').value = today;
        document.getElementById('napStart').value = startTime;
        document.getElementById('napEnd').value = currentTime;

        // Set historical dates (30 días antes hasta hoy)
        document.getElementById('sharedFromDate').value = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        document.getElementById('sharedToDate').value = today;
    }

    // Tab navigation by data-tab
    initTabNavigation() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(btn => {
            btn.addEventListener('click', () => {
                // deactivate all
                tabs.forEach(b => {
                    b.classList.remove('border-blue-600', 'text-blue-600');
                    b.classList.add('text-gray-700', 'border-transparent');
                });
                document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
                
                // activate clicked
                btn.classList.remove('text-gray-700', 'border-transparent');
                btn.classList.add('border-blue-600', 'text-blue-600');
                const target = document.getElementById(`tab-${btn.dataset.tab}`);
                if (target) target.classList.remove('hidden');
                
                // Auto-load data when switching to tabs that use shared controls
                const tabsWithSharedData = ['historico', 'grafica', 'sumario'];
                
                if (tabsWithSharedData.includes(btn.dataset.tab)) {
                    // Auto-load data when switching to these tabs
                    setTimeout(() => {
                        window.sharedDataController.autoLoadForTab(btn.dataset.tab);
                    }, 100);
                }
                
                // Show auth required message for protected tabs when not authenticated
                const authRequired = document.getElementById('authRequired');
                const protectedTabs = ['nextSiesta', 'insertar', 'historico', 'grafica', 'sumario'];
                
                if (!window.auth.currentUser && protectedTabs.includes(btn.dataset.tab)) {
                    authRequired.classList.remove('hidden');
                } else {
                    authRequired.classList.add('hidden');
                }
            });
        });
    }
}

// Initialize utilities
window.utils = new Utils();
