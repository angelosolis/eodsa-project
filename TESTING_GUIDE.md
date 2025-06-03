# EODSA Competition Management System - Testing Guide

## 🧪 **Pre-Testing Setup**

### 1. Environment Setup
```bash
# Start the development server
npm run dev

# Access the application at http://localhost:3000
```

### 2. Database Reset (if needed)
- Navigate to `/admin` 
- Use "Clean Database" function to reset all data
- This preserves admin credentials while clearing contestant data

---

## 🎯 **Core Functionality Testing**

### **Phase 1: Registration System Testing**

#### **Test 1.1: Studio Registration**
**Expected Behavior**: Studio can register multiple dancers with auto-generated IDs

**Steps**:
1. Navigate to `/register`
2. Select "Studio" registration type
3. Fill in studio information:
   - Studio Name: "Test Dance Academy"
   - Contact Person: "Jane Smith"
   - Studio Address: "123 Dance Street, Johannesburg"
   - Email: "studio@test.com"
   - Phone: "011-123-4567"
   - Date of Birth: Use adult DOB (no guardian required)
4. Accept Privacy Policy
5. Add multiple dancers:
   - Dancer 1: "Alice Johnson", Age 16, DOB: 2008-01-15, Style: "Ballet", National ID: "0801159876543"
   - Dancer 2: "Bob Wilson", Age 14, DOB: 2010-03-20, Style: "Jazz", National ID: "1003209876543"
6. Submit registration

**Expected Results**:
- ✅ Auto-generated E-O-D-S-A ID (format: E123456)
- ✅ Auto-generated Studio Registration Number (format: S123456)
- ✅ Success message with studio details
- ✅ Dancers saved with date of birth fields

#### **Test 1.2: Private Registration (Adult)**
**Expected Behavior**: Adult can register themselves without guardian info

**Steps**:
1. Navigate to `/register`
2. Select "Private" registration type
3. Fill in personal information:
   - Name: "John Doe"
   - Email: "john@test.com" 
   - Phone: "082-555-1234"
   - Date of Birth: "1990-05-15" (adult)
4. Accept Privacy Policy
5. Add dancer information:
   - Name: "John Doe"
   - Age: 33
   - DOB: "1990-05-15"
   - Style: "Contemporary"
   - National ID: "9005159876543"
6. Submit registration

**Expected Results**:
- ✅ Registration successful without guardian fields
- ✅ E-O-D-S-A ID generated
- ✅ No guardian information required

#### **Test 1.3: Private Registration (Minor) - Should Show Guardian Fields**
**Expected Behavior**: Minor registration requires guardian information

**Steps**:
1. Navigate to `/register`
2. Select "Private" registration type
3. Fill in personal information:
   - Name: "Sarah Young"
   - Email: "parent@test.com"
   - Phone: "083-555-7890"
   - Date of Birth: "2010-08-10" (minor - 13 years old)
4. Verify guardian fields appear:
   - Guardian Name: "Mary Young"
   - Guardian Email: "parent@test.com"
   - Guardian Cell: "083-555-7890"
5. Accept Privacy Policy
6. Submit registration

**Expected Results**:
- ✅ Guardian fields displayed for minors
- ✅ Registration blocked if guardian info missing
- ✅ Successful registration with guardian data saved

#### **Test 1.4: Privacy Policy Validation**
**Expected Behavior**: Registration blocked without privacy policy acceptance

**Steps**:
1. Fill out complete registration form
2. Leave Privacy Policy checkbox unchecked
3. Attempt to submit

**Expected Results**:
- ❌ Registration blocked
- ✅ Error message about privacy policy requirement

---

### **Phase 2: Event Dashboard & Performance Entry Testing**

#### **Test 2.1: Event Dashboard Access**
**Steps**:
1. Navigate to `/event-dashboard?eodsaId=E123456` (use generated ID from registration)
2. Verify dark theme implementation
3. Check region selection (Gauteng, Free State, Mpumalanga)

**Expected Results**:
- ✅ Dark theme with purple/pink accents
- ✅ Region cards displayed
- ✅ Performance type options (Solo, Duet, Trio, Group)

#### **Test 2.2: Solo Performance Entry**
**Steps**:
1. Select "Gauteng" region
2. Select "Solo" performance type
3. Complete 4-step process:
   
   **Step 1 - Event Selection**:
   - Select available event
   - Verify EODSA fee structure displayed
   
   **Step 2 - Performance Details**:
   - Select 1 participant (for solo)
   - Item Name: "Swan Lake Variation"
   - Choreographer: "Marius Petipa"
   - Mastery Level: "Water (Competition)"
   - Item Style: "Ballet"
   - Duration: 1.5 minutes (within 2-minute limit)
   
   **Step 3 - Payment Method**:
   - Verify EODSA fee breakdown:
     - Registration Fee: R250 (1 participant)
     - Performance Fee: R300 (Solo)
     - Total: R550
   - Select payment method
   
   **Step 4 - Review & Submit**:
   - Verify all details correct
   - Submit entry

**Expected Results**:
- ✅ Proper fee calculation (R250 + R300 = R550)
- ✅ Time validation (≤ 2 minutes for solo)
- ✅ Participant limit enforced (exactly 1 for solo)
- ✅ Success confirmation page

#### **Test 2.3: Group Performance Entry**
**Steps**:
1. Use studio account with multiple dancers
2. Select "Group" performance type
3. Step 2 - Select 4+ participants
4. Set duration to 2.5 minutes (within 3-minute limit)
5. Mastery Level: "Earth (Eisteddfod)"

**Expected Results**:
- ✅ Fee calculation: R150 registration per participant + R180 performance per participant
- ✅ Example: 5 participants = (R150 × 5) + (R180 × 5) = R1,650
- ✅ Time validation (≤ 3 minutes for group)

#### **Test 2.4: Time Limit Validation**
**Steps**:
1. Start solo entry
2. Set duration to 3 minutes (exceeds 2-minute limit)
3. Attempt to proceed

**Expected Results**:
- ❌ Validation error displayed
- ❌ Cannot proceed to next step
- ✅ Error message: "Duration exceeds maximum allowed for Solo (2 minutes)"

#### **Test 2.5: Mastery Level Fee Differences**
**Test Competitive vs Eisteddfod pricing**:

**Solo - Water (Competition)**:
- Registration: R250
- Performance: R300
- Total: R550

**Solo - Earth (Eisteddfod)**:
- Registration: R150  
- Performance: R200
- Total: R350

**Expected Results**:
- ✅ Different pricing based on mastery level
- ✅ Competitive levels cost more than Eisteddfod

---

### **Phase 3: Admin Dashboard Testing**

#### **Test 3.1: Admin Login & Dashboard Access**
**Steps**:
1. Navigate to `/admin`
2. Login with admin credentials
3. Verify dark theme implementation

**Expected Results**:
- ✅ Dark theme with proper contrast
- ✅ Event management interface
- ✅ Navigation to rankings and participant views

#### **Test 3.2: Event Creation**
**Steps**:
1. In admin dashboard, create new event:
   - Name: "EODSA Regional Championships 2024 - Test"
   - Region: "Gauteng"
   - Performance Type: "Solo"
   - Age Category: "13-14"
   - Date: Future date
   - Venue: "Test Venue"
   - Entry Fee: R300

**Expected Results**:
- ✅ Event created successfully
- ✅ Appears in event dashboard
- ✅ Available for registration

#### **Test 3.3: View Participants & Excel Export**
**Steps**:
1. Navigate to event with entries
2. Click "View Participants"
3. Verify participant data displays:
   - Item Number
   - E-O-D-S-A ID  
   - Name
   - Performance Type
   - Mastery Level
   - Style
   - Age Category
   - Fee
   - Qualified for Nationals status
4. Click "Download to Excel" button

**Expected Results**:
- ✅ All participant data visible
- ✅ Excel file downloads successfully
- ✅ All required fields included in export

#### **Test 3.4: Rankings with Filters**
**Steps**:
1. Navigate to `/admin/rankings`
2. Test filter options:
   - "All Rankings"
   - "Top 5 by Age Category"
   - "Top 5 by Style"
3. Test dropdown filters:
   - Region filter
   - Age Category filter
   - Performance Type filter
   - Style filter

**Expected Results**:
- ✅ Rankings display correctly
- ✅ Filters work properly
- ✅ Top 5 views group data correctly

---

### **Phase 4: Judge Dashboard Testing**

#### **Test 4.1: Judge Login**
**Steps**:
1. Navigate to `/portal/judge`
2. Create/login with judge account
3. Verify judge dashboard access

#### **Test 4.2: Performance Ordering by Item Number**
**Steps**:
1. In judge dashboard, view assigned performances
2. Verify performances ordered by ascending item number
3. Test item number search functionality

**Expected Results**:
- ✅ Performances listed by item number (1, 2, 3, etc.)
- ✅ Can type item number to jump to specific performance
- ✅ Top-most item loads first

#### **Test 4.3: Scoring Functionality**
**Steps**:
1. Select a performance
2. Enter scores:
   - Technical Score: 8.5
   - Artistic Score: 9.0
   - Overall Score: 8.7
   - Comments: "Excellent technique"
3. Submit score

**Expected Results**:
- ✅ Score saved successfully
- ✅ Contributes to rankings calculation

---

### **Phase 5: Database & API Testing**

#### **Test 5.1: Age Category Validation**
**Verify new age categories work**:
- 4 & Under
- 6 & Under  
- 7-9
- 10-12
- 13-14
- 15-17
- 18-24
- 25-39
- 40+
- 60+

#### **Test 5.2: Mastery Level Descriptions**
**Verify mastery levels display correctly**:
- **Earth (Eisteddfod)**: Beginners, cheaper fees, no nationals
- **Water (Competition)**: General competing, qualifies for nationals  
- **Fire (Advanced)**: Top 10%, qualifies for nationals
- **Air (Special Needs)**: Differently-abled dancers

#### **Test 5.3: Time Limits by Performance Type**
**Verify time validation**:
- Solo: ≤ 2 minutes
- Duet: ≤ 2 minutes  
- Trio: ≤ 2 minutes
- Group: ≤ 3 minutes

---

## 🎨 **UI/UX Testing**

### **Test 6.1: Dark Theme Consistency**
**Check across all pages**:
- ✅ Landing page
- ✅ Registration forms
- ✅ Event dashboard
- ✅ Performance entry
- ✅ Admin dashboard
- ✅ Judge portal

**Expected**: Consistent dark gray/black background with purple/pink accents

### **Test 6.2: Responsive Design**
**Test on different screen sizes**:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

**Expected**: All functionality accessible and properly laid out

### **Test 6.3: EODSA Branding**
**Verify branding elements**:
- ✅ Page title: "Element of Dance South Africa"
- ✅ EODSA logo placeholder on landing page
- ✅ Purple/pink color scheme throughout

---

## 🧮 **Fee Calculation Testing**

### **Test 7.1: Solo Package Deals (Competitive/Advanced)**
**Test multiple solo discounts**:

**1 Solo (Water/Fire)**:
- Registration: R250
- Performance: R300
- Total: R550

**2 Solos (Water/Fire)**:
- Registration: R250  
- Performance: R520 (package deal)
- Total: R770

**3 Solos (Water/Fire)**:
- Registration: R250
- Performance: R700 (package deal)  
- Total: R950

**4+ Solos (Water/Fire)**:
- Registration: R250
- Performance: R700 + (additional × R180)
- Example 4 solos: R250 + R700 + R180 = R1,130

### **Test 7.2: Group Fee Calculations**
**Test per-dancer pricing**:

**5-person Group (Water - Competition)**:
- Registration: R250 × 5 = R1,250
- Performance: R180 × 5 = R900
- Total: R2,150

**5-person Group (Earth - Eisteddfod)**:
- Registration: R150 × 5 = R750
- Performance: R180 × 5 = R900  
- Total: R1,650

---

## 🚨 **Error Handling Testing**

### **Test 8.1: Invalid Data Handling**
- Try submitting forms with missing required fields
- Test with invalid email formats
- Test with negative ages or durations

### **Test 8.2: Database Constraints**
- Try registering same email twice
- Test with malformed E-O-D-S-A IDs

### **Test 8.3: Network Error Simulation**
- Test form submission with network disconnected
- Verify proper error messages display

---

## ✅ **Success Criteria**

### **Registration System**
- [x] Studios can register multiple dancers
- [x] Private users register single dancer  
- [x] Guardian info required for minors
- [x] Privacy policy enforcement
- [x] Auto-generated ID formats

### **Performance Entry**
- [x] 4-step entry process works
- [x] EODSA fee calculations accurate
- [x] Time limit validation works
- [x] Mastery level pricing applied

### **Admin Dashboard**  
- [x] Event creation and management
- [x] Participant viewing with all fields
- [x] Excel export functionality
- [x] Rankings with filters

### **Judge Dashboard**
- [x] Item number ordering
- [x] Performance search functionality
- [x] Scoring system works

### **Overall System**
- [x] Dark theme consistent
- [x] EODSA branding applied
- [x] All 52 requirements implemented
- [x] Production build successful

---

## 📝 **Bug Reporting Template**

When reporting issues, please include:

**Bug Report Format**:
```
**Bug Title**: Brief description
**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Result**: What should happen
**Actual Result**: What actually happened
**Browser/Device**: Chrome 120 / Windows 11
**Screenshots**: If applicable
```

---

## 🎯 **Final Verification Checklist**

- [ ] All registration types work correctly
- [ ] Fee calculations match EODSA pricing exactly
- [ ] Time limits enforced properly
- [ ] Admin can manage events and view participants
- [ ] Judges can score performances by item number
- [ ] Excel export includes all required fields
- [ ] Dark theme consistent across all pages
- [ ] All 52 client requirements met
- [ ] System ready for production deployment

**Testing Complete**: Date: __________ | Tester: __________ | Status: __________ 