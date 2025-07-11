// Shared data controller for History and Chart tabs
class SharedDataController {
    constructor() {
        this.initEventListeners();
    }

    initEventListeners() {
        // Load data button
        document.getElementById('loadDataBtn').addEventListener('click', () => this.loadAllData());

        // Export PDF button, wait for window.pdfExporter to be defined
        const exportBtn = document.getElementById('exportPdfBtn');
        const waitForPdfExporter = () => {
            if (window.pdfExporter && typeof window.pdfExporter.exportToPDF === 'function') {
                exportBtn.addEventListener('click', () => window.pdfExporter.exportToPDF());
            } else {
                setTimeout(waitForPdfExporter, 50);
            }
        };
        waitForPdfExporter();

        // Auto-load when dates change
        document.getElementById('sharedFromDate').addEventListener('change', () => this.loadAllData());
        document.getElementById('sharedToDate').addEventListener('change', () => this.loadAllData());
    }

    loadAllData() {
        if (!window.auth || !window.auth.currentUser) {
            return;
        }
        // Siempre cargar todas las vistas relevantes
        window.summary.loadSummary();
        window.sleepHistory.loadHistorico();
        window.chart.loadGraph();
    }

    // Method to be called when switching to a tab that uses shared controls
    autoLoadForTab(tabName) {
        if (!window.auth || !window.auth.currentUser) {
            return;
        }

        if (tabName === 'historico') {
            window.sleepHistory.loadHistorico();
        } else if (tabName === 'grafica') {
            window.chart.loadGraph();
        } else if (tabName === 'sumario') {
            window.summary.loadSummary();
        }
    }
}

// Initialize shared data controller
window.sharedDataController = new SharedDataController();
