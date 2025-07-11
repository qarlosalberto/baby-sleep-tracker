# JavaScript Modules Structure

This project has been refactored to separate the JavaScript code into different modules for better organization and maintainability. Each file is responsible for a specific functionality:

## Module Overview

### `config.js`
- Manages Firebase configuration
- Handles connection status updates
- Loads and saves Firebase settings
- Initializes Firebase services

### `auth.js`
- Handles Google authentication with Firebase Auth
- Manages user sessions and authentication state
- Provides user validation functions
- Controls access to user-specific data collections

### `language.js`
- Manages internationalization (i18n)
- Contains all text translations for Spanish and English
- Handles language switching
- Updates UI text based on selected language

### `form.js`
- Manages the sleep data input form
- Handles form submission and validation
- Saves sleep records to Firebase
- Manages birth date storage per user

### `nap-calculator.js`
- Calculates next nap predictions
- Analyzes sleep patterns based on baby's age
- Computes average sleep duration
- Provides intelligent recommendations

### `history.js`
- Loads and displays historical sleep data (renamed to `sleepHistory` to avoid conflicts)
- Manages data filtering by date ranges
- Handles record deletion with security validation
- Displays data in table format

### `chart.js`
- Creates and manages sleep duration bar charts
- Uses Chart.js for data visualization
- Groups sleep data by day (summing all naps per day)
- Handles chart updates and data loading
- Provides graphical analysis of daily sleep patterns

### `pdf-exporter.js`
- Handles PDF generation and export functionality
- Creates beautiful PDF reports with tables and charts
- Uses jsPDF and autoTable plugins
- Includes summary statistics and detailed history
- Exports chart images and formatted tables

### `shared-data-controller.js`
- Manages shared date controls for History and Chart tabs
- Handles unified load and export functionality
- Coordinates data loading between History and Chart
- Provides auto-loading when switching tabs or changing dates

### `utils.js`
- Contains utility functions and helpers
- Manages tab navigation
- Sets default form values
- Handles common UI interactions

### `app.js`
- Main application controller
- Initializes all modules
- Manages application startup
- Coordinates between different modules

## Load Order
The modules are loaded in the following order to ensure proper dependencies:
1. `config.js` - Firebase configuration
2. `auth.js` - Authentication services
3. `language.js` - Internationalization
4. `form.js` - Form handling
5. `nap-calculator.js` - Sleep calculations
6. `history.js` - Data history
7. `chart.js` - Data visualization
8. `pdf-exporter.js` - PDF export functionality
9. `shared-data-controller.js` - Shared controls coordination
10. `utils.js` - Utility functions
11. `app.js` - Application initialization

## Global Objects
Each module creates a global object under the `window` namespace:
- `window.firebaseConfig`
- `window.auth`
- `window.language`
- `window.sleepForm`
- `window.napCalculator`
- `window.sleepHistory` (note: renamed from `history` to avoid conflicts with browser API)
- `window.chart`
- `window.pdfExporter`
- `window.sharedDataController`
- `window.utils`
- `window.app`

This allows modules to communicate with each other while maintaining separation of concerns.
