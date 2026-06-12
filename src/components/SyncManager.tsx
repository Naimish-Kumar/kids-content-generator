import React from "react";
import { SyncLog } from "../types";
import { Cloud, CloudOff, RefreshCw, Radio, HardDrive, ShieldCheck, CheckCircle2 } from "lucide-react";

interface SyncManagerProps {
  isOnline: boolean;
  onToggleOnline: () => void;
  syncLogs: SyncLog[];
  onTriggerSync: () => Promise<void>;
  pendingCount: number;
  lastSyncedAt: string | null;
  isSyncing: boolean;
}

export const SyncManager: React.FC<SyncManagerProps> = ({
  isOnline,
  onToggleOnline,
  syncLogs,
  onTriggerSync,
  pendingCount,
  lastSyncedAt,
  isSyncing
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4" id="sync-panel">
      {/* Network simulator panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-lg">
        <div>
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${isOnline ? "text-emerald-500" : "text-amber-500 animate-pulse"}`} />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Connection State Simulator
            </h4>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Toggle this switch to test how the app buffers creations offline and auto-syncs when reconnecting.
          </p>
        </div>

        <button
          onClick={onToggleOnline}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
            isOnline
              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
              : "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/50 dark:text-amber-300"
          }`}
          aria-pressed={!isOnline}
          id="toggle-offline-simulator"
        >
          {isOnline ? (
            <>
              <Cloud className="w-4 h-4" />
              Simulator: Online
            </>
          ) : (
            <>
              <CloudOff className="w-4 h-4" />
              Simulator: Offline
            </>
          )}
        </button>
      </div>

      {/* Sync stats & main action button */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border border-slate-100 dark:border-slate-800/80 p-4 rounded-lg">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm font-display">
              IndexedDB Caching Engine
            </h3>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Local Queued Changes:</span>
              <span className={`font-bold ${pendingCount > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                {pendingCount} item{pendingCount !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Cloud SQL Sync Status:</span>
              <span className="flex items-center gap-1">
                {pendingCount === 0 ? (
                  <span className="text-emerald-500 flex items-center gap-0.5 font-medium text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Fully backed-up
                  </span>
                ) : (
                  <span className="text-amber-500 font-medium text-[11px]">Pending online release</span>
                )}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              Last Backup: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : "Never (local cache active)"}
            </p>
          </div>
        </div>

        <div className="flex justify-start md:justify-end">
          <button
            onClick={onTriggerSync}
            disabled={!isOnline || isSyncing}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer ${
              !isOnline
                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
            }`}
            id="trigger-cloud-sync-btn"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing Cloud SQL..." : "Sync Backups Now"}
          </button>
        </div>
      </div>

      {/* Sync history logs */}
      <div>
        <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 font-display">
          Active Database Sync Logs:
        </h4>
        <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-3 max-h-40 overflow-y-auto text-[11px] font-mono text-slate-600 dark:text-slate-400 space-y-1.5 border border-slate-100 dark:border-slate-900">
          {syncLogs.length === 0 ? (
            <p className="text-center py-2 text-slate-400">No transactions recorded yet in current session.</p>
          ) : (
            syncLogs.map((log) => (
              <div key={log.id} className="flex justify-between items-start gap-3 border-b border-slate-100 dark:border-slate-900/60 pb-1 last:border-0 last:pb-0">
                <div className="text-left">
                  <span className={`inline-block px-1 mr-1.5 rounded text-[9px] uppercase font-bold ${
                    log.status === "success" 
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-450" 
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-450"
                  }`}>
                    {log.status}
                  </span>
                  <span>{log.action}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{log.details}</p>
                </div>
                <span className="text-slate-400 text-[10px] shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
