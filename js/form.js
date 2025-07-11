// Sleep data form management
class SleepForm {
    constructor() {
        this.form = document.getElementById('sleepForm');
        this.initEventListeners();
    }

    initEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Birth date change handler (user-specific)
        const birthDateInput = document.getElementById('birthDate');
        birthDateInput.addEventListener('change', () => {
            if (window.auth && window.auth.currentUser) {
                localStorage.setItem(`babyBirthDate_${window.auth.currentUser.uid}`, birthDateInput.value);
                window.napCalculator.calcularProximaSiestaPonderada();
            }
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        const formMsg = document.getElementById('formMessage');
        formMsg.textContent = '';
        formMsg.className = 'text-sm mt-2'; // Reset classes
        
        try {
            window.auth.validateUserAuth();
            
            const birthDate = document.getElementById('birthDate').value;
            const date = document.getElementById('napDate').value;
            const start = document.getElementById('napStart').value;
            const end = document.getElementById('napEnd').value;
            
            // Save birth date to user-specific storage
            localStorage.setItem(`babyBirthDate_${window.auth.currentUser.uid}`, birthDate);
            
            // Calculate age in weeks
            const birthDateTime = new Date(birthDate);
            const napDateTime = new Date(date);
            const ageInDays = Math.floor((napDateTime - birthDateTime) / (1000 * 60 * 60 * 24));
            const ageInWeeks = Math.floor(ageInDays / 7);
            
            if (new Date(`1970-01-01T${end}`) <= new Date(`1970-01-01T${start}`)) {
                throw new Error(window.language.translations[window.language.currentLang].timeError);
            }
            const commentsVal = document.getElementById('comments').value;
            const good = document.getElementById('goodWake').checked;
            
            // Save to user's collection with explicit user verification
            const recordData = { 
                birthDate, 
                date, 
                start, 
                end, 
                comments: commentsVal, 
                goodWake: good, 
                ageInWeeks,
                timestamp: new Date(),
                userId: window.auth.currentUser.uid // Explicit user ID for double verification
            };
            
            await window.auth.getUserCollection('sleepRecords').add(recordData);
            
            formMsg.textContent = window.language.translations[window.language.currentLang].dataSaved;
            formMsg.classList.add('text-green-600');
            this.form.reset();
            window.utils.setDefaultValues();
            window.napCalculator.calcularProximaSiestaPonderada();
            window.sleepHistory.loadHistorico();
            window.chart.loadGraph();
        } catch (err) {
            console.error('Error saving sleep record:', err);
            formMsg.textContent = '❌ ' + err.message;
            formMsg.classList.add('text-red-600');
        }
    }
}

// Initialize sleep form manager
window.sleepForm = new SleepForm();
