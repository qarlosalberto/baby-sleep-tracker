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

            // --- CANVAS TEMPORAL PARA LA GRÁFICA ---
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
                const tempChart = new window.Chart(tempCtx, {
                    type: 'bar',
                    data: {
                        labels: chartDataForExport.labels,
                        datasets: [{
                            label: window.language.currentLang === 'es' ? 'Horas dormidas por día' : 'Hours slept per day',
                            data: chartDataForExport.durations,
                            backgroundColor: 'rgba(54, 162, 235, 0.8)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: false,
                        animation: false,
                        plugins: {
                            title: {
                                display: true,
                                text: window.language.currentLang === 'es' ? 'Horas dormidas por día' : 'Hours slept per day'
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
                await new Promise(resolve => setTimeout(resolve, 300));
                chartImageData = tempCanvas.toDataURL('image/png', 1.0);
                tempChart.destroy();
            }
            tempCanvas.remove();
            // --- FIN CANVAS TEMPORAL ---

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
            await this.generatePDF(historyData, chartData, fromDate, toDate, lang, chartImageData);
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

    async generatePDF(historyData, chartData, fromDate, toDate, lang, chartImageData) {
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
            doc.text(`${lang.totalRecords || 'Total de registros'}: ${totalRecords}`, 20, yPos);
            yPos += 7;
            doc.text(`${lang.avgDuration || 'Duración promedio'}: ${avgHours}h ${avgMins}m`, 20, yPos);
            yPos += 7;
            doc.text(`${lang.totalSleep || 'Total de horas dormidas'}: ${Math.round(totalMinutes / 60 * 100) / 100}h`, 20, yPos);
            yPos += 15;

            // Add detailed statistics by time period
            if (window.summary && window.summary.summaryData) {
                const summaryStats = window.summary.summaryData;
                
                doc.setFont('helvetica', 'bold');
                doc.text(lang.summaryStats || 'Estadísticas de Sueño', 20, yPos);
                yPos += 10;
                
                // Morning stats
                doc.setFont('helvetica', 'bold');
                doc.text(lang.morningStatsTitle || 'Mañana (6:00 - 12:00)', 20, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                doc.text(`  ${lang.avgHoursLabel || 'Promedio horas:'} ${window.summary.formatHours(summaryStats.morning.avgHours)}`, 20, yPos);
                yPos += 5;
                doc.text(`  ${lang.avgNapsLabel || 'Promedio siestas:'} ${window.summary.formatNumber(summaryStats.morning.avgNaps)}`, 20, yPos);
                yPos += 5;
                doc.text(`  ${lang.avgDurationLabel || 'Duración promedio:'} ${window.summary.formatHours(summaryStats.morning.avgDuration)}`, 20, yPos);
                yPos += 8;
                
                // Afternoon stats
                doc.setFont('helvetica', 'bold');
                doc.text(lang.afternoonStatsTitle || 'Tarde (12:00 - 18:00)', 20, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                doc.text(`  ${lang.avgHoursLabel || 'Promedio horas:'} ${window.summary.formatHours(summaryStats.afternoon.avgHours)}`, 20, yPos);
                yPos += 5;
                doc.text(`  ${lang.avgNapsLabel || 'Promedio siestas:'} ${window.summary.formatNumber(summaryStats.afternoon.avgNaps)}`, 20, yPos);
                yPos += 5;
                doc.text(`  ${lang.avgDurationLabel || 'Duración promedio:'} ${window.summary.formatHours(summaryStats.afternoon.avgDuration)}`, 20, yPos);
                yPos += 8;
                
                // Night stats
                doc.setFont('helvetica', 'bold');
                doc.text(lang.nightStatsTitle || 'Noche (18:00 - 6:00)', 20, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                doc.text(`  ${lang.avgHoursLabel || 'Promedio horas:'} ${window.summary.formatHours(summaryStats.night.avgHours)}`, 20, yPos);
                yPos += 5;
                doc.text(`  ${lang.avgNapsLabel || 'Promedio siestas:'} ${window.summary.formatNumber(summaryStats.night.avgNaps)}`, 20, yPos);
                yPos += 5;
                doc.text(`  ${lang.avgDurationLabel || 'Duración promedio:'} ${window.summary.formatHours(summaryStats.night.avgDuration)}`, 20, yPos);
                yPos += 8;
                
                // Daily stats
                doc.setFont('helvetica', 'bold');
                doc.text(lang.dailyStatsTitle || 'Estadísticas Diarias', 20, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                doc.text(`  ${lang.avgDailyHoursLabel || 'Promedio horas por día:'} ${window.summary.formatHours(summaryStats.daily.avgHours)}`, 20, yPos);
                yPos += 5;
                doc.text(`  ${lang.avgDailyNapsLabel || 'Promedio siestas por día:'} ${window.summary.formatNumber(summaryStats.daily.avgNaps)}`, 20, yPos);
                yPos += 5;
                doc.text(`  ${lang.avgNapDurationLabel || 'Duración promedio por siesta:'} ${window.summary.formatHours(summaryStats.overall.avgNapDuration)}`, 20, yPos);
                yPos += 15;
            }
        }
        
        // Salto de página antes de la gráfica
        doc.addPage();
        yPos = 20;
        // Chart
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
