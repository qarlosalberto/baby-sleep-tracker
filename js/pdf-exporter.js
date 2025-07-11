// PDF export functionality
class PDFExporter {
    constructor() {
        // Event listeners are handled by the shared data controller
    }

    async exportToPDF() {
        try {
            window.auth.validateUserAuth();
            const lang = window.language.translations[window.language.currentLang];
            const fromDate = document.getElementById('sharedFromDate').value;
            const toDate = document.getElementById('sharedToDate').value;
            // Show loading state
            const exportBtn = document.getElementById('exportPdfBtn');
            const originalText = exportBtn.innerHTML;
            exportBtn.innerHTML = `
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"></path>
                </svg>
                <span>${lang.loading}</span>
            `;
            exportBtn.disabled = true;

            // --- CANVAS TEMPORAL PARA LA GRÁFICA DE BARRAS APILADAS POR PERIODO ---
            let chartImageData = null;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 800;
            tempCanvas.height = 400;
            document.body.appendChild(tempCanvas);
            const tempCtx = tempCanvas.getContext('2d');
            let chartDataForExport = null;
            if (window.chart && typeof window.chart.loadGraphData === 'function') {
                chartDataForExport = await window.chart.loadGraphData();
            }
            if (chartDataForExport && chartDataForExport.labels.length > 0 && window.Chart) {
                // Colores para cada periodo
                const morningColor = 'rgba(255, 205, 86, 0.85)';
                const afternoonColor = 'rgba(54, 162, 235, 0.85)';
                const nightColor = 'rgba(153, 102, 255, 0.85)';
                const datasets = [
                    {
                        label: window.language.currentLang === 'es' ? 'Mañana (7:00 - 12:00)' : 'Morning (7:00am - 12:00pm)',
                        data: chartDataForExport.morning,
                        backgroundColor: morningColor,
                        stack: 'sleep',
                    },
                    {
                        label: window.language.currentLang === 'es' ? 'Tarde (12:00 - 20:00)' : 'Afternoon (12:00pm - 8:00pm)',
                        data: chartDataForExport.afternoon,
                        backgroundColor: afternoonColor,
                        stack: 'sleep',
                    },
                    {
                        label: window.language.currentLang === 'es' ? 'Noche (20:00 - 7:00)' : 'Night (8:00pm - 7:00am)',
                        data: chartDataForExport.night,
                        backgroundColor: nightColor,
                        stack: 'sleep',
                    }
                ];
                const tempChart = new window.Chart(tempCtx, {
                    type: 'bar',
                    data: {
                        labels: chartDataForExport.labels,
                        datasets
                    },
                    options: {
                        responsive: false,
                        animation: false,
                        plugins: {
                            title: {
                                display: true,
                                text: window.language.currentLang === 'es' ? 'Horas dormidas por día' : 'Hours slept per day'
                            },
                            legend: { display: true },
                            tooltip: { enabled: false }
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
                await new Promise(resolve => setTimeout(resolve, 300));
                chartImageData = tempCanvas.toDataURL('image/png', 1.0);
                tempChart.destroy();
            }
            tempCanvas.remove();
            // --- FIN CANVAS TEMPORAL ---

            // --- CANVAS TEMPORAL PARA GRÁFICO DE INTERVALOS (GANTT) ---
            let ganttImageData = null;
            let ganttLegend = null;
            if (window.sleepHistory && typeof window.sleepHistory.getHistoryForGantt === 'function' && window.Chart) {
                const ganttData = await window.sleepHistory.getHistoryForGantt(fromDate, toDate, { raw: true });
                if (ganttData && ganttData.days && ganttData.naps && ganttData.days.length > 0 && ganttData.naps.length > 0) {
                    // Generar datasets igual que en chart.js (barras "floating" verticales, cada nap en su hora real)
                    const datasets = [];
                    ganttData.naps.forEach((nap, idx) => {
                        const data = Array(ganttData.days.length).fill(null);
                        data[nap.dayIndex] = [nap.startHour, nap.endHour];
                        const duration = nap.endHour - nap.startHour;
                        let color = '';
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
                            label: `${ganttData.days[nap.dayIndex]} ${nap.startHour.toFixed(2)}-${nap.endHour.toFixed(2)} (${(nap.endHour-nap.startHour).toFixed(2)}h)`,
                            data,
                            backgroundColor: color,
                            borderWidth: 1,
                            barPercentage: 1.0,
                            categoryPercentage: 1.0
                        });
                    });
                    // Leyenda igual que en chart.js
                    ganttLegend = [
                        { color: 'rgba(255, 99, 132, 0.45)', label: lang && lang.legendLongNap ? lang.legendLongNap : (window.language.currentLang === 'es' ? '>3h' : '>3h (light red)') },
                        { color: 'rgba(30, 90, 180, 0.75)', label: lang && lang.legendIntenseBlue ? lang.legendIntenseBlue : (window.language.currentLang === 'es' ? '2.5-3h' : '2.5-3h') },
                        { color: 'rgba(54, 162, 235, 0.55)', label: lang && lang.legendMediumBlue ? lang.legendMediumBlue : (window.language.currentLang === 'es' ? '1.5-2.5h' : '1.5-2.5h') },
                        { color: 'rgba(120, 180, 255, 0.35)', label: lang && lang.legendLightBlue ? lang.legendLightBlue : (window.language.currentLang === 'es' ? '<1.5h' : '<1.5h') }
                    ];
                    // Crear canvas temporal y renderizar el gráfico
                    const tempGanttCanvas = document.createElement('canvas');
                    tempGanttCanvas.width = Math.max(900, ganttData.days.length * 40);
                    tempGanttCanvas.height = 500;
                    document.body.appendChild(tempGanttCanvas);
                    const tempGanttCtx = tempGanttCanvas.getContext('2d');
                    // Usar chartjs-plugin-floating-bar para barras verticales flotantes (como en UI)
                    const tempGanttChart = new window.Chart(tempGanttCtx, {
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
                                legend: { display: false },
                                tooltip: { enabled: false }
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
                    await new Promise(resolve => setTimeout(resolve, 300));
                    ganttImageData = tempGanttCanvas.toDataURL('image/png', 1.0);
                    tempGanttChart.destroy();
                    tempGanttCanvas.remove();
                }
            }
            // --- FIN CANVAS GANTT ---

            // Get data for PDF
            const { historyData, chartData } = await this.getDataForPDF(fromDate, toDate);
            // Generate summary statistics for PDF inclusion
            if (window.summary && historyData.length > 0) {
                const sleepDataForSummary = historyData.map(record => ({
                    date: record.date,
                    start: record.timeRange.split(' - ')[0],
                    end: record.timeRange.split(' - ')[1]
                }));
                window.summary.summaryData = window.summary.calculateStatistics(sleepDataForSummary);
            }
            // Create PDF, pasando la imagen de la gráfica generada
            await this.generatePDF(historyData, chartData, fromDate, toDate, lang, chartImageData, ganttImageData);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert(`Error: ${error.message}`);
        } finally {
            const exportBtn = document.getElementById('exportPdfBtn');
            exportBtn.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span id="exportPdfText">${window.language.translations[window.language.currentLang].exportPdf}</span>
            `;
            exportBtn.disabled = false;
        }
    }

    async getDataForPDF(fromDate, toDate) {
        let query = window.auth.getUserCollection('sleepRecords')
            .orderBy('timestamp', 'desc');
        
        if (fromDate && toDate) {
            const fromTimestamp = new Date(`${fromDate}T00:00:00`);
            const toTimestamp = new Date(`${toDate}T23:59:59`);
            query = query.where('timestamp', '>=', fromTimestamp)
                         .where('timestamp', '<=', toTimestamp);
        }
        
        const snapshot = await query.get();
        
        const historyData = [];
        const chartLabels = [];
        const chartDurations = [];
        
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
            const durationHours = (end - start) / (1000 * 60 * 60); // hours for chart
            
            // Calculate age if birth date is available
            let ageText = data.ageInWeeks ? `${data.ageInWeeks}` : '-';
            if (!data.ageInWeeks && data.birthDate) {
                const birthDateTime = new Date(data.birthDate);
                const napDateTime = new Date(data.date);
                const ageInDays = Math.floor((napDateTime - birthDateTime) / (1000 * 60 * 60 * 24));
                const ageInWeeks = Math.floor(ageInDays / 7);
                ageText = `${ageInWeeks}`;
            }
            
            const lang = window.language.translations[window.language.currentLang];
            const goodWakeText = data.goodWake ? lang.wokeUpWell : lang.wokeUpBad;
            
            historyData.push({
                date: data.date,
                timeRange: `${data.start} - ${data.end}`,
                duration: `${hours}h ${mins}m`,
                ageWeeks: ageText,
                goodWake: goodWakeText,
                comments: data.comments || '-'
            });

            // For chart data (group by date and sum hours)
            const existingIndex = chartLabels.indexOf(data.date);
            if (existingIndex !== -1) {
                chartDurations[existingIndex] += durationHours;
            } else {
                chartLabels.push(data.date);
                chartDurations.push(durationHours);
            }
        });
        
        // Sort chart data by date
        const chartData = chartLabels.map((label, index) => ({
            date: label,
            duration: Math.round(chartDurations[index] * 100) / 100
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
        
        return { 
            historyData: historyData.reverse(), // Most recent first for PDF
            chartData 
        };
    }

    async generatePDF(historyData, chartData, fromDate, toDate, lang, chartImageData, ganttImageData) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Set up fonts and colors
        const primaryColor = [54, 162, 235];
        const textColor = [60, 60, 60];
        const lightGray = [240, 240, 240];
        
        // Header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 30, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(lang.title || 'Baby Sleep Tracker', 20, 20);
        
        // User info
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const userName = window.auth.currentUser.displayName || window.auth.currentUser.email;
        doc.text(`${lang.user || 'Usuario'}: ${userName}`, 20, 27);
        
        // Date range
        doc.setTextColor(...textColor);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        let yPos = 45;
        
        const dateRangeText = fromDate && toDate 
            ? `${lang.dateRange || 'Rango de fechas'}: ${fromDate} - ${toDate}`
            : `${lang.allRecords || 'Todos los registros'}`;
        doc.text(dateRangeText, 20, yPos);
        
        yPos += 15;
        
        // Summary statistics
        if (historyData.length > 0) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(lang.summary || 'Resumen', 20, yPos);
            yPos += 10;

            const totalRecords = historyData.length;
            const totalMinutes = historyData.reduce((sum, record) => {
                const [hours, mins] = record.duration.replace('h', '').replace('m', '').split(' ');
                return sum + (parseInt(hours) * 60) + parseInt(mins);
            }, 0);
            const avgDuration = Math.round(totalMinutes / totalRecords);
            const avgHours = Math.floor(avgDuration / 60);
            const avgMins = avgDuration % 60;

            doc.setFont('helvetica', 'normal');
            // Viñetas principales
            const bullet = '\u2022';
            doc.text(`${bullet} ${lang.totalRecords || 'Total de registros'}: ${totalRecords}`, 24, yPos);
            yPos += 7;
            doc.text(`${bullet} ${lang.avgDuration || 'Duración promedio'}: ${avgHours}h ${avgMins}m`, 24, yPos);
            yPos += 7;
            doc.text(`${bullet} ${lang.totalSleep || 'Total de horas dormidas'}: ${Math.round(totalMinutes / 60 * 100) / 100}h`, 24, yPos);
            yPos += 10;

            // Add detailed statistics by time period
            if (window.summary && window.summary.summaryData) {
                const summaryStats = window.summary.summaryData;
                doc.setFont('helvetica', 'bold');
                doc.text(lang.summaryStats || 'Estadísticas de Sueño', 20, yPos);
                yPos += 8;
                doc.setFont('helvetica', 'normal');
                // Sub-bullets for each period
                const subBullet = '\u2013'; // guion largo
                // Morning
                doc.text(`${bullet} ${window.language.currentLang === 'es' ? 'Mañana (7:00 - 12:00)' : 'Morning (7:00am - 12:00pm)'}`, 24, yPos);
                yPos += 6;
                doc.text(`   ${subBullet} ${lang.avgHoursLabel || 'Promedio horas:'} ${window.summary.formatHours(summaryStats.morning.avgHours)}`, 28, yPos);
                yPos += 5;
                doc.text(`   ${subBullet} ${lang.avgNapsLabel || 'Promedio siestas:'} ${window.summary.formatNumber(summaryStats.morning.avgNaps)}`, 28, yPos);
                yPos += 5;
                doc.text(`   ${subBullet} ${lang.avgDurationLabel || 'Duración promedio:'} ${window.summary.formatHours(summaryStats.morning.avgDuration)}`, 28, yPos);
                yPos += 7;
                // Afternoon
                doc.text(`${bullet} ${window.language.currentLang === 'es' ? 'Tarde (12:00 - 20:00)' : 'Afternoon (12:00pm - 8:00pm)'}`, 24, yPos);
                yPos += 6;
                doc.text(`   ${subBullet} ${lang.avgHoursLabel || 'Promedio horas:'} ${window.summary.formatHours(summaryStats.afternoon.avgHours)}`, 28, yPos);
                yPos += 5;
                doc.text(`   ${subBullet} ${lang.avgNapsLabel || 'Promedio siestas:'} ${window.summary.formatNumber(summaryStats.afternoon.avgNaps)}`, 28, yPos);
                yPos += 5;
                doc.text(`   ${subBullet} ${lang.avgDurationLabel || 'Duración promedio:'} ${window.summary.formatHours(summaryStats.afternoon.avgDuration)}`, 28, yPos);
                yPos += 7;
                // Night
                doc.text(`${bullet} ${window.language.currentLang === 'es' ? 'Noche (20:00 - 7:00)' : 'Night (8:00pm - 7:00am)'}`, 24, yPos);
                yPos += 6;
                doc.text(`   ${subBullet} ${lang.avgHoursLabel || 'Promedio horas:'} ${window.summary.formatHours(summaryStats.night.avgHours)}`, 28, yPos);
                yPos += 5;
                doc.text(`   ${subBullet} ${lang.avgNapsLabel || 'Promedio siestas:'} ${window.summary.formatNumber(summaryStats.night.avgNaps)}`, 28, yPos);
                yPos += 5;
                doc.text(`   ${subBullet} ${lang.avgDurationLabel || 'Duración promedio:'} ${window.summary.formatHours(summaryStats.night.avgDuration)}`, 28, yPos);
                yPos += 7;
                // Daily
                doc.text(`${bullet} ${lang.dailyStatsTitle || 'Estadísticas Diarias'}`, 24, yPos);
                yPos += 6;
                doc.text(`   ${subBullet} ${lang.avgDailyHoursLabel || 'Promedio horas por día:'} ${window.summary.formatHours(summaryStats.daily.avgHours)}`, 28, yPos);
                yPos += 5;
                doc.text(`   ${subBullet} ${lang.avgDailyNapsLabel || 'Promedio siestas por día:'} ${window.summary.formatNumber(summaryStats.daily.avgNaps)}`, 28, yPos);
                yPos += 5;
                doc.text(`   ${subBullet} ${lang.avgNapDurationLabel || 'Duración promedio por siesta:'} ${window.summary.formatHours(summaryStats.overall.avgNapDuration)}`, 28, yPos);
                yPos += 10;
            }
        }
        
        // Salto de página antes de la gráfica de barras
        doc.addPage();
        yPos = 20;
        // Chart de barras
        if (chartData.length > 0 && chartImageData) {
            doc.setFont('helvetica', 'bold');
            doc.text(lang.sleepChart || 'Gráfico de Sueño', 20, yPos);
            yPos += 10;
            try {
                // Add chart to PDF
                const chartWidth = 170;
                const chartHeight = 100;
                doc.addImage(chartImageData, 'PNG', 20, yPos, chartWidth, chartHeight);
                yPos += chartHeight + 15;
            } catch (error) {
                console.warn('Could not add chart to PDF:', error);
                doc.setFont('helvetica', 'italic');
                doc.text(lang.chartNotAvailable || 'Gráfico no disponible', 20, yPos);
                yPos += 15;
            }
        }

        // Salto de página antes del gráfico de intervalos (Gantt)
        if (ganttImageData) {
            doc.addPage();
            yPos = 20;
            doc.setFont('helvetica', 'bold');
            doc.text(lang.sleepIntervalsChart || 'Intervalos de sueño', 20, yPos);
            yPos += 10;
            try {
                const ganttWidth = 180;
                const ganttHeight = Math.max(80, (chartData.length || 10) * 10);
                doc.addImage(ganttImageData, 'PNG', 10, yPos, ganttWidth, ganttHeight);
                yPos += ganttHeight + 10;
                // Leyenda de colores debajo del gráfico
                const legendItems = [
                    { color: 'rgba(255, 99, 132, 0.45)', label: lang && lang.legendLongNap ? lang.legendLongNap : '>3h' },
                    { color: 'rgba(30, 90, 180, 0.75)', label: lang && lang.legendIntenseBlue ? lang.legendIntenseBlue : '2.5-3h' },
                    { color: 'rgba(54, 162, 235, 0.55)', label: lang && lang.legendMediumBlue ? lang.legendMediumBlue : '1.5-2.5h' },
                    { color: 'rgba(120, 180, 255, 0.35)', label: lang && lang.legendLightBlue ? lang.legendLightBlue : '<1.5h' }
                ];
                let legendX = 10;
                let legendY = yPos;
                doc.setFontSize(10);
                legendItems.forEach(item => {
                    // Dibuja el rectángulo de color
                    doc.setFillColor(...item.color.match(/\d+/g).map(Number));
                    doc.rect(legendX, legendY, 10, 6, 'F');
                    doc.setTextColor(60, 60, 60);
                    doc.text(item.label, legendX + 14, legendY + 5);
                    legendX += 60;
                });
                yPos += 15;
            } catch (error) {
                console.warn('Could not add gantt chart to PDF:', error);
                doc.setFont('helvetica', 'italic');
                doc.text(lang.chartNotAvailable || 'Gráfico no disponible', 20, yPos);
                yPos += 15;
            }
        }

        // Salto de página antes del historial
        doc.addPage();
        yPos = 20;
        // History table
        if (historyData.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.text(lang.detailedHistory || 'Historial Detallado', 20, yPos);
            yPos += 10;
            
            // Prepare table data
            const tableColumns = [
                lang.historyTableHeaders?.date || 'Fecha',
                lang.historyTableHeaders?.time || 'Horario',
                lang.historyTableHeaders?.duration || 'Duración',
                lang.historyTableHeaders?.ageWeeks || 'Edad (sem)',
                lang.historyTableHeaders?.goodWake || 'Despertó bien',
                lang.historyTableHeaders?.comments || 'Comentarios'
            ];
            
            const tableRows = historyData.map(record => [
                record.date,
                record.timeRange,
                record.duration,
                record.ageWeeks,
                record.goodWake,
                record.comments
            ]);
            
            // Create table
            doc.autoTable({
                head: [tableColumns],
                body: tableRows,
                startY: yPos,
                styles: {
                    fontSize: 8,
                    cellPadding: 3,
                    textColor: textColor,
                },
                headStyles: {
                    fillColor: primaryColor,
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: lightGray
                },
                columnStyles: {
                    0: { cellWidth: 25 }, // Date
                    1: { cellWidth: 35 }, // Time
                    2: { cellWidth: 20 }, // Duration
                    3: { cellWidth: 15 }, // Age
                    4: { cellWidth: 20 }, // Good wake
                    5: { cellWidth: 55 }  // Comments
                },
                margin: { left: 20, right: 20 }
            });
        }
        
        // Footer with generation date
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            doc.setFont('helvetica', 'normal');
            
            const generationDate = new Date().toLocaleString(window.language.currentLang === 'es' ? 'es-ES' : 'en-US');
            doc.text(`${lang.generatedOn || 'Generado el'}: ${generationDate}`, 20, 290);
            doc.text(`${lang.page || 'Página'} ${i} ${lang.of || 'de'} ${pageCount}`, 180, 290);
        }
        
        // Save the PDF
        const fileName = `baby-sleep-report-${fromDate || 'all'}-${toDate || 'records'}.pdf`;
        doc.save(fileName);
    }
}

// Initialize PDF exporter
window.pdfExporter = new PDFExporter();
