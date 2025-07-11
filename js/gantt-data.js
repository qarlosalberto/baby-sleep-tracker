// Gantt chart data generator for sleep intervals (transposed: Y=hours, X=days, apilado por siestas)
window.sleepHistory.getHistoryForGantt = async function(fromDate, toDate) {
    let query = window.auth.getUserCollection('sleepRecords').orderBy('date', 'asc');
    let opts = arguments[2] || {};
    if (fromDate && toDate) {
        query = query.where('date', '>=', fromDate).where('date', '<=', toDate);
    }
    const snapshot = await query.get();
    // Group naps by date
    const napsByDate = {};
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.userId && data.userId !== window.auth.currentUser.uid) return;
        if (!napsByDate[data.date]) napsByDate[data.date] = [];
        napsByDate[data.date].push({
            start: data.start,
            end: data.end,
            type: data.type || 'siesta',
        });
    });
    const dayKeys = Object.keys(napsByDate).sort();
    if (opts.raw) {
        // Formato para gráfico vertical personalizado (PDF y tab):
        // days: array de fechas, naps: array de { dayIndex, startHour, endHour, color }
        const naps = [];
        const colors = ['#7e5bef', '#3b82f6', '#10b981', '#fbbf24', '#ef4444', '#6366f1', '#06b6d4', '#f472b6'];
        dayKeys.forEach((date, dayIdx) => {
            napsByDate[date].forEach((nap, napIdx) => {
                const startParts = nap.start.split(":");
                const endParts = nap.end.split(":");
                let startHour = parseInt(startParts[0]) + parseInt(startParts[1])/60;
                let endHour = parseInt(endParts[0]) + parseInt(endParts[1])/60;
                if (endHour < startHour) endHour += 24;
                naps.push({
                    dayIndex: dayIdx,
                    startHour,
                    endHour,
                    color: colors[(dayIdx + napIdx) % colors.length]
                });
            });
        });
        return { days: dayKeys, naps };
    } else {
        // Chart.js apilado (antiguo)
        const hourLabels = Array.from({length: 13}, (_, i) => {
            const h = i * 2;
            return (h < 10 ? '0' : '') + h + ':00';
        });
        const datasets = [];
        const colors = ['#7e5bef', '#3b82f6', '#10b981', '#fbbf24', '#ef4444', '#6366f1', '#06b6d4', '#f472b6'];
        dayKeys.forEach((date, dayIdx) => {
            napsByDate[date].forEach((nap, napIdx) => {
                const startParts = nap.start.split(":");
                const endParts = nap.end.split(":");
                let startHour = parseInt(startParts[0]) + parseInt(startParts[1])/60;
                let endHour = parseInt(endParts[0]) + parseInt(endParts[1])/60;
                if (endHour < startHour) endHour += 24;
                const dataArr = Array(hourLabels.length - 1).fill(null);
                for (let i = 0; i < hourLabels.length - 1; i++) {
                    const slotStart = i * 2;
                    const slotEnd = (i + 1) * 2;
                    const overlap = Math.max(0, Math.min(endHour, slotEnd) - Math.max(startHour, slotStart));
                    if (overlap > 0) {
                        dataArr[i] = overlap;
                    }
                }
                datasets.push({
                    label: `${date} ${nap.start}-${nap.end}`,
                    data: dataArr,
                    backgroundColor: colors[(dayIdx + napIdx) % colors.length],
                    borderWidth: 1,
                    stack: date,
                    barPercentage: 0.9,
                    categoryPercentage: 0.9
                });
            });
        });
        return { labels: hourLabels.slice(0, -1), datasets };
    }
};
