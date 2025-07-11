// Language management and translations
class Language {
    constructor() {
        this.currentLang = 'es';
        this.translations = {
            es: {
                title: "Baby Siesta Tracker",
                tabNext: "Próxima siesta",
                tabInsert: "Insertar", 
                tabSummary: "Sumario",
                tabHist: "Histórico",
                tabGraph: "Gráfica",
                tabConfig: "Config",
                labelNacimiento: "Fecha de nacimiento del bebé",
                labelFecha: "Fecha",
                labelInicio: "Hora inicio siesta",
                labelFin: "Hora fin siesta",
                labelComentarios: "Comentarios",
                labelDesperto: "Despertó bien",
                btnGuardar: "Guardar",
                labelConfig: "Configuración de Firebase (JSON)",
                btnSaveConfig: "Guardar configuración",
                from: "Desde:",
                to: "Hasta:",
                load: "Cargar",
                calculating: "Calculando próxima siesta...",
                loading: "Cargando...",
                noData: "No hay datos disponibles",
                configSaved: "✅ Configuración guardada correctamente",
                dataSaved: "✅ Datos guardados correctamente",
                noConnection: "No Firebase connection",
                timeError: "Hora de fin debe ser posterior a la de inicio",
                historyTableHeaders: {
                    date: "Fecha",
                    time: "Horario",
                    duration: "Duración",
                    ageWeeks: "Edad (semanas)",
                    comments: "Comentarios",
                    goodWake: "Despertó bien",
                    actions: "Acciones"
                },
                wokeUpWell: "Sí",
                wokeUpBad: "No",
                loginText: "Iniciar con Google",
                logoutText: "Cerrar sesión",
                authRequiredText: "Inicia sesión con tu cuenta de Google para acceder a tus datos",
                userNotAuth: "Usuario no autenticado",
                delete: "Eliminar",
                deleteRecord: "Eliminar registro",
                confirmDelete: "¿Estás seguro de que quieres eliminar este registro? Esta acción no se puede deshacer.",
                recordDeleted: "✅ Registro eliminado correctamente",
                exportPdf: "Exportar PDF",
                user: "Usuario",
                dateRange: "Rango de fechas",
                allRecords: "Todos los registros",
                summary: "Resumen",
                totalRecords: "Total de registros",
                avgDuration: "Duración promedio",
                totalSleep: "Total de horas dormidas",
                sleepChart: "Gráfico de Sueño",
                chartNotAvailable: "Gráfico no disponible",
                detailedHistory: "Historial Detallado",
                generatedOn: "Generado el",
                page: "Página",
                of: "de",
                dateControlsHelper: "Controles compartidos - siempre visibles para Histórico y Gráfica",
                // Summary statistics
                summaryTitle: "Estadísticas de Sueño",
                morningStatsTitle: "Mañana (6:00 - 12:00)",
                afternoonStatsTitle: "Tarde (12:00 - 18:00)",
                nightStatsTitle: "Noche (18:00 - 6:00)",
                dailyStatsTitle: "Estadísticas Diarias",
                avgHoursLabel: "Promedio horas:",
                avgNapsLabel: "Promedio siestas:",
                avgDurationLabel: "Duración promedio:",
                avgDailyHoursLabel: "Promedio horas por día:",
                avgDailyNapsLabel: "Promedio siestas por día:",
                avgNapDurationLabel: "Duración promedio por siesta:",
                summaryLoadingText: "Cargando estadísticas...",
                summaryStats: "Estadísticas de Sueño"
            },
            en: {
                title: "Baby Siesta Tracker",
                tabNext: "Next Nap",
                tabInsert: "Insert",
                tabSummary: "Summary",
                tabHist: "History", 
                tabGraph: "Chart",
                tabConfig: "Config",
                labelNacimiento: "Baby's birth date",
                labelFecha: "Date",
                labelInicio: "Nap start time",
                labelFin: "Nap end time", 
                labelComentarios: "Comments",
                labelDesperto: "Woke up well",
                btnGuardar: "Save",
                labelConfig: "Firebase Configuration (JSON)",
                btnSaveConfig: "Save configuration",
                from: "From:",
                to: "To:",
                load: "Load",
                calculating: "Calculating next nap...",
                loading: "Loading...",
                noData: "No data available",
                configSaved: "✅ Configuration saved successfully",
                dataSaved: "✅ Data saved successfully", 
                noConnection: "No Firebase connection",
                timeError: "End time must be after start time",
                historyTableHeaders: {
                    date: "Date",
                    time: "Time",
                    duration: "Duration",
                    ageWeeks: "Age (weeks)",
                    comments: "Comments",
                    goodWake: "Woke up well",
                    actions: "Actions"
                },
                wokeUpWell: "Yes",
                wokeUpBad: "No",
                loginText: "Sign in with Google",
                logoutText: "Sign out",
                authRequiredText: "Sign in with your Google account to access your data",
                userNotAuth: "User not authenticated",
                delete: "Delete",
                deleteRecord: "Delete record",
                confirmDelete: "Are you sure you want to delete this record? This action cannot be undone.",
                recordDeleted: "✅ Record deleted successfully",
                exportPdf: "Export PDF",
                user: "User",
                dateRange: "Date range",
                allRecords: "All records",
                summary: "Summary",
                totalRecords: "Total records",
                avgDuration: "Average duration",
                totalSleep: "Total hours slept",
                sleepChart: "Sleep Chart",
                chartNotAvailable: "Chart not available",
                detailedHistory: "Detailed History",
                generatedOn: "Generated on",
                page: "Page",
                of: "of",
                dateControlsHelper: "Shared controls - always visible for History and Chart",
                // Summary statistics
                summaryTitle: "Sleep Statistics",
                morningStatsTitle: "Morning (6:00 - 12:00)",
                afternoonStatsTitle: "Afternoon (12:00 - 18:00)",
                nightStatsTitle: "Night (18:00 - 6:00)",
                dailyStatsTitle: "Daily Statistics",
                avgHoursLabel: "Average hours:",
                avgNapsLabel: "Average naps:",
                avgDurationLabel: "Average duration:",
                avgDailyHoursLabel: "Average hours per day:",
                avgDailyNapsLabel: "Average naps per day:",
                avgNapDurationLabel: "Average duration per nap:",
                summaryLoadingText: "Loading statistics...",
                summaryStats: "Sleep Statistics"
            }
        };
    }

    updateLanguage() {
        const lang = this.translations[this.currentLang];
        document.getElementById('titlePage').textContent = lang.title;
        document.getElementById('tabBtnNext').textContent = lang.tabNext;
        document.getElementById('tabBtnInsert').textContent = lang.tabInsert;
        document.getElementById('tabBtnSummary').textContent = lang.tabSummary;
        document.getElementById('tabBtnHist').textContent = lang.tabHist;
        document.getElementById('tabBtnGraph').textContent = lang.tabGraph;
        document.getElementById('tabBtnConfig').textContent = lang.tabConfig;
        document.getElementById('labelNacimiento').textContent = lang.labelNacimiento;
        document.getElementById('labelFecha').textContent = lang.labelFecha;
        document.getElementById('labelInicio').textContent = lang.labelInicio;
        document.getElementById('labelFin').textContent = lang.labelFin;
        document.getElementById('labelComentarios').textContent = lang.labelComentarios;
        document.getElementById('labelDesperto').textContent = lang.labelDesperto;
        document.getElementById('btnGuardar').textContent = lang.btnGuardar;
        document.getElementById('labelConfig').textContent = lang.labelConfig;
        document.getElementById('saveConfigBtn').textContent = lang.btnSaveConfig;
        
        // Update connection status with current language
        if (window.firestoreDB && window.firebaseConfig) {
            window.firebaseConfig.updateConnectionStatus(true);
        } else if (window.firebaseConfig) {
            window.firebaseConfig.updateConnectionStatus(false);
        }
        
        // Update auth required text
        document.getElementById('authRequiredText').textContent = lang.authRequiredText;
        document.getElementById('loginText').textContent = lang.loginText;
        document.getElementById('logoutText').textContent = lang.logoutText;
        
        // Update export PDF text
        const exportPdfText = document.getElementById('exportPdfText');
        if (exportPdfText) {
            exportPdfText.textContent = lang.exportPdf;
        }
        
        // Update shared date controls
        const dateFromLabel = document.getElementById('dateFromLabel');
        const dateToLabel = document.getElementById('dateToLabel');
        const loadDataText = document.getElementById('loadDataText');
        const dateControlsHelper = document.getElementById('dateControlsHelper');
        
        if (dateFromLabel) dateFromLabel.textContent = lang.from;
        if (dateToLabel) dateToLabel.textContent = lang.to;
        if (loadDataText) loadDataText.textContent = lang.load;
        if (dateControlsHelper) dateControlsHelper.textContent = lang.dateControlsHelper;
        
        // Update summary elements
        const summaryElements = {
            'summaryTitle': 'summaryTitle',
            'morningStatsTitle': 'morningStatsTitle', 
            'afternoonStatsTitle': 'afternoonStatsTitle',
            'nightStatsTitle': 'nightStatsTitle',
            'dailyStatsTitle': 'dailyStatsTitle',
            'avgMorningHoursLabel': 'avgHoursLabel',
            'avgMorningNapsLabel': 'avgNapsLabel',
            'avgMorningDurationLabel': 'avgDurationLabel',
            'avgAfternoonHoursLabel': 'avgHoursLabel',
            'avgAfternoonNapsLabel': 'avgNapsLabel',
            'avgAfternoonDurationLabel': 'avgDurationLabel',
            'avgNightHoursLabel': 'avgHoursLabel',
            'avgNightNapsLabel': 'avgNapsLabel',
            'avgNightDurationLabel': 'avgDurationLabel',
            'avgDailyHoursLabel': 'avgDailyHoursLabel',
            'avgDailyNapsLabel': 'avgDailyNapsLabel',
            'avgNapDurationLabel': 'avgNapDurationLabel',
            'summaryLoadingText': 'summaryLoadingText'
        };
        
        Object.entries(summaryElements).forEach(([elementId, langKey]) => {
            const element = document.getElementById(elementId);
            if (element && lang[langKey]) {
                element.textContent = lang[langKey];
            }
        });
        
        // Update load buttons
        document.querySelectorAll('button').forEach(btn => {
            if (btn.textContent === 'Cargar' || btn.textContent === 'Load') {
                btn.textContent = lang.load;
            }
        });

        // Update any existing no-data messages
        const noDataElements = document.querySelectorAll('.text-center.py-8');
        noDataElements.forEach(element => {
            if (element.textContent.includes('No hay datos') || element.textContent.includes('No data')) {
                element.textContent = lang.noData;
            } else if (element.textContent.includes('No Firebase connection')) {
                element.textContent = lang.noConnection;
            } else if (element.textContent.includes('Cargando') || element.textContent.includes('Loading')) {
                element.textContent = lang.loading;
            }
        });

        // Reload data with new language if user is authenticated
        if (window.firestoreDB && window.auth && window.auth.currentUser) {
            window.napCalculator.calcularProximaSiestaPonderada();
            window.sleepHistory.loadHistorico();
            window.chart.loadGraph();
            if (window.summary) {
                window.summary.loadSummary();
            }
        }
    }

    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('selectedLanguage', this.currentLang);
        this.updateLanguage();
    }

    initEventListeners() {
        // Language selector handler
        const languageSelect = document.getElementById('languageSelect');
        languageSelect.addEventListener('change', (e) => {
            this.setLanguage(e.target.value);
            window.utils.setDefaultValues(); // Re-set default values with updated language
        });
    }

    initialize() {
        // Load saved language or default to Spanish
        const savedLanguage = localStorage.getItem('selectedLanguage') || 'es';
        this.currentLang = savedLanguage;
        document.getElementById('languageSelect').value = this.currentLang;
        this.updateLanguage();
    }
}

// Initialize language manager
window.language = new Language();
