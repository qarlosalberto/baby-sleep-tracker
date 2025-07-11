// Nap calculation logic
class NapCalculator {
    async calcularProximaSiestaPonderada() {
        const contentNext = document.getElementById('contentNext');
        const lang = window.language.translations[window.language.currentLang];
        
        try {
            window.auth.validateUserAuth();
            
            contentNext.textContent = lang.calculating;
            
            // Get saved birth date (user-specific)
            const userKey = `babyBirthDate_${window.auth.currentUser.uid}`;
            const savedBirthDate = localStorage.getItem(userKey);
            
            if (!savedBirthDate) {
                contentNext.innerHTML = `
                    <div class="space-y-2">
                        <p class="text-orange-600">${window.language.currentLang === 'es' ? 'Por favor, ingresa la fecha de nacimiento del bebé en la pestaña Insertar' : 'Please enter the baby\'s birth date in the Insert tab'}</p>
                    </div>
                `;
                return;
            }
            
            const birthDateTime = new Date(savedBirthDate);
            const now = new Date();
            const currentAgeInWeeks = Math.floor((now - birthDateTime) / (1000 * 60 * 60 * 24 * 7));
            
            // Get last 10 nap records from user's collection only
            const snapshot = await window.auth.getUserCollection('sleepRecords')
                .orderBy('timestamp', 'desc')
                .limit(10)
                .get();
            
            if (snapshot.empty) {
                contentNext.innerHTML = `
                    <div class="space-y-2">
                        <p class="text-sm text-gray-600">${window.language.currentLang === 'es' ? 'Edad actual' : 'Current age'}: ${currentAgeInWeeks} ${window.language.currentLang === 'es' ? 'semanas' : 'weeks'}</p>
                        <p>${lang.noData}</p>
                    </div>
                `;
                return;
            }
            
            let totalMinutes = 0;
            let count = 0;
            let lastNapTime = null;
            
            snapshot.forEach(doc => {
                const data = doc.data();
                
                // Double-check user ownership for extra security
                if (data.userId && data.userId !== window.auth.currentUser.uid) {
                    console.warn('Data belongs to different user, skipping');
                    return;
                }
                
                const start = new Date(`1970-01-01T${data.start}`);
                const end = new Date(`1970-01-01T${data.end}`);
                const duration = (end - start) / (1000 * 60); // minutes
                
                totalMinutes += duration;
                count++;
                
                if (!lastNapTime) {
                    lastNapTime = new Date(`${data.date}T${data.end}`);
                }
            });
            
            if (count === 0) {
                contentNext.innerHTML = `
                    <div class="space-y-2">
                        <p class="text-sm text-gray-600">${window.language.currentLang === 'es' ? 'Edad actual' : 'Current age'}: ${currentAgeInWeeks} ${window.language.currentLang === 'es' ? 'semanas' : 'weeks'}</p>
                        <p>${lang.noData}</p>
                    </div>
                `;
                return;
            }
            
            const avgDuration = Math.round(totalMinutes / count);
            const avgHours = Math.floor(avgDuration / 60);
            const avgMins = avgDuration % 60;
            
            // Calculate next nap time based on age
            let napInterval = 3.5; // default for older babies
            
            if (currentAgeInWeeks <= 4) {
                napInterval = 1.5; // Newborn: every 1.5 hours
            } else if (currentAgeInWeeks <= 12) {
                napInterval = 2; // 1-3 months: every 2 hours
            } else if (currentAgeInWeeks <= 26) {
                napInterval = 2.5; // 3-6 months: every 2.5 hours
            } else if (currentAgeInWeeks <= 52) {
                napInterval = 3; // 6-12 months: every 3 hours
            }
            
            const nextNapTime = new Date(lastNapTime.getTime() + (napInterval * 60 * 60 * 1000));
            const nextNapFormatted = nextNapTime.toLocaleTimeString(window.language.currentLang === 'es' ? 'es-ES' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Calculate time until next nap
            const timeUntilNap = nextNapTime - now;
            const hoursUntil = Math.floor(timeUntilNap / (1000 * 60 * 60));
            const minutesUntil = Math.floor((timeUntilNap % (1000 * 60 * 60)) / (1000 * 60));
            
            let timeUntilText = '';
            if (timeUntilNap > 0) {
                if (hoursUntil > 0) {
                    timeUntilText = `${hoursUntil}h ${minutesUntil}m`;
                } else {
                    timeUntilText = `${minutesUntil}m`;
                }
                timeUntilText = window.language.currentLang === 'es' ? `en ${timeUntilText}` : `in ${timeUntilText}`;
            } else {
                timeUntilText = window.language.currentLang === 'es' ? '¡Ya es hora!' : 'It\'s time!';
            }
            
            contentNext.innerHTML = `
                <div class="space-y-2">
                    <p class="text-sm text-gray-600">${window.language.currentLang === 'es' ? 'Edad actual' : 'Current age'}: ${currentAgeInWeeks} ${window.language.currentLang === 'es' ? 'semanas' : 'weeks'}</p>
                    <p><strong>${window.language.currentLang === 'es' ? 'Duración promedio' : 'Average duration'}:</strong> ${avgHours}h ${avgMins}m</p>
                    <p><strong>${window.language.currentLang === 'es' ? 'Próxima siesta estimada' : 'Next estimated nap'}:</strong> ${nextNapFormatted} (${timeUntilText})</p>
                    <p class="text-sm text-gray-600">${window.language.currentLang === 'es' ? 'Basado en los últimos 10 registros y edad del bebé' : 'Based on last 10 records and baby\'s age'}</p>
                </div>
            `;
        } catch (error) {
            console.error('Error calculating next nap:', error);
            contentNext.textContent = `Error: ${error.message}`;
        }
    }
}

// Initialize nap calculator
window.napCalculator = new NapCalculator();
