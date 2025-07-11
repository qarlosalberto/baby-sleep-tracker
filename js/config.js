// Firebase configuration management
class FirebaseConfig {
    constructor() {
        this.defaultConfig = {
            "apiKey": "AIzaSyCVSLDNktqvmm-gjl0P1BTjJrUpq1bmXDo",
            "authDomain": "baby-sleep-tracker-725d1.firebaseapp.com",
            "projectId": "baby-sleep-tracker-725d1",
            "storageBucket": "baby-sleep-tracker-725d1.firebasestorage.app",
            "messagingSenderId": "451610840660",
            "appId": "1:451610840660:web:a4c3266cc8dd4ca37927c1"
        };
    }

    loadSavedConfig() {
        const savedConfig = localStorage.getItem('firebaseConfig');
        let configToUse = savedConfig ? savedConfig : JSON.stringify(this.defaultConfig, null, 2);
        
        document.getElementById('firebaseConfig').value = configToUse;
        
        try {
            const config = JSON.parse(configToUse);
            if (firebase.apps.length === 0) {
                firebase.initializeApp(config);
                window.firestoreDB = firebase.firestore();
                
                // Test the connection by attempting to get settings
                window.firestoreDB.enableNetwork().then(() => {
                    console.log('Firebase connection successful');
                    this.updateConnectionStatus(true);
                    window.auth.initializeAuth();
                }).catch((err) => {
                    console.error('Firebase connection failed:', err);
                    this.updateConnectionStatus(false, err.message);
                });
                
                // Save default config if none was saved
                if (!savedConfig) {
                    localStorage.setItem('firebaseConfig', configToUse);
                }
            } else {
                this.updateConnectionStatus(true);
                window.auth.initializeAuth();
            }
        } catch (err) {
            console.error('Error loading config:', err);
            this.updateConnectionStatus(false, err.message);
        }
    }

    updateConnectionStatus(connected, errorMessage = '') {
        const statusElement = document.getElementById('connectionStatus');
        if (!statusElement) return;
        
        if (connected) {
            statusElement.textContent = window.language.currentLang === 'es' ? '✅ Conectado' : '✅ Connected';
            statusElement.className = 'text-sm px-2 py-1 rounded bg-green-100 text-green-800';
        } else {
            statusElement.textContent = window.language.currentLang === 'es' ? '❌ Desconectado' : '❌ Disconnected';
            statusElement.className = 'text-sm px-2 py-1 rounded bg-red-100 text-red-800';
            if (errorMessage) {
                statusElement.title = errorMessage;
            }
        }
    }

    saveConfig() {
        const saveMsg = document.getElementById('saveMessage');
        saveMsg.textContent = '';
        try {
            const configText = document.getElementById('firebaseConfig').value;
            const config = JSON.parse(configText);
            
            // Initialize Firebase with Auth
            if (firebase.apps.length === 0) {
                firebase.initializeApp(config);
                window.firestoreDB = firebase.firestore();
                
                // Test connection and then initialize auth
                window.firestoreDB.enableNetwork().then(() => {
                    console.log('Firebase connection successful');
                    this.updateConnectionStatus(true);
                    window.auth.initializeAuth();
                }).catch((err) => {
                    console.error('Firebase connection failed:', err);
                    this.updateConnectionStatus(false, err.message);
                });
            } else {
                this.updateConnectionStatus(true);
            }
            
            localStorage.setItem('firebaseConfig', configText);
            
            saveMsg.textContent = window.language.translations[window.language.currentLang].configSaved;
            saveMsg.classList.add('text-green-600');
        } catch (err) {
            saveMsg.textContent = '❌ Error: ' + err.message;
            saveMsg.classList.add('text-red-600');
            this.updateConnectionStatus(false, err.message);
        }
    }

    initEventListeners() {
        const saveConfigBtn = document.getElementById('saveConfigBtn');
        if (saveConfigBtn) {
            saveConfigBtn.addEventListener('click', () => this.saveConfig());
        }
    }
}

// Initialize Firebase config manager
window.firebaseConfig = new FirebaseConfig();
