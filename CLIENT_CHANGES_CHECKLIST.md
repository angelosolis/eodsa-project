# EODSA Competition Management System - Client Changes Checklist

## 🎨 **1. UI & Theme Changes**

### Dark Theme Implementation
- [x] **1.1** Switch background to black/very dark gray
- [x] **1.2** Adjust text colors for dark theme readability
- [x] **1.3** Update button styles for dark theme
- [x] **1.4** Ensure all UI components work with dark theme

### EODSA Branding
- [x] **1.5** Add EODSA logo placeholder on landing page
- [x] **1.6** Update page title to "Element of Dance South Africa"
- [x] **1.7** Apply dark theme styling to landing page blocks
- [x] **1.8** Maintain "New User / Existing User" structure with dark styling

---

## 📝 **2. Registration Form Changes**

### ID Format Changes
- [x] **2.1** Change E-O-D-S-A ID format to: one letter + six digits (e.g., "E123456")
- [x] **2.2** Auto-generate E-O-D-S-A IDs for both studios and private dancers
- [x] **2.3** Auto-generate Studio Registration Numbers as: one letter + six digits (e.g., "S123456")
- [x] **2.4** Remove manual Studio Registration Number input field

### Form Structure Updates
- [x] **2.5** Remove "Dance Style" dropdown from main registration form
- [x] **2.6** Keep Studio vs. Private toggle functionality
- [x] **2.7** Update Studio form fields: Studio Name, Contact Person, Studio Address
- [x] **2.8** Update Private form fields: Dancer Name, Age, National ID only
- [x] **2.9** Maintain "Studio Dancers" repeater for studio registrations

### Minors' Consent System
- [x] **2.10** Add Date of Birth field to registration form
- [x] **2.11** Add age validation logic (if DOB < 18 years)
- [x] **2.12** Show Parent/Guardian fields for minors:
  - [x] Parent/Guardian Name (required)
  - [x] Parent/Guardian Email (required)
  - [x] Parent/Guardian Cell (required)
- [x] **2.13** Block minors from self-registration
- [x] **2.14** Allow only parents or studio teachers to register minors
- [x] **2.15** Store guardian information in database

### Privacy Policy
- [x] **2.16** Add Privacy Policy checkbox: "I have read and agree to the EODSA Privacy Policy (POPIA)"
- [x] **2.17** Create Privacy Policy modal popup
- [x] **2.18** Block registration until Privacy Policy is accepted
- [x] **2.19** Add Privacy Policy link functionality

---

## 🤝 **3. NEW: Unified Dancer-Studio Application System**

### Individual Dancer Registration
- [ ] **3.1** Create separate dancer registration system (independent of studios)
- [ ] **3.2** All dancers register individually with personal details
- [ ] **3.3** Generate unique EODSA ID for each individual dancer
- [ ] **3.4** Store dancer approval status (pending/approved/rejected by admin)
- [ ] **3.5** Implement waiver system for minors during individual registration

### Studio Registration (Separate)
- [ ] **3.6** Create studio-only registration system
- [ ] **3.7** Studios register with studio details only (no dancers initially)
- [ ] **3.8** Generate unique Studio Registration Number
- [ ] **3.9** Studio approval status by admin

### Dancer-Studio Application System
- [ ] **3.10** Create "Apply to Studio" functionality for registered dancers
- [ ] **3.11** Dancers can search and apply to multiple studios
- [ ] **3.12** Studio receives dancer applications in their dashboard
- [ ] **3.13** Studio can accept/reject dancer applications
- [ ] **3.14** Track application status (pending/accepted/rejected)
- [ ] **3.15** Allow dancers to withdraw applications
- [ ] **3.16** Prevent duplicate applications to same studio

### Studio Dashboard Updates
- [ ] **3.17** Remove "Add Dancer" functionality from studio dashboard
- [ ] **3.18** Add "Pending Applications" section showing dancers who applied
- [ ] **3.19** Add "My Dancers" section showing accepted dancers
- [ ] **3.20** Add accept/reject buttons for each application
- [ ] **3.21** Show dancer details and approval status in applications

### Dancer Dashboard
- [ ] **3.22** Create dancer dashboard after individual registration
- [ ] **3.23** Show "My Studio Applications" section
- [ ] **3.24** Allow dancers to apply to studios from dashboard
- [ ] **3.25** Show application status for each studio
- [ ] **3.26** Display current studio affiliation if accepted

### Admin Dancer Approval
- [ ] **3.27** Admin dashboard shows all individually registered dancers
- [ ] **3.28** Admin can approve/reject dancers before they can apply to studios
- [ ] **3.29** Only admin-approved dancers can apply to studios
- [ ] **3.30** Admin can see dancer-studio relationships and manage them

### Database Schema Changes
- [ ] **3.31** Create separate `dancers` table (independent of contestants)
- [ ] **3.32** Create `studio_applications` table for dancer-studio relationships
- [ ] **3.33** Add application status tracking
- [ ] **3.34** Remove dancer fields from studio registration
- [ ] **3.35** Update foreign key relationships

---

## 🎭 **4. Performance Entry Flow** (Updated for new system)

### UI Updates
- [x] **4.1** Remove "1 event available" text under Solo/Duet headers

### Mastery Level System
- [x] **4.2** Add Mastery Level dropdown per performance with exact options:
  - [x] Water (Competition)
  - [x] Fire (Advanced)
  - [x] Earth (Eisteddfod)
  - [x] Air (Special Needs)

### Dance Styles Update
- [x] **4.3** Update style list to approved styles only:
  - [x] Ballet, Ballet Repertoire, Lyrical, Contemporary, Jazz
  - [x] Hip-Hop, Freestyle/Disco, Musical Theatre, Acrobatics
  - [x] Tap, Open, Speciality Styles

### Time Validation
- [x] **4.4** Add time-limit validation:
  - [x] Solo ≤ 2 minutes
  - [x] Duet/Trio ≤ 3 minutes
  - [x] Group ≤ 3 minutes 30 seconds

### Item Number System
- [x] **4.5** Add "Item Number" field in admin "View Participants" table
- [x] **4.6** Enable Item Number assignment for program order
- [x] **4.7** Allow judges to type/select Item Number to load performances directly

### Entry Eligibility Updates
- [ ] **4.8** Only admin-approved dancers can enter competitions
- [ ] **4.9** Studio-affiliated dancers need both admin and studio approval
- [ ] **4.10** Independent dancers need only admin approval
- [ ] **4.11** Validate approval status before allowing event entry

---

## 👨‍💼 **5. Admin Dashboard Updates**

### Age Categories Update
- [x] **5.1** Update age-bracket filters to match exact categories:
  - [x] Under 6, 7-9, 10-12, 13-14, 15-17, 18-24, 25-39, 40+, 60+

### Rankings Enhancements
- [x] **5.2** Add "Top 5 by Age Category" filter/tab on Rankings page
- [x] **5.3** Add "Top 5 by Style" filter/tab on Rankings page
- [x] **5.4** Implement dropdown filters for rankings display

### Excel Export Feature
- [x] **5.5** Add "Download to Excel" button in "View Participants"
- [x] **5.6** Include specified fields in Excel export

### Judge Dashboard Updates
- [x] **5.7** Order performances by ascending Item Number in Judge Dashboard
- [x] **5.8** Enable judges to click top-most item to load performance
- [x] **5.9** Allow judges to type Item Number to load specific performance
- [x] **5.10** Remove need to search by name for performance loading

### New Admin Functions
- [ ] **5.11** Add "Dancer Management" section for individual dancer approvals
- [ ] **5.12** Add "Studio Management" section for studio approvals
- [ ] **5.13** Add "Studio-Dancer Relationships" overview
- [ ] **5.14** Bulk approval/rejection tools for efficiency

---

## 💰 **6. Payment Display (Phase 1)**

### Fee Summary
- [x] **6.1** Add fee summary with EODSA official fee structure
- [x] **6.2** Implement mastery level-based pricing and performance type multipliers

---

## 🗄️ **7. Database Schema Updates**

### Existing Updates (Completed)
- [x] **7.1-7.13** Previous schema updates completed

### New Schema for Unified System
- [ ] **7.14** Create independent `dancers` table with approval fields
- [ ] **7.15** Create `studio_applications` table for dancer-studio relationships
- [ ] **7.16** Add application status enum (pending/accepted/rejected/withdrawn)
- [ ] **7.17** Update studio table to remove dancer-related fields
- [ ] **7.18** Add indexes for efficient application queries
- [ ] **7.19** Create junction table for many-to-many dancer-studio relationships

---

## ✅ **Priority Implementation Order (UPDATED)**

### **Phase 1: Unified System Architecture** (2-3 weeks)
- Individual dancer registration system (3.1-3.5)
- Separate studio registration (3.6-3.9) 
- Database schema overhaul (7.14-7.19)

### **Phase 2: Application System** (2-3 weeks)
- Dancer-studio application flow (3.10-3.16)
- Studio dashboard updates (3.17-3.21)
- Dancer dashboard creation (3.22-3.26)

### **Phase 3: Admin & Competition Integration** (1-2 weeks)
- Admin approval systems (3.27-3.30, 5.11-5.14)
- Competition entry validation (4.8-4.11)
- Final testing and refinements

---

## 📋 **Completion Tracking (UPDATED)**

**Total Items: 85 (33 new items added)**
- **Completed: 52** (previous system)
- **New Items: 33** (unified dancer-studio system)
- **In Progress: 0**
- **Pending: 33**
- **Implementation Status: 52/85 (61%)**

### 🔄 **MAJOR SYSTEM REDESIGN IN PROGRESS**
The system is being redesigned to use a unified dancer-studio application model where:
1. **Dancers register individually** and get admin approval
2. **Studios register separately** and get admin approval  
3. **Dancers apply to studios** they want to join
4. **Studios accept/reject** dancer applications
5. **Only approved dancers** can participate in competitions
6. **Two-tier approval**: Admin approval for dancers + Studio approval for affiliation

This creates a more flexible, scalable system that properly models real-world dance studio relationships. 