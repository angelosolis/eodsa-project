# E-O-D-S-A Competition Management System

A comprehensive competition management system built with Next.js 15, featuring admin event management, judge assignments, performance scoring, and automated rankings.

## 🚀 Features

### Production Features

✅ **Admin Dashboard**
- Event creation and management
- Judge account creation
- Judge-to-event assignments
- Real-time rankings and statistics

✅ **Judge Scoring System**
- Secure judge login system
- Event-specific performance access
- Technical, artistic, and overall scoring (1-10 scale)
- Comments and feedback system

✅ **Automated Rankings**
- Real-time score calculation
- Automatic ranking system by region, age category, and performance type
- Live leaderboard updates
- Mobile-responsive design

✅ **Event Management**
- Multi-region support (Gauteng, Free State, Mpumalanga)
- Age category organization
- Performance type classification (Solo, Duet, Trio, Group)
- Fee calculation and tracking

## 🛠 Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **Database**: SQLite with @vercel/postgres
- **Authentication**: Session-based with bcrypt password hashing

## 📁 Project Structure

```
app/
├── page.tsx                     # Landing page with navigation
├── portal/
│   └── judge/
│       └── page.tsx            # Judge login portal
├── admin/
│   ├── page.tsx                # Admin dashboard (events, judges, assignments)
│   └── rankings/
│       └── page.tsx            # Rankings and statistics page
├── judge/
│   └── dashboard/
│       └── page.tsx            # Judge scoring interface
└── api/                        # API endpoints for all operations

lib/
├── types.ts                    # TypeScript interfaces and constants
├── database.ts                 # Database operations and schema
└── data.ts                     # Data layer helper functions
```

## 🎯 User Flows

### 1. Admin Management
1. Login with admin credentials
2. Create events with region, age category, performance type
3. Create judge accounts
4. Assign judges to specific events
5. View live rankings and statistics

### 2. Judge Scoring
1. Login with judge credentials
2. Access assigned events and performances
3. Enter technical, artistic, and overall scores
4. Add optional comments
5. Submit scores for automatic ranking calculation

### 3. Rankings Viewing
1. Access rankings from admin dashboard
2. Filter by region, age category, or performance type
3. View live leaderboards with statistics
4. Monitor competition progress in real-time

## 🔐 Demo Credentials

### Admin Access
- **Email**: admin@competition.com
- **Password**: admin123

### Judge Access (created by admin)
- Accounts are created by administrators through the admin dashboard
- Default password format can be customized during creation

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Open browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

4. **Database Initialization**:
   The database will automatically initialize on first run with:
   - Required table structure
   - Default fee schedule
   - Admin account (admin@competition.com / admin123)

## 🔄 Real-time Features

- **Live Score Updates**: Scores are calculated instantly upon submission
- **Automatic Rankings**: Performances are ranked in real-time based on average scores
- **Session Management**: Secure login sessions for judges and admins
- **Mobile Responsive**: Full functionality on all device sizes

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern Interface**: Clean, professional design with consistent color scheme
- **Interactive Elements**: Hover effects, loading states, and smooth transitions
- **Accessibility**: Proper form labels, keyboard navigation, and screen reader support
- **Role-based UI**: Different interfaces for admins and judges

## 🔮 Future Enhancements

- **Contestant Registration Portal**: Public registration system
- **Email Notifications**: Automated contestant and judge communications
- **Performance Scheduling**: Time slot management
- **Photo/Video Upload**: Media management for performances
- **Public Leaderboard**: Optional public viewing mode
- **Advanced Reporting**: PDF exports and detailed analytics
- **Multi-Competition Support**: Season and tournament management

## 🏗 Architecture Notes

### Database Layer
- SQLite database with proper schema design
- Event-driven architecture for scalability
- Foreign key constraints for data integrity
- Optimized indexes for performance

### Authentication
- Session-based authentication with secure password hashing
- Role-based access control (Admin vs Judge)
- Protected routes and API endpoints

### Scoring System
- Three-category scoring: Technical, Artistic, Overall
- 1-10 scale with decimal precision
- Average calculation across all assigned judges
- Automatic ranking based on total scores within categories

## 📝 Production Notes

This system is production-ready and includes:
- **Scalable Architecture**: Event-driven design for multiple competitions
- **Security**: Proper authentication and data validation
- **Performance**: Optimized database queries and responsive UI
- **Maintainability**: Clean code structure and TypeScript safety
- **User Experience**: Intuitive interfaces for all user types

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
