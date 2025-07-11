// Authentication management
class Authentication {
    constructor() {
        this.currentUser = null;
    }

    initializeAuth() {
        if (!firebase.apps.length || !firebase.auth) {
            console.log('Firebase not initialized or Auth not available');
            return;
        }

        firebase.auth().onAuthStateChanged((user) => {
            this.currentUser = user;
            this.updateAuthUI();
            if (user) {
                // User is signed in
                console.log('User signed in:', user.displayName);
                this.showMainContent();
                // Load user data
                setTimeout(() => {
                    window.napCalculator.calcularProximaSiestaPonderada();
                    // History and chart data will be loaded when those tabs are accessed
                }, 500);
            } else {
                // User is signed out
                console.log('User signed out');
                this.hideMainContent();
            }
        });
    }

    updateAuthUI() {
        const loginBtn = document.getElementById('loginBtn');
        const userInfo = document.getElementById('userInfo');
        const authRequired = document.getElementById('authRequired');

        if (this.currentUser) {
            loginBtn.classList.add('hidden');
            userInfo.classList.remove('hidden');
            authRequired.classList.add('hidden');
            
            document.getElementById('userName').textContent = this.currentUser.displayName || this.currentUser.email;
            
            // Show main content
            this.showMainContent();
        } else {
            loginBtn.classList.remove('hidden');
            userInfo.classList.add('hidden');
            
            // Check if current tab is protected
            const activeTab = document.querySelector('.tab-btn.border-blue-600');
            const protectedTabs = ['nextSiesta', 'insertar', 'historico', 'grafica'];
            
            if (activeTab && protectedTabs.includes(activeTab.dataset.tab)) {
                authRequired.classList.remove('hidden');
            } else {
                authRequired.classList.add('hidden');
            }
            
            // Hide main content
            this.hideMainContent();
        }
    }

    showMainContent() {
        document.getElementById('mainContent').classList.remove('hidden');
    }

    hideMainContent() {
        document.getElementById('mainContent').classList.add('hidden');
    }

    async signInWithGoogle() {
        try {
            if (!firebase.apps.length || !firebase.auth) {
                alert(window.language.currentLang === 'es' ? 'Por favor, configura Firebase primero en la pestaña Config' : 'Please configure Firebase first in the Config tab');
                return;
            }
            
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            
            const result = await firebase.auth().signInWithPopup(provider);
            console.log('Sign in successful:', result.user.displayName);
        } catch (error) {
            console.error('Sign in error:', error);
            alert('Error al iniciar sesión: ' + error.message);
        }
    }

    async signOut() {
        try {
            if (!firebase.apps.length || !firebase.auth) {
                console.log('Firebase not available for sign out');
                return;
            }
            await firebase.auth().signOut();
            console.log('Sign out successful');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }

    // Add user validation for all data operations
    validateUserAuth() {
        if (!this.currentUser) {
            throw new Error(window.language.translations[window.language.currentLang]?.userNotAuth || 'User not authenticated');
        }
        if (!window.firestoreDB) {
            throw new Error(window.language.translations[window.language.currentLang]?.noConnection || 'No Firebase connection');
        }
    }

    // Modify data access functions to be user-specific
    getUserCollection(collectionName) {
        this.validateUserAuth();
        return window.firestoreDB.collection('users').doc(this.currentUser.uid).collection(collectionName);
    }

    initEventListeners() {
        // Add auth event listeners
        document.getElementById('loginBtn').addEventListener('click', () => this.signInWithGoogle());
        document.getElementById('logoutBtn').addEventListener('click', () => this.signOut());
    }
}

// Initialize authentication manager
window.auth = new Authentication();
