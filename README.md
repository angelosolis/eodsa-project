# Competition Management System - Phase 1 MVP

A comprehensive competition management system built with Next.js 15, featuring contestant registration, judge scoring, and automated tabulation.

## 🚀 Features

### Phase 1 MVP Scope

✅ **Contestant Registration**
- Studio vs. private sign-up forms
- Data collection and validation
- Registration confirmation

✅ **Judge Score Sheets**
- Secure judge login system
- Performance selection interface
- Technical, artistic, and overall scoring (1-10 scale)
- Comments and feedback system

✅ **Automated Tabulation**
- Real-time score calculation
- Automatic ranking system
- Live leaderboard updates
- Admin-only dashboard view

## 🛠 Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **Data**: In-memory storage (demo) - ready for SQLite integration
- **Authentication**: Session-based (localStorage for demo)

## 📁 Project Structure

```
app/
├── page.tsx                 # Landing page with navigation
├── register/
│   └── page.tsx            # Contestant registration form
├── judge/
│   ├── login/
│   │   └── page.tsx        # Judge authentication
│   └── dashboard/
│       └── page.tsx        # Judge scoring interface
└── admin/
    └── page.tsx            # Admin dashboard with tabulation

lib/
├── types.ts                # TypeScript interfaces
└── data.ts                 # Data layer and helper functions
```

## 🎯 User Flows

### 1. Contestant Registration
1. Navigate to registration page
2. Select registration type (Studio/Private)
3. Fill out required information
4. Submit and receive confirmation

### 2. Judge Scoring
1. Login with judge credentials
2. Select performance to score
3. Enter technical, artistic, and overall scores
4. Add optional comments
5. Submit scores for real-time tabulation

### 3. Admin Management
1. Login with admin credentials
2. View overview statistics
3. Monitor live rankings
4. Manage contestants and judges
5. Export results (future feature)

## 🔐 Demo Credentials

### Judge Access
- **Email**: judge1@competition.com
- **Password**: judge123

### Admin Access
- **Email**: admin@competition.com
- **Password**: admin123

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

## 📊 Sample Data

The system comes pre-loaded with:
- 2 sample contestants (1 studio, 1 private)
- 2 sample performances
- 2 judges (1 regular, 1 admin)
- Demo scoring data

## 🔄 Real-time Features

- **Live Score Updates**: Scores are calculated instantly upon submission
- **Automatic Rankings**: Contestants are ranked in real-time based on average scores
- **Session Management**: Secure login sessions for judges and admins

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern Interface**: Clean, professional design with Tailwind CSS
- **Interactive Elements**: Hover effects, loading states, and smooth transitions
- **Accessibility**: Proper form labels, keyboard navigation, and screen reader support

## 🔮 Future Enhancements (Phase 2+)

- **Database Integration**: SQLite/PostgreSQL for persistent data
- **Real-time Updates**: WebSocket integration for live updates
- **Advanced Reporting**: PDF exports and detailed analytics
- **Multi-Competition Support**: Manage multiple events
- **Email Notifications**: Automated contestant and judge communications
- **Performance Scheduling**: Time slot management
- **Photo/Video Upload**: Media management for performances
- **Public Leaderboard**: Optional public viewing mode

## 🏗 Architecture Notes

### Data Layer
- Currently uses in-memory storage for demo purposes
- Designed for easy migration to SQLite/database
- Helper functions abstract data operations
- TypeScript interfaces ensure type safety

### Authentication
- Session-based authentication using localStorage (demo)
- Role-based access control (Judge vs Admin)
- Ready for JWT or session-based backend integration

### Scoring System
- Three-category scoring: Technical, Artistic, Overall
- 1-10 scale with decimal precision
- Average calculation across all judges
- Automatic ranking based on total average

## 📝 Development Notes

This is a Phase 1 MVP focusing on core functionality. The system is designed to be:
- **Scalable**: Easy to add new features and expand
- **Maintainable**: Clean code structure and TypeScript safety
- **User-friendly**: Intuitive interface for all user types
- **Production-ready**: Professional design and error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
