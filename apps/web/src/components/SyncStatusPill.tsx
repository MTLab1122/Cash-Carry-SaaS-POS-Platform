'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

interface SyncStatusPillProps {
  queueCount?: number;
  onSyncTrigger?: () => Promise<void>;
}

export function SyncStatusPill({ queueCount = 0, onSyncTrigger }: SyncStatusPillProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (onSyncTrigger && !isSyncing) {
      setIsSyncing(true);
      try {
        await onSyncTrigger();
      } finally {
        setIsSyncing(false);
      }
    }
  };

  if (!isOnline) {
    return (
      <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
        <WifiOff className="w-3.5 h-3.5 animate-pulse text-rose-500" />
        <span>Offline Mode ({queueCount} Queued)</span>
      </div>
    );
  }

  if (queueCount > 0 || isSyncing) {
    return (
      <button
        onClick={handleManualSync}
        className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition cursor-pointer"
      >
        <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
        <span>Syncing ({queueCount} queued)</span>
      </button>
    );
  }

  return (
    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span>Cloud Synced</span>
    </div>
  );
}

