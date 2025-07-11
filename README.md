# 👶 Baby Sleep Tracker

A modern web application for tracking baby naps, featuring intelligent predictions based on age and detailed sleep pattern analysis.

## 🌟 Features

### 📊 Smart Tracking
- **Next nap prediction** based on the baby's age and historical patterns
- **Automatic age calculation** in weeks for each record
- **Adaptive intervals** according to developmental stages:
  - 0-4 weeks: Every 1.5 hours
  - 1-3 months: Every 2 hours  
  - 3-6 months: Every 2.5 hours
  - 6-12 months: Every 3 hours
  - Over 12 months: Every 3.5 hours

### 📝 Complete Logging
- Start/end date and time of the nap
- Automatically calculated duration
- Custom comments
- Wakeup status (if the baby woke up well)
- Baby’s birthdate for precise calculations

### 📈 Analysis and Visualization
- **Detailed history** in a table format with date filters
- **Interactive charts** showing nap durations
- **Statistics** on average duration
- **Estimated time** until the next nap

### 🌍 Multi-language
- Fully supported in **Spanish** and **English**
- Real-time language switching
- Persistence of language preference

### 💾 Data Persistence
- **Firebase Firestore** for cloud storage
- **localStorage** for configuration and preferences
- **Automatic synchronization** across devices

## 🚀 Installation and Setup

### 1. **Clone the repository**
```bash
git clone https://github.com/your-username/baby-sleep-tracker.git
cd baby-sleep-tracker
```

### 2. **Configure Firebase**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Firestore Database**
4. Obtain your project configuration:

```javascript
// Example Firebase configuration
{
  "apiKey": "your-api-key",
  "authDomain": "your-project.firebaseapp.com",
  "projectId": "your-project-id",
  "storageBucket": "your-project.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "your-app-id"
}
```

### 3. **Configure the Application**

1. Open `index.html` in your browser
2. Navigate to the **"Config"** tab
3. Paste your Firebase configuration in JSON format
4. Click on **"Save configuration"**

### 4. **Ready to Use!**

The application will automatically save your configuration and will be ready to track your baby's naps.

## 📱 Usage

### **Initial Setup**
1. **Configure Firebase** (see step 2 above)
2. **Set the baby's birth date** (default: April 19, 2025)
3. **Select your preferred language**

### **Log a Nap**
1. Go to the **"Log"** tab
2. The fields will auto-populate with:
   - Current date
   - Start time (30 minutes ago)
   - End time (current time)
3. Adjust the data as needed
4. Add comments if desired
5. Mark whether the baby woke up well
6. Click on **"Save"**

### **View Next Nap**
- The **"Next Nap"** tab (active by default) displays:
  - The baby's current age
  - Average nap duration
  - Estimated time for the next nap
  - Remaining time

### **Review History**
- Go to **"History"** to see a complete table with:
  - Dates and times
  - Duration of each nap
  - Baby’s age at each moment
  - Wakeup status
  - Comments

### **Analyze Trends**
- The **"Chart"** tab shows the evolution of nap durations over time

## 🔧 Technologies Used

- **HTML5** - Structure
- **CSS3** / **Tailwind CSS** - Modern and responsive styles
- **JavaScript (ES6+)** - Application logic
- **Firebase Firestore** - Real-time database
- **Chart.js** - Interactive charts

## 📋 Data Structure

### Nap Log
```javascript
{
  "birthDate": "2025-04-19",           // Birth date
  "date": "2025-07-11",                // Nap date
  "start": "14:30",                    // Start time
  "end": "16:00",                      // End time
  "comments": "Slept very well",       // Optional comments
  "goodWake": true,                    // Indicates if the baby woke well
  "ageInWeeks": 12,                    // Age in weeks
  "timestamp": "2025-07-11T16:00:00Z"    // Timestamp
}
```

## 🎯 Advanced Features

### **Intelligent Defaults**
- **Date**: Current day
- **Start time**: 30 minutes before current time
- **End time**: Current time
- **Filter dates**: From yesterday to today

### **Local Persistence**
- Firebase configuration
- Baby’s birth date
- Selected language

### **Validations**
- End time must be later than start time
- All required fields must be completed
- Correct date and time formats

### **Responsive Design**
- Works perfectly on mobile, tablet, and desktop
- Tables with horizontal scrolling on small screens
- Interface optimized for one-handed use

## 🔧 Customization

### **Change Default Birth Date**
Modify the following line in the code:
```javascript
const defaultBirthDate = savedBirthDate || '2025-04-19';
```

### **Adjust Nap Intervals**
Modify the values in the function `calculateWeightedNextNap()`:
```javascript
if (currentAgeInWeeks <= 4) {
    napInterval = 1.5; // Customize here
}
```

### **Add More Languages**
Extend the `translations` object with new languages.

## 📈 Upcoming Features

- [ ] User authentication
- [ ] Multiple babies per account
- [ ] Push notifications for reminders
- [ ] Export data to PDF/CSV
- [ ] Integration with wearable devices
- [ ] More advanced sleep pattern analysis

## 🤝 Contributing

Contributions are welcome. For major changes:

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## 📞 Support

If you encounter any issues or have questions:

1. Ensure Firebase is properly configured
2. Verify your internet connection
3. Open your browser's developer console to view errors
4. Create an issue on GitHub with details

## 🎉 Acknowledgements

- To all parents tracking their baby's sleep
- To the Firebase community for its excellent tools
- To Tailwind CSS for making design so effortless

---

**Made with ❤️ for parents who want the best for their babies!**