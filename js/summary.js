// Summary statistics management
class Summary {
    constructor() {
        this.summaryData = null;
    }

    // Calculate statistics from sleep data
    calculateStatistics(sleepData) {
        if (!sleepData || sleepData.length === 0) {
            return this.getEmptyStats();
        }

        // Group data by time periods
        const morningNaps = [];
        const afternoonNaps = [];
        const nightNaps = [];
        const dailyTotals = {};

        sleepData.forEach(nap => {
            try {
                // Usar los mismos campos que history.js
                const startTime = new Date(`2000-01-01T${nap.start}`);
                const endTime = new Date(`2000-01-01T${nap.end}`);

                // Validate dates
                if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                    console.warn('Invalid time format in nap:', nap);
                    return;
                }

                let duration = (endTime - startTime) / (1000 * 60 * 60); // hours

                // Handle cross-midnight scenarios
                if (duration < 0) {
                    duration += 24;
                }

                // Skip unrealistic durations
                if (duration <= 0 || duration > 24) {
                    console.warn('Unrealistic duration in nap:', nap, 'duration:', duration);
                    return;
                }

                const hour = startTime.getHours();
                const date = nap.date;

                // Initialize daily total if not exists
                if (!dailyTotals[date]) {
                    dailyTotals[date] = { hours: 0, naps: 0 };
                }
                dailyTotals[date].hours += duration;
                dailyTotals[date].naps += 1;

                // Categorize by time period
                const napData = { ...nap, duration };

                if (hour >= 6 && hour < 12) {
                    morningNaps.push(napData);
                } else if (hour >= 12 && hour < 18) {
                    afternoonNaps.push(napData);
                } else {
                    nightNaps.push(napData);
                }
            } catch (error) {
                console.warn('Error processing nap:', nap, error);
            }
        });

        return {
            morning: this.calculatePeriodStats(morningNaps),
            afternoon: this.calculatePeriodStats(afternoonNaps),
            night: this.calculatePeriodStats(nightNaps),
            daily: this.calculateDailyStats(dailyTotals),
            overall: this.calculateOverallStats(sleepData)
        };
    }

    calculatePeriodStats(naps) {
        if (naps.length === 0) {
            return { avgHours: 0, avgNaps: 0, avgDuration: 0 };
        }

        const totalHours = naps.reduce((sum, nap) => sum + (nap.duration || 0), 0);
        const uniqueDays = new Set(naps.map(nap => nap.date));
        const numDays = uniqueDays.size;
        
        const avgNapsPerDay = numDays > 0 ? naps.length / numDays : 0;
        const avgDuration = naps.length > 0 ? totalHours / naps.length : 0;
        const avgHoursPerDay = numDays > 0 ? totalHours / numDays : 0;

        return {
            avgHours: avgHoursPerDay,
            avgNaps: avgNapsPerDay,
            avgDuration: avgDuration
        };
    }

    calculateDailyStats(dailyTotals) {
        const days = Object.values(dailyTotals);
        if (days.length === 0) {
            return { avgHours: 0, avgNaps: 0 };
        }

        const totalHours = days.reduce((sum, day) => sum + day.hours, 0);
        const totalNaps = days.reduce((sum, day) => sum + day.naps, 0);

        return {
            avgHours: totalHours / days.length,
            avgNaps: totalNaps / days.length
        };
    }

    calculateOverallStats(sleepData) {
        if (sleepData.length === 0) {
            return { avgNapDuration: 0 };
        }

        let totalDuration = 0;
        let validNaps = 0;

        sleepData.forEach(nap => {
            try {
                const startTime = new Date(`2000-01-01T${nap.startTime}`);
                const endTime = new Date(`2000-01-01T${nap.endTime}`);
                
                if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                    return;
                }
                
                let duration = (endTime - startTime) / (1000 * 60 * 60);
                
                if (duration < 0) {
                    duration += 24;
                }
                
                if (duration > 0 && duration <= 24) {
                    totalDuration += duration;
                    validNaps++;
                }
            } catch (error) {
                console.warn('Error calculating duration for nap:', nap, error);
            }
        });

        return {
            avgNapDuration: validNaps > 0 ? totalDuration / validNaps : 0
        };
    }

    getEmptyStats() {
        return {
            morning: { avgHours: 0, avgNaps: 0, avgDuration: 0 },
            afternoon: { avgHours: 0, avgNaps: 0, avgDuration: 0 },
            night: { avgHours: 0, avgNaps: 0, avgDuration: 0 },
            daily: { avgHours: 0, avgNaps: 0 },
            overall: { avgNapDuration: 0 }
        };
    }

    formatHours(hours) {
        if (hours === 0 || !hours || isNaN(hours)) return '-';
        
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        
        if (h === 0) {
            return `${m}m`;
        } else if (m === 0) {
            return `${h}h`;
        } else {
            return `${h}h ${m}m`;
        }
    }

    formatNumber(num, decimals = 1) {
        if (num === 0 || !num || isNaN(num)) return '-';
        return num.toFixed(decimals);
    }

    // Load and display summary statistics
    async loadSummary() {
        if (!window.auth || !window.auth.currentUser) {
            this.displayNoDataMessage();
            return;
        }

        this.showLoading(true);

        try {
            // Get date range from shared controls
            const fromDate = document.getElementById('sharedFromDate').value;
            const toDate = document.getElementById('sharedToDate').value;

            if (!fromDate || !toDate) {
                throw new Error('Please select date range');
            }

            // Query Firestore for sleep data
            const sleepData = [];
            const querySnapshot = await window.firestoreDB
                .collection('users')
                .doc(window.auth.currentUser.uid)
                .collection('sleepRecords')
                .where('date', '>=', fromDate)
                .where('date', '<=', toDate)
                .orderBy('date', 'desc')
                .get();

            querySnapshot.forEach(doc => {
                sleepData.push(doc.data());
            });

            // Calculate and display statistics
            this.summaryData = this.calculateStatistics(sleepData);
            this.displaySummary(this.summaryData);

        } catch (error) {
            console.error('Error loading summary:', error);
            this.displayErrorMessage(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    displaySummary(stats) {
        // Morning stats
        document.getElementById('avgMorningHours').textContent = this.formatHours(stats.morning.avgHours);
        document.getElementById('avgMorningNaps').textContent = this.formatNumber(stats.morning.avgNaps);
        document.getElementById('avgMorningDuration').textContent = this.formatHours(stats.morning.avgDuration);

        // Afternoon stats
        document.getElementById('avgAfternoonHours').textContent = this.formatHours(stats.afternoon.avgHours);
        document.getElementById('avgAfternoonNaps').textContent = this.formatNumber(stats.afternoon.avgNaps);
        document.getElementById('avgAfternoonDuration').textContent = this.formatHours(stats.afternoon.avgDuration);

        // Night stats
        document.getElementById('avgNightHours').textContent = this.formatHours(stats.night.avgHours);
        document.getElementById('avgNightNaps').textContent = this.formatNumber(stats.night.avgNaps);
        document.getElementById('avgNightDuration').textContent = this.formatHours(stats.night.avgDuration);

        // Daily stats
        document.getElementById('avgDailyHours').textContent = this.formatHours(stats.daily.avgHours);
        document.getElementById('avgDailyNaps').textContent = this.formatNumber(stats.daily.avgNaps);
        document.getElementById('avgNapDuration').textContent = this.formatHours(stats.overall.avgNapDuration);
    }

    showLoading(show) {
        const loading = document.getElementById('summaryLoading');
        if (loading) {
            loading.classList.toggle('hidden', !show);
        }
    }

    displayNoDataMessage() {
        // Reset all stats to empty
        this.displaySummary(this.getEmptyStats());
    }

    displayErrorMessage(message) {
        console.error('Summary error:', message);
        this.displayNoDataMessage();
    }

    // Get summary data for PDF export
    getSummaryForPDF() {
        return this.summaryData || this.getEmptyStats();
    }
}

// Initialize summary manager
window.summary = new Summary();
