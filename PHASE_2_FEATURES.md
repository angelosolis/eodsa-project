# Phase 2+ Features - Re-enabling Guide

This document outlines all the features that were **disabled** or **hidden** for Phase 1 and provides step-by-step instructions on how to re-enable them for future development phases.

## 📧 Email System

The complete email notification system was disabled for Phase 1 but preserved in the codebase.

### What Was Disabled
- Dancer registration confirmation emails
- Studio registration confirmation emails
- Competition entry confirmation emails
- Dancer approval/rejection notification emails
- Email testing interface in admin panel

### How to Re-enable

#### 1. Dancer Registration Emails
**File:** `app/api/dancers/register/route.ts`

**Current (Disabled):**
```typescript
// Email system disabled for Phase 1
// if (email) {
//   try {
//     await emailService.sendDancerRegistrationEmail(name, email, result.eodsaId);
//     console.log('Registration email sent successfully to:', email);
//   } catch (emailError) {
//     console.error('Failed to send registration email:', emailError);
//     // Don't fail the registration if email fails
//   }
// }
```

**To Re-enable:**
```typescript
// Send registration confirmation email if email is provided
if (email) {
  try {
    await emailService.sendDancerRegistrationEmail(name, email, result.eodsaId);
    console.log('Registration email sent successfully to:', email);
  } catch (emailError) {
    console.error('Failed to send registration email:', emailError);
    // Don't fail the registration if email fails
  }
}
```

#### 2. Studio Registration Emails
**File:** `app/api/studios/route.ts`

**Current (Disabled):**
```typescript
// Email system disabled for Phase 1
// try {
//   await emailService.sendStudioRegistrationEmail(
//     body.name,
//     body.contactPerson,
//     body.email,
//     result.registrationNumber
//   );
//   console.log('Studio registration email sent successfully to:', body.email);
// } catch (emailError) {
//   console.error('Failed to send studio registration email:', emailError);
//   // Don't fail the registration if email fails
// }
```

**To Re-enable:**
```typescript
// Send studio registration confirmation email
try {
  await emailService.sendStudioRegistrationEmail(
    body.name,
    body.contactPerson,
    body.email,
    result.registrationNumber
  );
  console.log('Studio registration email sent successfully to:', body.email);
} catch (emailError) {
  console.error('Failed to send studio registration email:', emailError);
  // Don't fail the registration if email fails
}
```

#### 3. Competition Entry Emails
**File:** `app/api/event-entries/route.ts`

**Current (Disabled):**
```typescript
// Email system disabled for Phase 1
// try {
//   // Get contestant details for email
//   const contestant = await db.getContestantById(body.contestantId);
//   if (contestant && contestant.email) {
//     await emailService.sendCompetitionEntryEmail(
//       contestant.name,
//       contestant.email,
//       event.name,
//       body.itemName,
//       event.performanceType,
//       body.calculatedFee
//     );
//     console.log('Competition entry email sent successfully to:', contestant.email);
//   }
// } catch (emailError) {
//   console.error('Failed to send competition entry email:', emailError);
//   // Don't fail the entry if email fails
// }
```

**To Re-enable:**
```typescript
// Send competition entry confirmation email
try {
  // Get contestant details for email
  const contestant = await db.getContestantById(body.contestantId);
  if (contestant && contestant.email) {
    await emailService.sendCompetitionEntryEmail(
      contestant.name,
      contestant.email,
      event.name,
      body.itemName,
      event.performanceType,
      body.calculatedFee
    );
    console.log('Competition entry email sent successfully to:', contestant.email);
  }
} catch (emailError) {
  console.error('Failed to send competition entry email:', emailError);
  // Don't fail the entry if email fails
}
```

#### 4. Dancer Approval/Rejection Emails
**File:** `app/api/admin/dancers/route.ts`

**Current (Disabled) - Approval:**
```typescript
// Email system disabled for Phase 1
// if (dancer && dancer.email) {
//   try {
//     await emailService.sendDancerApprovalEmail(
//       dancer.name,
//       dancer.email,
//       dancer.eodsaId
//     );
//     console.log('Approval email sent successfully to:', dancer.email);
//   } catch (emailError) {
//     console.error('Failed to send approval email:', emailError);
//     // Don't fail the approval if email fails
//   }
// }
```

**To Re-enable - Approval:**
```typescript
// Send approval email if dancer has email
if (dancer && dancer.email) {
  try {
    await emailService.sendDancerApprovalEmail(
      dancer.name,
      dancer.email,
      dancer.eodsaId
    );
    console.log('Approval email sent successfully to:', dancer.email);
  } catch (emailError) {
    console.error('Failed to send approval email:', emailError);
    // Don't fail the approval if email fails
  }
}
```

**Current (Disabled) - Rejection:**
```typescript
// Email system disabled for Phase 1
// if (dancer && dancer.email) {
//   try {
//     await emailService.sendDancerRejectionEmail(
//       dancer.name,
//       dancer.email,
//       dancer.eodsaId,
//       rejectionReason
//     );
//     console.log('Rejection email sent successfully to:', dancer.email);
//   } catch (emailError) {
//     console.error('Failed to send rejection email:', emailError);
//     // Don't fail the rejection if email fails
//   }
// }
```

**To Re-enable - Rejection:**
```typescript
// Send rejection email if dancer has email
if (dancer && dancer.email) {
  try {
    await emailService.sendDancerRejectionEmail(
      dancer.name,
      dancer.email,
      dancer.eodsaId,
      rejectionReason
    );
    console.log('Rejection email sent successfully to:', dancer.email);
  } catch (emailError) {
    console.error('Failed to send rejection email:', emailError);
    // Don't fail the rejection if email fails
  }
}
```

#### 5. Email Testing Interface
**File:** `app/admin/page.tsx`

**Current (Hidden):**
```typescript
{/* Email testing disabled for Phase 1 */}
{/* <button
  onClick={() => setShowEmailTestModal(true)}
  className="inline-flex items-center space-x-1 sm:space-x-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base"
>
  <span className="text-sm sm:text-base">📧</span>
  <span className="font-medium">Email Test</span>
</button> */}
```

**To Re-enable:**
```typescript
<button
  onClick={() => setShowEmailTestModal(true)}
  className="inline-flex items-center space-x-1 sm:space-x-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base"
>
  <span className="text-sm sm:text-base">📧</span>
  <span className="font-medium">Email Test</span>
</button>
```

**And re-enable the modal:**
```typescript
{/* Email Test Modal */}
{showEmailTestModal && (
```

**Instead of:**
```typescript
{/* Email Test Modal - Disabled for Phase 1 */}
{false && showEmailTestModal && (
```

## 🔧 Email Configuration Required

Before re-enabling emails, ensure your environment variables are configured:

```bash
# .env.local
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@eodsa.com
```

## 📝 Advanced Features (Already Built but Not Emphasized)

These features exist but are not prominently featured in Phase 1:

### 1. Waiver Management System
- **Location:** Fully implemented in database and APIs
- **Status:** Working but not emphasized in Phase 1 UI
- **To Emphasize:** Add more prominent links in studio dashboard

### 2. Complex Approval Workflows
- **Location:** `app/api/admin/dancers/route.ts` and studio dashboard
- **Status:** Working but simplified in Phase 1
- **To Enhance:** Add bulk approval features, detailed approval reasons

### 3. Advanced Studio Management
- **Location:** Studio dashboard with full dancer management
- **Status:** Fully working
- **To Enhance:** Add advanced analytics, performance tracking

### 4. Comprehensive Reporting
- **Location:** Rankings system with filtering
- **Status:** Basic version working
- **To Enhance:** Add export features, detailed analytics

## 🚀 Testing Re-enabled Features

After re-enabling any feature:

1. **Test Email Configuration:**
   ```bash
   # Visit admin panel
   # Click "Email Test" button
   # Test SMTP connection
   # Send test email
   ```

2. **Test Registration Flows:**
   - Register a new dancer
   - Register a new studio
   - Check email delivery

3. **Test Competition Workflow:**
   - Enter a competition
   - Check confirmation emails

4. **Test Admin Workflows:**
   - Approve/reject dancers
   - Check notification emails

## 📦 Dependencies

All email dependencies are already installed:
- `nodemailer` - Email sending
- `@types/nodemailer` - TypeScript support
- Email service is in `lib/email.ts`

## 🔄 Phase Rollout Strategy

**Phase 1 (Current):** Core functionality only
**Phase 2:** Re-enable email notifications
**Phase 3:** Advanced features and analytics
**Phase 4:** Full feature set with enhancements

---

## 📞 Support

If you encounter issues re-enabling features:
1. Check console logs for errors
2. Verify environment variables
3. Test email configuration
4. Ensure database schema is up to date

**Note:** All disabled features are fully implemented and tested - they were simply hidden/disabled for Phase 1 to provide a cleaner initial experience. 