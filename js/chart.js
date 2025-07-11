// Chart and graph management
class Chart {
    constructor() {
        this.chartInstance = null;
        this.ganttInstance = null;
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

            // Colores para cada periodo
            const morningColor = 'rgba(255, 205, 86, 0.85)'; // amarillo
            const afternoonColor = 'rgba(54, 162, 235, 0.85)'; // azul
            const nightColor = 'rgba(153, 102, 255, 0.85)'; // violeta

            // Construir datasets apilados por periodo con los nuevos rangos
            const datasets = [
                {
                    label: window.language.currentLang === 'es' ? 'Mañana (7:00 - 12:00)' : 'Morning (7:00am - 12:00pm)',
                    data: data.morning,
                    backgroundColor: morningColor,
                    stack: 'sleep',
                },
                {
                    label: window.language.currentLang === 'es' ? 'Tarde (12:00 - 20:00)' : 'Afternoon (12:00pm - 8:00pm)',
                    data: data.afternoon,
                    backgroundColor: afternoonColor,
                    stack: 'sleep',
                },
                {
                    label: window.language.currentLang === 'es' ? 'Noche (20:00 - 7:00)' : 'Night (8:00pm - 7:00am)',
                    data: data.night,
                    backgroundColor: nightColor,
                    stack: 'sleep',
                }
            ];

            this.chartInstance = new window.Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: window.language.currentLang === 'es' ? 'Horas dormidas por día' : 'Hours slept per day'
                        },
                        legend: {
                            display: true
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    return `${label}: ${context.parsed.y.toFixed(2)}h`;
                                }
                            }
                        }
                    },
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
        
        // Agrupar por fecha y periodo (noche: 20-7, mañana: 7-12, tarde: 12-20)
        const daily = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.userId && data.userId !== window.auth.currentUser.uid) {
                console.warn('Data belongs to different user, skipping');
                return;
            }
            const date = data.date;
            if (!daily[date]) {
                daily[date] = { morning: 0, afternoon: 0, night: 0 };
            }
            // Calcular periodos
            const start = new Date(`1970-01-01T${data.start}`);
            const end = new Date(`1970-01-01T${data.end}`);
            let s = start.getHours() + start.getMinutes()/60;
            let e = end.getHours() + end.getMinutes()/60;
            if (e < s) e += 24;
            // Fragmentar en periodos
            const addToPeriod = (from, to) => {
                // Noche: 20-7 (de 20:00 a 7:00 del día siguiente)
                if (from < 7) {
                    // Noche (antes de las 7)
                    const seg = Math.min(to, 7) - from;
                    if (seg > 0) daily[date].night += seg;
                    from = 7;
                }
                if (from < 12) {
                    // Mañana
                    const seg = Math.min(to, 12) - from;
                    if (seg > 0) daily[date].morning += seg;
                    from = 12;
                }
                if (from < 20) {
                    // Tarde
                    const seg = Math.min(to, 20) - from;
                    if (seg > 0) daily[date].afternoon += seg;
                    from = 20;
                }
                if (from < 31) {
                    // Noche (después de las 20)
                    const seg = Math.min(to, 31) - from;
                    if (seg > 0) daily[date].night += seg;
                }
            };
            addToPeriod(s, e);
        });
        // Ordenar fechas
        const sortedDates = Object.keys(daily).sort((a, b) => new Date(a) - new Date(b));
        const labels = sortedDates;
        const morning = sortedDates.map(d => Math.round(daily[d].morning * 100) / 100);
        const afternoon = sortedDates.map(d => Math.round(daily[d].afternoon * 100) / 100);
        const night = sortedDates.map(d => Math.round(daily[d].night * 100) / 100);
        return { labels, morning, afternoon, night };
    }

    // Render Gantt chart in the 'Gráfica' tab (transposed: Y=hours, X=days)
    async loadGanttChart() {
        const canvas = document.getElementById('ganttChart');
        const lang = window.language.translations[window.language.currentLang];
        if (!canvas) return;
        const chartContainer = canvas.parentElement;
        // Remove previous chart instance if exists
        if (this.ganttInstance) {
            this.ganttInstance.destroy();
        }
        // Show loading
        canvas.style.display = 'none';
        let loadingDiv = chartContainer.querySelector('.gantt-loading');
        if (!loadingDiv) {
            loadingDiv = document.createElement('div');
            loadingDiv.className = 'gantt-loading text-center py-8 text-gray-600';
            chartContainer.appendChild(loadingDiv);
        }
        loadingDiv.textContent = lang.loading;
        // Load data
        if (window.sleepHistory && typeof window.sleepHistory.getHistoryForGantt === 'function') {
            const fromDate = document.getElementById('sharedFromDate').value;
            const toDate = document.getElementById('sharedToDate').value;
            const ganttData = await window.sleepHistory.getHistoryForGantt(fromDate, toDate, { raw: true });
            if (ganttData && ganttData.days && ganttData.naps && ganttData.days.length > 0 && ganttData.naps.length > 0) {
                // No offset: todas las siestas del mismo día en la misma línea vertical, cada barra en su hora real
                const datasets = [];
                ganttData.naps.forEach((nap, idx) => {
                    const data = Array(ganttData.days.length).fill(null);
                    data[nap.dayIndex] = [nap.startHour, nap.endHour];
                    let color = '';
                    const duration = nap.endHour - nap.startHour;
                    if (duration > 3) {
                        color = 'rgba(255, 99, 132, 0.45)';
                    } else if (duration < 1.5) {
                        color = 'rgba(120, 180, 255, 0.35)';
                    } else if (duration < 2.5) {
                        color = 'rgba(54, 162, 235, 0.55)';
                    } else {
                        color = 'rgba(30, 90, 180, 0.75)';
                    }
                    datasets.push({
                        label: `${ganttData.days[nap.dayIndex]} ${nap.startHour.toFixed(2)}-${nap.endHour.toFixed(2)} (${duration.toFixed(2)}h)`,
                        data,
                        backgroundColor: color,
                        borderWidth: 1,
                        barPercentage: 1.0,
                        categoryPercentage: 1.0,
                        custom: { start: nap.startHour, end: nap.endHour, dayIndex: nap.dayIndex }
                    });
                });
                // Preparar el gráfico tipo "barra flotante vertical" (usando chartjs-plugin-floating-bar)
                canvas.width = Math.max(900, ganttData.days.length * 40);
                canvas.height = 500;
                const ctx = canvas.getContext('2d');
                if (this.ganttInstance) {
                    this.ganttInstance.destroy();
                }
                // Custom legend for color explanation (localized)
                const customLegend = [
                    { color: 'rgba(255, 99, 132, 0.45)', label: lang && lang.legendLongNap ? lang.legendLongNap : (window.language.currentLang === 'es' ? '>3h (rojo claro)' : '>3h (light red)') },
                    { color: 'rgba(30, 90, 180, 0.75)', label: lang && lang.legendIntenseBlue ? lang.legendIntenseBlue : (window.language.currentLang === 'es' ? '2.5-3h (azul intenso)' : '2.5-3h (intense blue)') },
                    { color: 'rgba(54, 162, 235, 0.55)', label: lang && lang.legendMediumBlue ? lang.legendMediumBlue : (window.language.currentLang === 'es' ? '1.5-2.5h (azul medio)' : '1.5-2.5h (medium blue)') },
                    { color: 'rgba(120, 180, 255, 0.35)', label: lang && lang.legendLightBlue ? lang.legendLightBlue : (window.language.currentLang === 'es' ? '<1.5h (azul muy claro)' : '<1.5h (very light blue)') }
                ];
                // Requiere chartjs-plugin-floating-bar
                this.ganttInstance = new window.Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ganttData.days.map(d => {
                            // d es la fecha en formato YYYY-MM-DD
                            const [year, month, day] = d.split('-');
                            return `${day}/${month}`;
                        }),
                        datasets
                    },
                    options: {
                        indexAxis: 'x',
                        responsive: false,
                        animation: false,
                        plugins: {
                            title: {
                                display: true,
                                text: lang && lang.napsChartTitle ? lang.napsChartTitle : (window.language.currentLang === 'es' ? 'Intervalos de sueño (Gantt)' : 'Sleep intervals (Gantt)')
                            },
                            legend: {
                                display: true,
                                position: 'bottom',
                                labels: {
                                    generateLabels: function(chart) {
                                        return customLegend.map(item => ({
                                            text: item.label,
                                            fillStyle: item.color,
                                            strokeStyle: item.color,
                                            lineWidth: 2
                                        }));
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const idx = context.datasetIndex;
                                        const nap = ganttData.naps[idx];
                                        return `${ganttData.days[nap.dayIndex]}: ${nap.startHour.toFixed(2)}-${nap.endHour.toFixed(2)} (${(nap.endHour-nap.startHour).toFixed(2)}h)`;
                                    },
                                    afterLabel: function(context) {
                                        const idx = context.datasetIndex;
                                        const nap = ganttData.naps[idx];
                                        return (lang && lang.napDurationLabel ? lang.napDurationLabel : 'Duración') + ': ' + (nap.endHour-nap.startHour).toFixed(2) + 'h';
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: lang && lang.day ? lang.day : (window.language && window.language.currentLang === 'es' ? 'Día' : 'Day')
                                },
                                stacked: false
                            },
                            y: {
                                min: 0,
                                max: 24,
                                title: {
                                    display: true,
                                    text: window.language && window.language.currentLang === 'es' ? 'Hora del día' : 'Hour of day'
                                },
                                ticks: {
                                    stepSize: 2,
                                    callback: function(value) {
                                        return (value < 10 ? '0' : '') + value + ':00';
                                    }
                                },
                                stacked: false
                            }
                        },
                        barPercentage: 1.0,
                        categoryPercentage: 1.0
                    },
                    plugins: [window['ChartFloatingBar']].filter(Boolean)
                });
                // Add custom legend below the chart (for accessibility, not just Chart.js legend)
                let legendDiv = chartContainer.querySelector('.gantt-legend');
                if (!legendDiv) {
                    legendDiv = document.createElement('div');
                    legendDiv.className = 'gantt-legend flex flex-wrap gap-2 mt-2';
                    chartContainer.appendChild(legendDiv);
                }
                // legendDiv.innerHTML = customLegend.map(item => `<span style="display:inline-flex;align-items:center;margin-right:12px;"><span style="display:inline-block;width:18px;height:12px;background:${item.color};border-radius:2px;margin-right:5px;"></span>${item.label}</span>`).join('');
                canvas.style.display = 'block';
                loadingDiv.remove();
            } else {
                canvas.style.display = 'none';
                loadingDiv.textContent = lang.noData;
            }
        }
    }
}

// Initialize chart manager
window.chart = new Chart();

// Patch tab switching to also load the Gantt chart when needed
const origLoadGraph = Chart.prototype.loadGraph;
Chart.prototype.loadGraph = function() {
    origLoadGraph.call(this);
    this.loadGanttChart();
};
