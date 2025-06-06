# Phase 1 Testing Guide - EODSA Competition Management System

This comprehensive testing guide will walk you through all Phase 1 functionality to ensure the system is working correctly.

## 🚀 Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to:** `http://localhost:3000`

3. **Have these details ready:**
   - Test email addresses (if you plan to re-enable emails later)
   - Various dance styles to test
   - Different age categories and regions

---

## 📋 Phase 1 Testing Checklist

### ✅ **PART 1: LANDING PAGE & NAVIGATION**

**Test the main landing page:**

1. **Visit:** `http://localhost:3000`
2. **Verify you see 3 cards:**
   - 🏢 **Studio Portal** - For studio management
   - 👤 **Existing User** - Enter EODSA ID directly
   - 👋 **New User** - Register new dancer/studio

3. **Test navigation:**
   - Click each card to ensure they redirect properly
   - Verify responsive design on different screen sizes

---

### ✅ **PART 2: REGISTRATION SYSTEM**

#### **A. Individual Dancer Registration**

1. **Go to:** Click "New User" → Select "Register as Individual Dancer"
2. **Fill out form with test data:**
   ```
   Name: Jane Smith
   Date of Birth: 2010-05-15 (make under 18 to test guardian fields)
   National ID: 1234567890123
   Email: jane@test.com
   Phone: +27123456789
   ```

3. **Verify guardian fields appear** (for under 18)
4. **Complete guardian information:**
   ```
   Guardian Name: Mary Smith
   Guardian Email: mary@test.com
   Guardian Phone: +27987654321
   ```

5. **Submit and verify:**
   - ✅ Registration successful message
   - ✅ EODSA ID generated (format: E123456)
   - ✅ "Enter Your First Competition" button appears
   - ✅ No email sent (Phase 1 has emails disabled)

#### **B. Studio Registration**

1. **Go to:** Click "New User" → Select "Register as Studio"
2. **Fill out studio form:**
   ```
   Studio Name: Dance Academy Pro
   Contact Person: John Doe
   Email: studio@test.com
   Phone: +27111222333
   Address: 123 Dance Street, Johannesburg
   Password: StudioPass123
   ```

3. **Submit and verify:**
   - ✅ Registration successful
   - ✅ Studio ID generated (format: S123456)
   - ✅ Redirect to studio login suggestion

---

### ✅ **PART 3: ADMIN SYSTEM SETUP**

#### **A. Admin Login & Initial Setup**

1. **Go to:** `http://localhost:3000/portal/admin`
2. **Login with demo credentials:**
   ```
   Email: admin@competition.com
   Password: admin123
   ```

3. **Verify admin dashboard loads** with 6 tabs:
   - Events, Judges, Assignments, Dancers, Studios, Relationships

#### **B. Create Test Judge**

1. **Click "Judges" tab**
2. **Click "Create Judge" button**
3. **Fill out judge form:**
   ```
   Name: Judge Sarah Wilson
   Email: judge@test.com
   Password: JudgePass123
   Specialization: Ballet, Jazz, Contemporary
   ```

4. **Submit and verify:**
   - ✅ Judge created successfully
   - ✅ Appears in judges list
   - ✅ Not marked as admin
   - ✅ Delete button appears (test later)

#### **C. Create Test Event**

1. **Click "Events" tab**
2. **Click "Create Event" button**
3. **Fill out event form:**
   ```
   Event Name: Gauteng Spring Competition
   Description: Annual spring dance competition
   Region: Gauteng
   Age Category: Under 16
   Performance Type: Solo
   Event Date: [Future date]
   Registration Deadline: [Date before event]
   Venue: Johannesburg Theatre
   Max Participants: 50
   Entry Fee: 250
   ```

4. **Submit and verify:**
   - ✅ Event created successfully
   - ✅ Appears in events list
   - ✅ Shows all correct details

#### **D. Assign Judge to Event**

1. **Click "Assignments" tab**
2. **Click "Assign Judge" button**
3. **Select:**
   - Judge: Judge Sarah Wilson
   - Event: Gauteng Spring Competition

4. **Submit and verify:**
   - ✅ Assignment created
   - ✅ Shows in assignments list

#### **E. Approve Registered Users**

1. **Click "Dancers" tab**
2. **Find the registered dancer (Jane Smith)**
3. **Verify shows "Pending" status**
4. **Click "Approve" button**
5. **Verify:**
   - ✅ Status changes to "Approved"
   - ✅ Success message appears

6. **Click "Studios" tab**
7. **Find the registered studio**
8. **Click "Approve" button**
9. **Verify approval successful**

---

### ✅ **PART 4: STUDIO MANAGEMENT SYSTEM**

#### **A. Studio Login**

1. **Go to:** `http://localhost:3000/studio-login`
2. **Login with studio credentials:**
   ```
   Email: studio@test.com
   Password: StudioPass123
   ```

3. **Verify studio dashboard loads**

#### **B. Add Dancer to Studio**

1. **In studio dashboard, click "My Dancers" tab**
2. **Click "Add Dancer" button**
3. **Enter the approved dancer's EODSA ID:** E123456
4. **Click "Add Dancer"**
5. **Verify:**
   - ✅ Dancer added to studio
   - ✅ Appears in "My Dancers" list
   - ✅ Shows as approved

#### **C. Test Studio Features**

1. **Navigate through all tabs:**
   - Applications (should be empty - disabled in Phase 1)
   - My Dancers (should show added dancer)
   - My Entries (placeholder for future)

2. **Verify studio can manage dancers**

---

### ✅ **PART 5: COMPETITION ENTRY SYSTEM**

#### **A. Access Event Dashboard**

1. **Go to:** `http://localhost:3000/event-dashboard?eodsaId=E123456`
   (Use the EODSA ID from registration)

2. **Verify event dashboard loads**

#### **B. Region Selection**

1. **Verify 3 region cards appear:**
   - Gauteng
   - Free State  
   - Mpumalanga

2. **Click on "Gauteng"**
3. **Verify shows events in that region**

#### **C. Event Entry Process**

1. **Select the "Gauteng Spring Competition" event**
2. **Choose "Solo" performance type**
3. **Fill out performance details:**
   ```
   Mastery Level: Water (Competition)
   Style: Ballet
   Age Category: Under 16
   Routine Title: Spring Awakening
   Music Duration: 1:45
   Choreographer: Local Teacher
   ```

4. **Review entry details and fees**
5. **Submit entry**
6. **Verify:**
   - ✅ Entry submitted successfully
   - ✅ Shows confirmation with item number
   - ✅ Status: "Awaiting Judging"

---

### ✅ **PART 6: JUDGE SCORING SYSTEM**

#### **A. Judge Login**

1. **Go to:** `http://localhost:3000/portal/judge`
2. **Login with judge credentials:**
   ```
   Email: judge@test.com
   Password: JudgePass123
   ```

3. **Verify judge dashboard loads**

#### **B. Score Performance**

1. **Find the submitted performance in assigned events**
2. **Click to score the performance**
3. **Enter scores:**
   ```
   Technical Score: 85
   Artistic Score: 88
   Overall Score: 87
   Comments: Excellent technique and beautiful expression
   ```

4. **Submit score**
5. **Verify:**
   - ✅ Score saved successfully
   - ✅ Performance marked as scored
   - ✅ Comments saved

---

### ✅ **PART 7: RANKINGS SYSTEM**

#### **A. View Rankings**

1. **In admin panel, click "Rankings" button (top right)**
2. **Or go to:** `http://localhost:3000/admin/rankings`

#### **B. Test Ranking Features**

1. **Verify rankings display:**
   - ✅ Shows performances with scores
   - ✅ Displays contestant names
   - ✅ Shows events and styles
   - ✅ Rankings calculated correctly

2. **Test filtering:**
   - Filter by region
   - Filter by age category
   - Filter by performance type
   - Filter by specific events

3. **Test refresh functionality:**
   - Click refresh button
   - Verify updates without page reload

---

### ✅ **PART 8: ADMIN MANAGEMENT FEATURES**

#### **A. Test Judge Deletion**

1. **In admin panel, go to "Judges" tab**
2. **Find a non-admin judge**
3. **Click "Delete" button**
4. **Confirm deletion**
5. **Verify:**
   - ✅ Judge removed from list
   - ✅ Cannot delete admin judges

#### **B. Test Database Cleanup**

1. **Click "Clean DB" button in admin header**
2. **Confirm the action**
3. **Verify:**
   - ✅ Database cleaned successfully
   - ✅ All test data removed
   - ✅ Ready for fresh testing

---

## 🔍 **PART 9: INTEGRATION TESTING**

### **Complete User Journey Test**

1. **Register new dancer**
2. **Admin approves dancer**
3. **Register new studio**
4. **Admin approves studio**
5. **Studio adds dancer**
6. **Create event and assign judge**
7. **Dancer enters competition**
8. **Judge scores performance**
9. **View rankings**
10. **Admin manages system**

---

## 🚫 **PART 10: VERIFY DISABLED FEATURES**

These features should be hidden/disabled in Phase 1:

1. **Email notifications** - No emails should be sent
2. **Email testing interface** - Should be hidden in admin
3. **Advanced features** - Should not be prominent

---

## 🐛 **PART 11: ERROR HANDLING TESTS**

### **Test Error Scenarios:**

1. **Invalid EODSA ID entry**
2. **Duplicate registration attempts**
3. **Invalid login credentials**
4. **Missing required fields**
5. **Unauthorized access attempts**

---

## 📊 **PART 12: PERFORMANCE & UI TESTS**

### **Test Responsiveness:**

1. **Desktop view** (1920x1080)
2. **Tablet view** (768x1024)
3. **Mobile view** (375x667)

### **Test UI Elements:**

1. **Button functionality**
2. **Form validation**
3. **Modal dialogs**
4. **Navigation**
5. **Loading states**

---

## ✅ **EXPECTED RESULTS SUMMARY**

After completing all tests, you should have:

- ✅ **Functional registration system** for dancers and studios
- ✅ **Working admin panel** with all management features
- ✅ **Studio management system** for adding dancers
- ✅ **Competition entry workflow** from registration to scoring
- ✅ **Judge scoring interface** with score submission
- ✅ **Rankings system** with filtering and refresh
- ✅ **All Phase 1 features working** without email dependencies
- ✅ **Clean, responsive UI** across all devices

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues:**

1. **Database errors** - Run `Clean DB` in admin panel
2. **Session issues** - Clear browser localStorage
3. **Port conflicts** - Ensure port 3000 is available
4. **Build errors** - Run `npm install` and restart server

### **Reset for Fresh Testing:**

1. Use "Clean DB" function in admin panel
2. Or restart the server to reset in-memory data
3. Clear browser cache and localStorage

---

## 📞 **Support**

If you encounter any issues during testing:

1. Check browser console for errors
2. Verify all required fields are filled
3. Ensure proper user permissions
4. Try refreshing the page
5. Use "Clean DB" to reset test data

**Note:** This testing guide covers all core Phase 1 functionality. Email features are intentionally disabled and should not be tested until Phase 2. 