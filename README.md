# 💪 Strength Training Log

A beautiful, modern web application for tracking your strength training workouts. Built with pure HTML, CSS, and JavaScript - no frameworks, no server required!

## ✨ Features

- **Exercise Management** - Add, edit, and organize your exercises
- **Workout Logging** - Track sets, reps, and weight (kg) for each workout
- **Complete History** - View all past workouts with filtering options
- **Data Persistence** - Everything saves automatically to your browser
- **Backup & Restore** - Export/import your data for safety
- **Modern Design** - 2024-inspired UI with gentle colors and smooth animations
- **Responsive** - Works perfectly on desktop, tablet, and mobile
- **Offline Ready** - No internet connection required after loading

## 🚀 Quick Start

### Option 1: Download & Open
1. Download all files to a folder
2. Open `index.html` in your browser
3. Start tracking your workouts!

### Option 2: Deploy Online (Recommended)
Use the provided deployment script:
```bash
./deploy-safely.sh
```

Or deploy manually to:
- **GitHub Pages** (free)
- **Netlify** (drag & drop)
- **Vercel** (professional)
- Any web server

## 🛡️ Data Safety

Your workout data is stored locally in your browser (localStorage). This means:

✅ **100% Private** - Only you can access your data
✅ **Works Offline** - No internet required
✅ **Fast Performance** - No server delays
✅ **Free Forever** - No subscription costs

⚠️ **Important**: Make regular backups using Settings → Export Data

## 📱 How to Use

### 1. Add Exercises
- Go to "Exercises" tab
- Click "+ Add Exercise"
- Enter name and optional notes
- Exercise is saved automatically

### 2. Log Workouts
- Go to "Log Workout" tab
- Select date and exercise
- Click "+ Add Set" for each set
- Enter weight (kg) and reps
- Click "Save Workout"

### 3. View Progress
- Go to "History" tab
- Filter by exercise or date range
- See all your past workouts

### 4. Backup Data
- Go to "Settings" tab
- Click "Export Data"
- Save the JSON file safely
- Import on new device/browser if needed

## 🎨 Design Philosophy

This app uses a **2024-inspired gentle design** with:
- Soft cream background for eye comfort
- Subtle aurora animations
- Glassmorphism effects
- Smooth, physics-based interactions
- Accessibility-first approach

## 📋 Technical Details

### Built With
- **HTML5** - Semantic structure
- **CSS3** - Modern styling with CSS variables
- **JavaScript ES6+** - Clean, modular code
- **LocalStorage API** - Data persistence

### Browser Support
- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers

### File Structure
```
strengthLog/
├── index.html              # Main application
├── styles.css              # All styling
├── script.js               # Application logic
├── deploy-safely.sh        # Safe deployment script
├── STORAGE_EXPLANATION.md  # How data storage works
├── DEPLOYMENT_GUIDE.md     # Deployment instructions
└── README.md              # This file
```

## 🔧 Development

Want to customize the app? Here's how:

### Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --primary-color: #6366f1;    /* Main accent color */
    --success-color: #22c55e;    /* Success/progress */
    --accent-color: #ec4899;     /* Highlights */
}
```

### Features
The app is modularly built. Main components:
- `StrengthLog` class in `script.js`
- Exercise management methods
- Workout logging methods
- Data persistence methods
- UI rendering methods

### Adding New Features
1. Add UI elements to `index.html`
2. Style in `styles.css`
3. Add functionality to `StrengthLog` class
4. Test thoroughly
5. Update documentation

## 📚 Documentation

- **[Storage Guide](STORAGE_EXPLANATION.md)** - How your data is stored and protected
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Safe deployment without data loss

## 🤝 Contributing

This is a personal project, but suggestions are welcome! The code is clean and well-commented for easy understanding.

## 📄 License

Free to use for personal fitness tracking. Built with ❤️ for strength athletes.

## 🎯 Roadmap

Future enhancements could include:
- Progress charts and analytics
- Workout templates
- Exercise video/image support
- Advanced filtering
- Mobile app version
- Cloud sync option

---

**Happy training! 💪**

> *Remember: The strongest people are those who track their progress consistently.*