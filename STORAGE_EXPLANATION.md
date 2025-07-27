# 📱 Data Storage Guide - Strength Training Log

## 🔒 **How Your Data is Stored (And Why It's Safe)**

### **🏠 Local Storage (localStorage) - What Does This Mean?**

Your data is saved **directly on your computer**, not on an external server. Like a file on your desktop - no one else can access it.

**📍 Where is it stored?**
- **Chrome/Edge**: `C:\Users\[username]\AppData\Local\Google\Chrome\User Data\Default\Local Storage`
- **Firefox**: `C:\Users\[username]\AppData\Roaming\Mozilla\Firefox\Profiles\[profile]\webappsstore.sqlite`
- **Safari**: `~/Library/Safari/LocalStorage`

---

## ✅ **What Gets Saved Automatically:**

### **💪 Exercises**
```javascript
// Each exercise is saved with:
{
  id: "unique-identifier",
  name: "One Hand Assisted Chin Up",
  notes: "Exercise notes and description",
  dateCreated: "2024-12-27T10:30:00.000Z"
}
```

### **🏋️ Workouts**
```javascript
// Each workout is saved with:
{
  id: "unique-identifier",
  exerciseId: "exercise-identifier",
  date: "2024-12-27",
  sets: [
    { weight: 5, reps: 8 },
    { weight: 5, reps: 6 },
    { weight: 0, reps: 10 } // weight 0 = bodyweight
  ],
  dateCreated: "2024-12-27T10:30:00.000Z"
}
```

---

## ⚠️ **When Data Could Be Lost:**

### **🔴 High Risk Situations:**
1. **Clearing browser history** - if you select "delete all data"
2. **Uninstalling browser** - if you completely remove Chrome/Firefox
3. **Manual deletion** - if you click "Clear All Data" in the app
4. **New computer** - data doesn't transfer automatically

### **🟡 Low Risk Situations:**
- **Browser updates** - usually safe
- **Computer restart** - completely safe
- **Closing the website** - completely safe

---

## 🛡️ **How to Protect Your Data:**

### **1. Weekly Backup (Recommended!)**
```
Settings → Export Data → save file
```
- Filename: `strength-log-backup-2024-12-27.json`
- Store safely (Google Drive, Dropbox)

### **2. Automatic Backup (Future Feature)**
Could add weekly reminders to backup your data.

### **3. Multi-Device Backup**
- Save the file to cloud storage
- Import in the same browser on another computer

---

## 🔧 **How to Restore Data:**

### **If Computer Crashes:**
1. Open the website on new computer
2. Settings → Import Data
3. Select your backup file (`.json`)
4. All your data returns!

### **If Deleted by Accident:**
- If you have backup - import it
- If no backup - data is lost 😞

---

## 📊 **Practical Example:**

```
Sunday: Added "Chin Up" exercise ← saved automatically
Monday: Logged 3 sets workout ← saved automatically
Wednesday: Export Data ← safe backup!
Friday: Another workout ← saved automatically
```

---

## 💡 **Tips for Maximum Safety:**

### **🟢 Do:**
- **Weekly backup** - set a regular day
- **Check data saves** - refresh page and verify everything is there
- **Store backup in cloud** - Google Drive/Dropbox

### **🔴 Don't:**
- Don't clear browser history without thinking
- Don't rely on just one computer
- Don't postpone backups

---

## 🎯 **Why We Chose Local Storage:**

### **✅ Advantages:**
- **100% privacy** - your data only
- **Works offline** - no internet needed
- **Very fast** - no delays
- **Free forever** - no server costs

### **⚠️ Disadvantages:**
- **Your responsibility to backup** - you manage safety
- **Single device** - no automatic sync
- **Browser dependent** - if browser deleted, data deleted

---

## ❓ **Frequently Asked Questions:**

**Q: Is the data safe?**
A: Yes, as long as you make backups and don't delete the browser.

**Q: Can anyone see my data?**
A: No! Data is stored only on your computer.

**Q: What happens if I switch browsers?**
A: You'll need to import your backup to the new browser.

**Q: Will data be deleted if I don't use the site?**
A: No, it will remain until you manually delete it.

---

**🎯 Summary: Your data is safe as long as you make weekly backups and don't delete your browser!**