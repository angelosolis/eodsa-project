'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/simple-toast';
import { useAlert } from '@/components/ui/custom-alert';

interface ArchivedEvent {
  id: string;
  name: string;
  venue: string;
  eventDate: string;
  status: string;
  archivedAt?: string | null;
  archivedBy?: string | null;
  mediaPurgedAt?: string | null;
}

export default function BackendArchivedPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const { showConfirm } = useAlert();

  const [events, setEvents] = useState<ArchivedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [purgeEvent, setPurgeEvent] = useState<ArchivedEvent | null>(null);
  const [purgeText, setPurgeText] = useState('');
  const [purging, setPurging] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    const session = localStorage.getItem('adminSession');
    if (!session) {
      router.push('/portal/admin');
      return;
    }
    try {
      const admin = JSON.parse(session);
      if (!admin.isAdmin) {
        router.push('/backend');
        return;
      }
    } catch {
      router.push('/portal/admin');
      return;
    }
    loadArchived();
  }, [router]);

  const loadArchived = async () => {
    setLoading(true);
    setLoadError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch('/api/events?scope=archived', { signal: controller.signal });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Failed to load archived events');
      }
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (err: any) {
      console.error(err);
      setEvents([]);
      if (err?.name === 'AbortError') {
        setLoadError('Timed out loading archived events. Tap Try again.');
      } else {
        setLoadError(err?.message || 'Failed to load archived events');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const restore = async (event: ArchivedEvent) => {
    showConfirm(`Restore “${event.name}” to the active Events list?`, async () => {
      setRestoringId(event.id);
      try {
        const session = localStorage.getItem('adminSession');
        if (!session) return;
        const admin = JSON.parse(session);
        const res = await fetch(`/api/events/${event.id}/restore`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminSession: session, adminId: admin.id })
        });
        const data = await res.json();
        if (data.success) {
          success(`“${event.name}” restored.`);
          loadArchived();
        } else {
          error(data.error || 'Failed to restore');
        }
      } catch {
        error('Failed to restore event');
      } finally {
        setRestoringId(null);
      }
    });
  };

  const confirmPurge = async () => {
    if (!purgeEvent || purgeText !== 'PURGE') return;
    setPurging(true);
    try {
      const session = localStorage.getItem('adminSession');
      if (!session) return;
      const admin = JSON.parse(session);
      const res = await fetch(`/api/events/${purgeEvent.id}/purge-media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmation: 'PURGE',
          adminSession: session,
          adminId: admin.id
        })
      });
      const data = await res.json();
      if (data.success) {
        success(data.message || 'Music and video files deleted from storage.');
        setPurgeEvent(null);
        setPurgeText('');
        loadArchived();
      } else {
        error(data.error || 'Failed to delete media files');
      }
    } catch {
      error('Failed to delete media files');
    } finally {
      setPurging(false);
    }
  };

  const purgedCount = events.filter((e) => e.mediaPurgedAt).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="bg-gray-800/80 backdrop-blur-sm border-b border-purple-500/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link href="/backend" className="text-sm text-gray-400 hover:text-purple-300 transition-colors">
                  ← Backend
                </Link>
                <span className="text-gray-600">·</span>
                <Link href="/admin" className="text-sm text-gray-400 hover:text-purple-300 transition-colors">
                  Admin
                </Link>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                📦 Archived Events
              </h1>
              <p className="text-gray-300 text-sm mt-1">
                Hidden from live dashboards. Scores, certificates, and entries are kept.
              </p>
            </div>
            <button
              type="button"
              onClick={loadArchived}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors self-start sm:self-auto"
            >
              ↻ Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-800/80 rounded-xl border border-purple-500/30 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Archived events</p>
                <p className="text-3xl font-bold text-white">{loading ? '—' : events.length}</p>
              </div>
              <div className="text-4xl">📦</div>
            </div>
          </div>
          <div className="bg-gray-800/80 rounded-xl border border-emerald-500/30 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Media kept</p>
                <p className="text-3xl font-bold text-emerald-400">
                  {loading ? '—' : Math.max(0, events.length - purgedCount)}
                </p>
              </div>
              <div className="text-4xl">🎵</div>
            </div>
          </div>
          <div className="bg-gray-800/80 rounded-xl border border-rose-500/30 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Media purged</p>
                <p className="text-3xl font-bold text-rose-400">{loading ? '—' : purgedCount}</p>
              </div>
              <div className="text-4xl">🧹</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/80 rounded-xl border border-purple-500/30 overflow-hidden">
          <div className="p-6 border-b border-purple-500/30">
            <h2 className="text-xl font-bold text-white">Events in archive</h2>
            <p className="text-gray-400 text-sm mt-1">
              Restore to bring an event back to Admin → Events, or delete media to free storage.
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
              <p className="text-gray-300">Loading archived events…</p>
            </div>
          ) : loadError ? (
            <div className="p-12 text-center space-y-4">
              <p className="text-red-300">{loadError}</p>
              <button
                type="button"
                onClick={loadArchived}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Try again
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-300 text-lg">No archived events yet</p>
              <p className="text-gray-500 text-sm mt-2">
                On Admin → Events, use Archive when an event is completed.
              </p>
              <Link
                href="/admin"
                className="inline-flex mt-5 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Go to Admin Events
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-purple-500/20">
              {events.map((event) => (
                <div key={event.id} className="p-6 hover:bg-purple-500/5 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="text-lg font-bold text-white hover:text-purple-300 transition-colors"
                        >
                          {event.name}
                        </Link>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          ARCHIVED
                        </span>
                        {event.mediaPurgedAt && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            MEDIA PURGED
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
                        <p className="text-gray-300">
                          Date:{' '}
                          <span className="text-white font-medium">
                            {event.eventDate ? new Date(event.eventDate).toLocaleDateString() : '—'}
                          </span>
                        </p>
                        <p className="text-gray-300">
                          Venue: <span className="text-white font-medium">{event.venue || '—'}</span>
                        </p>
                        <p className="text-gray-300">
                          Archived:{' '}
                          <span className="text-white font-medium">
                            {event.archivedAt
                              ? new Date(event.archivedAt).toLocaleDateString()
                              : '—'}
                          </span>
                        </p>
                        {event.archivedBy && (
                          <p className="text-gray-300">
                            By: <span className="text-white font-medium">{event.archivedBy}</span>
                          </p>
                        )}
                      </div>
                      {!event.mediaPurgedAt && (
                        <p className="text-xs text-gray-500">
                          Delete music &amp; video frees Cloudinary storage. Scores and certificates stay.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="px-4 py-2.5 rounded-lg font-semibold bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        onClick={() => restore(event)}
                        disabled={restoringId === event.id}
                        className="px-4 py-2.5 rounded-lg font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        {restoringId === event.id ? 'Restoring…' : 'Restore to live'}
                      </button>
                      {!event.mediaPurgedAt ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPurgeEvent(event);
                            setPurgeText('');
                          }}
                          className="px-4 py-2.5 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                          Delete music &amp; video
                        </button>
                      ) : (
                        <span className="px-4 py-2.5 text-sm text-gray-500 self-center">
                          Media already deleted
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {purgeEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-w-md w-full rounded-xl border border-purple-500/40 bg-gray-800 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Delete music &amp; video files?</h3>
            <p className="text-sm text-gray-300 mb-3">
              Permanently removes uploaded music and video for{' '}
              <span className="font-semibold text-white">“{purgeEvent.name}”</span> from Cloudinary.
            </p>
            <ul className="text-sm text-gray-400 mb-4 list-disc pl-5 space-y-1">
              <li>
                Scores, certificates, entries, and payments are{' '}
                <strong className="text-white">not</strong> deleted
              </li>
              <li>Sound desk will no longer have those files</li>
              <li>This cannot be undone</li>
            </ul>
            <p className="text-sm text-gray-300 mb-2">
              Type <span className="font-mono font-bold text-white">PURGE</span> to confirm.
            </p>
            <input
              type="text"
              value={purgeText}
              onChange={(e) => setPurgeText(e.target.value)}
              placeholder="Type PURGE"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPurgeEvent(null);
                  setPurgeText('');
                }}
                className="px-4 py-2 rounded-lg text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPurge}
                disabled={purgeText !== 'PURGE' || purging}
                className={`px-4 py-2 rounded-lg font-semibold text-white transition-colors ${
                  purgeText === 'PURGE' && !purging
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                {purging ? 'Deleting…' : 'Delete files'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
