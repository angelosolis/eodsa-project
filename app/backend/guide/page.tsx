'use client';

import Link from 'next/link';
import { MASTERY_LEVELS, NATIONAL_MASTERY_LEVELS } from '@/lib/types';
import { ThemeProvider, useTheme, getThemeClasses } from '@/components/providers/ThemeProvider';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AdminAccessSplash, useRequireAdminSession } from '@/hooks/useRequireAdminSession';

const REGIONAL_MEDALS = [
  { range: 'Below 65%', medal: 'Bronze', emoji: '🥉' },
  { range: '65% – 74%', medal: 'Silver', emoji: '🥈' },
  { range: '75% – 79%', medal: 'Silver+', emoji: '🥈+' },
  { range: '80% – 89%', medal: 'Gold', emoji: '🥇' },
  { range: '90% and above', medal: 'Pro Gold', emoji: '🏆', highlight: true },
];

const NATIONAL_MEDALS = [
  { range: 'Below 70%', medal: 'Bronze', emoji: '🥉' },
  { range: '70% – 74%', medal: 'Silver', emoji: '🥈' },
  { range: '75% – 79%', medal: 'Silver+', emoji: '🥈+' },
  { range: '80% – 84%', medal: 'Gold', emoji: '🥇' },
  { range: '85% – 89%', medal: 'Legend', emoji: '🏅' },
  { range: '90% – 94%', medal: 'Opus', emoji: '🎖️' },
  { range: '95% and above', medal: 'Elite', emoji: '🏆', highlight: true },
];

const COMPARISON_ROWS = [
  {
    area: 'Who can enter',
    regional: 'Open to all registered dancers',
    national: 'Only dancers who qualified from a regional (default: 75%+ average, scores published)',
  },
  {
    area: 'Qualification on create',
    regional: 'Turned off automatically',
    national: 'Turned on automatically (source: Regional, min 75%)',
  },
  {
    area: 'Region field',
    regional: 'Set to the province (e.g. Gauteng, Western Cape)',
    national: 'Set to Nationals',
  },
  {
    area: 'Top medal tier',
    regional: 'Pro Gold (90%+)',
    national: 'Elite (95%+)',
  },
  {
    area: 'Mastery levels',
    regional: 'All four — Water, Fire, Earth, Air',
    national: 'Two only — Water (Competitive) and Fire (Advanced)',
  },
  {
    area: 'Scoring rubric',
    regional: '5 categories × 20 points = 100 per judge',
    national: '5 categories × 20 points = 100 per judge',
  },
  {
    area: 'Entry fees',
    regional: 'Configured per event in admin',
    national: 'Configured per event in admin',
  },
  {
    area: 'Live / Virtual',
    regional: 'Set via Event Mode (Live, Virtual, or Hybrid)',
    national: 'Set via Event Mode (Live, Virtual, or Hybrid)',
  },
  {
    area: 'Certificates & rankings medals',
    regional: 'Regional medal ladder applied',
    national: 'National medal ladder applied',
  },
  {
    area: 'Live results announcement',
    regional: 'Available in Admin → Rankings',
    national: 'Not available (regional-only feature)',
  },
  {
    area: 'Qualifies dancers for nationals',
    regional: 'Yes — published regional scores ≥ threshold count',
    national: 'N/A — this is nationals',
  },
];

function BackendGuidePageContent() {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const { authorized, checking } = useRequireAdminSession();

  if (checking || !authorized) {
    return <AdminAccessSplash />;
  }

  return (
    <div className={`min-h-screen ${themeClasses.mainBg}`}>
      <header className={`${themeClasses.headerBg} backdrop-blur-lg shadow-xl border-b ${themeClasses.headerBorder}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Link
                  href="/backend"
                  className={`text-sm ${themeClasses.textSecondary} hover:underline`}
                >
                  ← Back to Backend Dashboard
                </Link>
              </div>
              <h1 className={`text-2xl sm:text-3xl font-black ${themeClasses.accentGradientText}`}>
                Admin Guide
              </h1>
              <p className={`${themeClasses.textSecondary} text-sm sm:text-base mt-1`}>
                How the system works — especially Nationals vs Regionals
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/backend"
                className={`px-4 py-2 ${themeClasses.buttonSecondary} rounded-lg text-sm font-medium`}
              >
                Backend
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} ${themeClasses.cardRadius} p-6 sm:p-8`}>
          <h2 className={`text-xl font-bold ${themeClasses.heading2} mb-6 flex items-center gap-2`}>
            <span>📋</span> Quick how-to: setting up events
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-5 rounded-xl border ${theme === 'dark' ? 'bg-green-900/10 border-green-700/30' : 'bg-green-50 border-green-200'}`}>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <span>🏘️</span> Regional event
              </h3>
              <ol className={`space-y-2 text-sm ${themeClasses.textSecondary} list-decimal list-inside`}>
                <li>Admin Dashboard → Events → Create New Event</li>
                <li>Select <strong>Regional</strong> event type</li>
                <li>Set <strong>Region</strong> to the province (e.g. Gauteng)</li>
                <li>Choose Live / Virtual / Hybrid mode</li>
                <li>Configure fees, dates, judges</li>
                <li>Publish scores when ready — qualifying dancers can then enter nationals</li>
              </ol>
            </div>
            <div className={`p-5 rounded-xl border ${theme === 'dark' ? 'bg-purple-900/10 border-purple-700/30' : 'bg-purple-50 border-purple-200'}`}>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <span>🏆</span> National event
              </h3>
              <ol className={`space-y-2 text-sm ${themeClasses.textSecondary} list-decimal list-inside`}>
                <li>Admin Dashboard → Events → Create New Event</li>
                <li>Select <strong>National</strong> event type (qualification auto-enables)</li>
                <li>Set <strong>Region</strong> to <strong>Nationals</strong></li>
                <li>Choose Live / Virtual / Hybrid mode</li>
                <li>Configure fees, dates, judges</li>
                <li>Only dancers with published regional scores ≥ 75% can enter (unless manually qualified)</li>
              </ol>
            </div>
          </div>
        </section>

        <section className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} ${themeClasses.cardRadius} p-6 sm:p-8`}>
          <h2 className={`text-xl font-bold ${themeClasses.heading2} mb-2 flex items-center gap-2`}>
            <span>⚖️</span> Nationals vs Regionals — full comparison
          </h2>
          <p className={`${themeClasses.textSecondary} text-sm mb-6`}>
            This reflects how the system behaves in production today.
          </p>

          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className={`border-b-2 ${themeClasses.cardBorder}`}>
                  <th className={`text-left py-3 px-4 font-bold ${themeClasses.textPrimary}`}>Area</th>
                  <th className={`text-left py-3 px-4 font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>
                    🏘️ Regional
                  </th>
                  <th className={`text-left py-3 px-4 font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-700'}`}>
                    🏆 National
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr
                    key={row.area}
                    className={`border-b ${themeClasses.cardBorder} ${i % 2 === 0 ? (theme === 'dark' ? 'bg-gray-800/20' : 'bg-gray-50/50') : ''}`}
                  >
                    <td className={`py-3 px-4 font-semibold ${themeClasses.textPrimary} whitespace-nowrap`}>
                      {row.area}
                    </td>
                    <td className={`py-3 px-4 ${themeClasses.textSecondary}`}>{row.regional}</td>
                    <td className={`py-3 px-4 ${themeClasses.textSecondary}`}>{row.national}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} ${themeClasses.cardRadius} p-6`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>
              <span>🏘️</span> Regional medal ladder
            </h3>
            <div className="space-y-2">
              {REGIONAL_MEDALS.map((item) => (
                <div
                  key={item.medal}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg ${
                    item.highlight
                      ? theme === 'dark' ? 'bg-yellow-900/30 border border-yellow-600/40' : 'bg-yellow-100 border border-yellow-300'
                      : theme === 'dark' ? 'bg-gray-800/40' : 'bg-gray-50'
                  }`}
                >
                  <span className={`font-medium ${themeClasses.textPrimary}`}>{item.range}</span>
                  <span className="flex items-center gap-2 font-semibold">
                    <span>{item.emoji}</span>
                    <span>{item.medal}</span>
                  </span>
                </div>
              ))}
            </div>
            <p className={`mt-4 text-xs ${themeClasses.textMuted}`}>Top tier: Pro Gold at 90%+</p>
          </div>

          <div className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} ${themeClasses.cardRadius} p-6`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-700'}`}>
              <span>🏆</span> National medal ladder
            </h3>
            <div className="space-y-2">
              {NATIONAL_MEDALS.map((item) => (
                <div
                  key={item.medal}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg ${
                    item.highlight
                      ? theme === 'dark' ? 'bg-yellow-900/30 border border-yellow-600/40' : 'bg-yellow-100 border border-yellow-300'
                      : theme === 'dark' ? 'bg-gray-800/40' : 'bg-gray-50'
                  }`}
                >
                  <span className={`font-medium ${themeClasses.textPrimary}`}>{item.range}</span>
                  <span className="flex items-center gap-2 font-semibold">
                    <span>{item.emoji}</span>
                    <span>{item.medal}</span>
                  </span>
                </div>
              ))}
            </div>
            <p className={`mt-4 text-xs ${themeClasses.textMuted}`}>Top tier: Elite at 95%+</p>
          </div>
        </section>

        <section className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} ${themeClasses.cardRadius} p-6 sm:p-8`}>
          <h2 className={`text-xl font-bold ${themeClasses.heading2} mb-2 flex items-center gap-2`}>
            <span>🎭</span> Mastery levels
          </h2>
          <p className={`${themeClasses.textSecondary} text-sm mb-6`}>
            Regionals and nationals use <strong>different</strong> mastery level options. Only Water and Fire dancers qualify through to nationals.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className={`text-base font-bold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>
                <span>🏘️</span> Regional — all four levels
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MASTERY_LEVELS.map((level) => (
                  <div
                    key={level}
                    className={`px-4 py-3 rounded-xl border text-center font-medium ${themeClasses.cardBorder} ${theme === 'dark' ? 'bg-gray-800/40' : 'bg-gray-50'}`}
                  >
                    {level}
                  </div>
                ))}
              </div>
              <p className={`mt-3 text-xs ${themeClasses.textMuted}`}>
                Earth (Eisteddfod) and Air (Special Needs) are regional-only categories and do not qualify for nationals.
              </p>
            </div>
            <div>
              <h3 className={`text-base font-bold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-700'}`}>
                <span>🏆</span> National — two levels only
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {NATIONAL_MASTERY_LEVELS.map((level) => (
                  <div
                    key={level}
                    className={`px-4 py-3 rounded-xl border text-center font-medium ${theme === 'dark' ? 'bg-purple-900/20 border-purple-700/40' : 'bg-purple-50 border-purple-200'}`}
                  >
                    {level}
                  </div>
                ))}
              </div>
              <p className={`mt-3 text-xs ${themeClasses.textMuted}`}>
                Nationals use the competitive (Water) and advanced (Fire) tracks only.
              </p>
            </div>
          </div>
        </section>

        <section className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} ${themeClasses.cardRadius} p-6 sm:p-8`}>
          <h2 className={`text-xl font-bold ${themeClasses.heading2} mb-4 flex items-center gap-2`}>
            <span>🔗</span> How qualification works
          </h2>
          <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 text-sm`}>
            <div className={`flex-1 p-4 rounded-xl border text-center ${theme === 'dark' ? 'bg-green-900/10 border-green-700/30' : 'bg-green-50 border-green-200'}`}>
              <div className="text-2xl mb-2">🏘️</div>
              <div className="font-bold">Regional event</div>
              <div className={`mt-1 ${themeClasses.textSecondary}`}>Dancer performs &amp; gets scored</div>
            </div>
            <div className={`text-2xl text-center ${themeClasses.textMuted}`}>→</div>
            <div className={`flex-1 p-4 rounded-xl border text-center ${theme === 'dark' ? 'bg-blue-900/10 border-blue-700/30' : 'bg-blue-50 border-blue-200'}`}>
              <div className="text-2xl mb-2">📊</div>
              <div className="font-bold">Scores published</div>
              <div className={`mt-1 ${themeClasses.textSecondary}`}>Admin publishes via Score Approval</div>
            </div>
            <div className={`text-2xl text-center ${themeClasses.textMuted}`}>→</div>
            <div className={`flex-1 p-4 rounded-xl border text-center ${theme === 'dark' ? 'bg-amber-900/10 border-amber-700/30' : 'bg-amber-50 border-amber-200'}`}>
              <div className="text-2xl mb-2">✅</div>
              <div className="font-bold">≥ 75% average</div>
              <div className={`mt-1 ${themeClasses.textSecondary}`}>Dancer qualifies for nationals</div>
            </div>
            <div className={`text-2xl text-center ${themeClasses.textMuted}`}>→</div>
            <div className={`flex-1 p-4 rounded-xl border text-center ${theme === 'dark' ? 'bg-purple-900/10 border-purple-700/30' : 'bg-purple-50 border-purple-200'}`}>
              <div className="text-2xl mb-2">🏆</div>
              <div className="font-bold">National event</div>
              <div className={`mt-1 ${themeClasses.textSecondary}`}>Entry allowed if qualified</div>
            </div>
          </div>
          <p className={`mt-5 text-xs ${themeClasses.textMuted}`}>
            Note: The &quot;Qualified for Nationals&quot; badge on an entry is display-only. Real entry blocking uses live qualification checks against published regional scores.
          </p>
        </section>

        <section className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} ${themeClasses.cardRadius} p-6`}>
          <h2 className={`text-lg font-bold ${themeClasses.heading2} mb-4`}>Related admin pages</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin" className={`px-4 py-2 ${themeClasses.buttonPrimary} rounded-lg text-sm font-medium`}>
              🏆 Events
            </Link>
            <Link href="/admin/rankings" className={`px-4 py-2 ${themeClasses.buttonSecondary} rounded-lg text-sm font-medium`}>
              📊 Rankings
            </Link>
            <Link href="/admin/scoring-approval" className={`px-4 py-2 ${themeClasses.buttonSecondary} rounded-lg text-sm font-medium`}>
              ⚖️ Score Approval
            </Link>
            <Link href="/admin/certificates" className={`px-4 py-2 ${themeClasses.buttonSecondary} rounded-lg text-sm font-medium`}>
              🎖️ Certificates
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function BackendGuidePage() {
  return (
    <ThemeProvider>
      <BackendGuidePageContent />
    </ThemeProvider>
  );
}
