// Chart and graph management
class Chart {
    constructor() {
        this.chartInstance = null;
        // Event listeners are handled by the shared data controller
    }

    loadGraph() {
        const canvas = document.getElementById('sleepChart');
        const lang = window.language.translations[window.language.currentLang];
        
        if (!canvas) return;
        
        const chartContainer = canvas.parentElement;
        
        if (!window.firestoreDB || !window.auth.currentUser) {
            canvas.style.display = 'none';
            const noConnectionMsg = document.createElement('div');
            noConnectionMsg.className = 'text-center py-8 text-gray-600';
            noConnectionMsg.textContent = lang.noConnection;
            chartContainer.appendChild(noConnectionMsg);
            return;
        }
        
        // Show loading message
        canvas.style.display = 'none';
        const loadingDiv = chartContainer.querySelector('.text-center') || document.createElement('div');
        loadingDiv.className = 'text-center py-8 text-gray-600';
        loadingDiv.textContent = lang.loading;
        if (!chartContainer.querySelector('.text-center')) {
            chartContainer.appendChild(loadingDiv);
        }
        
        const ctx = canvas.getContext('2d');
        // Clear previous chart if exists
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
        
        // Load real data
        this.loadGraphData().then(data => {
            if (data.labels.length === 0) {
                // Hide canvas and show no data message
                canvas.style.display = 'none';
                loadingDiv.textContent = lang.noData;
                return;
            }
            
            // Show canvas and hide message
            canvas.style.display = 'block';
            loadingDiv.remove();
            
            this.chartInstance = new window.Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: window.language.currentLang === 'es' ? 'Horas dormidas por día' : 'Hours slept per day',
                        data: data.durations,
                        backgroundColor: 'rgba(54, 162, 235, 0.8)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: window.language.currentLang === 'es' ? 'Horas' : 'Hours'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: window.language.currentLang === 'es' ? 'Fecha' : 'Date'
                            }
                        }
                    },                        plugins: {
                            title: {
                                display: true,
                                text: window.language.currentLang === 'es' ? 'Horas dormidas por día' : 'Hours slept per day'
                            }
                        }
                }
            });
        }).catch(error => {
            // Hide canvas and show error message
            canvas.style.display = 'none';
            loadingDiv.className = 'text-center py-8 text-red-600';
            loadingDiv.textContent = `Error: ${error.message}`;
        });
    }

    async loadGraphData() {
        const fromDate = document.getElementById('sharedFromDate').value;
        const toDate = document.getElementById('sharedToDate').value;
        
        let query = window.auth.getUserCollection('sleepRecords')
            .orderBy('date', 'asc');
        
        if (fromDate && toDate) {
            query = query.where('date', '>=', fromDate)
                       .where('date', '<=', toDate);
        }
        
        const snapshot = await query.get();
        
        const dailyHours = new Map(); // Group by date and sum hours
        
        snapshot.forEach(doc => {
            const data = doc.data();
            
            // Double-check user ownership for extra security
            if (data.userId && data.userId !== window.auth.currentUser.uid) {
                console.warn('Data belongs to different user, skipping');
                return;
            }
            
            const start = new Date(`1970-01-01T${data.start}`);
            const end = new Date(`1970-01-01T${data.end}`);
            const duration = (end - start) / (1000 * 60 * 60); // hours
            
            const date = data.date;
            if (dailyHours.has(date)) {
                dailyHours.set(date, dailyHours.get(date) + duration);
            } else {
                dailyHours.set(date, duration);
            }
        });
        
        // Convert to arrays and sort by date
        const sortedEntries = Array.from(dailyHours.entries()).sort((a, b) => new Date(a[0]) - new Date(b[0]));
        
        const labels = sortedEntries.map(entry => entry[0]);
        const durations = sortedEntries.map(entry => Math.round(entry[1] * 100) / 100); // round to 2 decimals
        
        return { labels, durations };
    }
}

// Initialize chart manager
window.chart = new Chart();
