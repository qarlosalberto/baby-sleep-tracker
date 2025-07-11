// History and data management
class History {
    constructor() {
        // Event listeners are handled by the shared data controller
    }

    async loadHistorico() {
        const contentHist = document.getElementById('contentHist');
        const lang = window.language.translations[window.language.currentLang];
        
        try {
            window.auth.validateUserAuth();
            
            contentHist.innerHTML = `<div class="text-center py-8 text-gray-600">${lang.loading}</div>`;
            
            const fromDate = document.getElementById('sharedFromDate').value;
            const toDate = document.getElementById('sharedToDate').value;
            
            let query = window.auth.getUserCollection('sleepRecords')
                .orderBy('timestamp', 'desc');
            
            if (fromDate && toDate) {
                const fromTimestamp = new Date(`${fromDate}T00:00:00`);
                const toTimestamp = new Date(`${toDate}T23:59:59`);
                query = query.where('timestamp', '>=', fromTimestamp)
                             .where('timestamp', '<=', toTimestamp);
            }
            
            const snapshot = await query.limit(50).get();
            
            if (snapshot.empty) {
                contentHist.innerHTML = `<div class="text-center py-8 text-gray-600">${lang.noData}</div>`;
                return;
            }
            
            // Create table with headers
            let html = `
                <div class="overflow-x-auto">
                    <table class="min-w-full bg-white border border-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">${lang.historyTableHeaders.date}</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">${lang.historyTableHeaders.time}</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">${lang.historyTableHeaders.duration}</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">${lang.historyTableHeaders.ageWeeks}</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">${lang.historyTableHeaders.goodWake}</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">${lang.historyTableHeaders.comments}</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">${lang.historyTableHeaders.actions}</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
            `;
            
            snapshot.forEach(doc => {
                const data = doc.data();
                
                // Double-check user ownership for extra security
                if (data.userId && data.userId !== window.auth.currentUser.uid) {
                    console.warn('Data belongs to different user, skipping');
                    return;
                }
                
                const start = new Date(`1970-01-01T${data.start}`);
                const end = new Date(`1970-01-01T${data.end}`);
                const duration = Math.round((end - start) / (1000 * 60)); // minutes
                const hours = Math.floor(duration / 60);
                const mins = duration % 60;
                
                // Calculate age if birth date is available
                let ageText = data.ageInWeeks ? `${data.ageInWeeks}` : '-';
                if (!data.ageInWeeks && data.birthDate) {
                    const birthDateTime = new Date(data.birthDate);
                    const napDateTime = new Date(data.date);
                    const ageInDays = Math.floor((napDateTime - birthDateTime) / (1000 * 60 * 60 * 24));
                    const ageInWeeks = Math.floor(ageInDays / 7);
                    ageText = `${ageInWeeks}`;
                }
                
                const goodWakeText = data.goodWake ? lang.wokeUpWell : lang.wokeUpBad;
                const goodWakeClass = data.goodWake ? 'text-green-600' : 'text-red-600';
                
                html += `
                    <tr class="hover:bg-gray-50">
                        <td class="px-3 py-2 text-sm font-medium text-gray-900">${data.date}</td>
                        <td class="px-3 py-2 text-sm text-gray-700">${data.start} - ${data.end}</td>
                        <td class="px-3 py-2 text-sm text-gray-700">${hours}h ${mins}m</td>
                        <td class="px-3 py-2 text-sm text-gray-700">${ageText}</td>
                        <td class="px-3 py-2 text-sm ${goodWakeClass}">${goodWakeText}</td>
                        <td class="px-3 py-2 text-sm text-gray-600">${data.comments || '-'}</td>
                        <td class="px-3 py-2 text-sm">
                            <button onclick="window.sleepHistory.deleteRecord('${doc.id}')" 
                                class="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-300 rounded hover:bg-red-50 transition"
                                title="${lang.deleteRecord}">
                                🗑️ ${lang.delete}
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
            
            contentHist.innerHTML = html;
        } catch (error) {
            console.error('Error loading history:', error);
            contentHist.innerHTML = `<div class="text-center py-8 text-red-600">Error: ${error.message}</div>`;
        }
    }

    // Delete record function with security validation
    async deleteRecord(docId) {
        const lang = window.language.translations[window.language.currentLang];
        
        if (!confirm(lang.confirmDelete)) {
            return;
        }
        
        try {
            window.auth.validateUserAuth();
            
            // First verify the record belongs to the current user
            const doc = await window.auth.getUserCollection('sleepRecords').doc(docId).get();
            
            if (!doc.exists) {
                throw new Error(lang.recordNotFound || 'Record not found');
            }
            
            const data = doc.data();
            if (data.userId && data.userId !== window.auth.currentUser.uid) {
                throw new Error(lang.accessDenied || 'Access denied');
            }
            
            await window.auth.getUserCollection('sleepRecords').doc(docId).delete();
            
            // Reload data after deletion
            this.loadHistorico();
            window.napCalculator.calcularProximaSiestaPonderada();
            window.chart.loadGraph();
            
            // Show success message temporarily
            const contentHist = document.getElementById('contentHist');
            const tempMessage = document.createElement('div');
            tempMessage.className = 'text-green-600 text-sm mb-2';
            tempMessage.textContent = lang.recordDeleted;
            contentHist.parentNode.insertBefore(tempMessage, contentHist);
            
            setTimeout(() => {
                if (tempMessage.parentNode) {
                    tempMessage.parentNode.removeChild(tempMessage);
                }
            }, 3000);
            
        } catch (error) {
            console.error('Error deleting record:', error);
            alert(`Error: ${error.message}`);
        }
    }
}

// Initialize sleep history manager
window.sleepHistory = new History();
