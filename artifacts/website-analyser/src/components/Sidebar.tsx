import { useState } from "react";
import { Link, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { useListAnalyses, getListAnalysesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { History, ShieldAlert, CheckCircle2, Trash2, LayoutDashboard, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { data: analyses, isLoading, isError } = useListAnalyses();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClearAll = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setClearing(true);
    try {
      await fetch("/api/analyses", { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
    } finally {
      setClearing(false);
      setConfirming(false);
    }
  };

  return (
    <div
      className={cn(
        "hidden md:flex flex-col h-screen panel-dark flex-shrink-0 transition-all duration-300 overflow-hidden relative",
        open ? "w-72" : "w-10"
      )}
    >
      {/* Toggle button — always visible */}
      <button
        onClick={() => setOpen(!open)}
        title={open ? "Collapse sidebar" : "Show recent analyses"}
        className="absolute top-3.5 right-1.5 z-20 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
      >
        {open ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Sidebar content — only interactive when open */}
      <div
        className={cn(
          "flex flex-col flex-1 min-w-0 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="p-6 flex items-center gap-3 pr-10">
          <img
            src={`${import.meta.env.BASE_URL}images/design-bees-logo.png`}
            alt="Design Bees"
            className="h-8 w-auto object-contain flex-shrink-0"
          />
        </div>

        <div className="px-4 pb-4">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium whitespace-nowrap",
              location === "/"
                ? "bg-[rgba(5,200,75,0.15)] text-action-green"
                : "text-white/60 hover:bg-midnight-drone hover:text-white"
            )}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            New Analysis
          </Link>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar-dark px-4 pb-6">
          <div className="flex items-center justify-between px-4 py-2 mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-propolis-brown whitespace-nowrap">
              <History className="w-4 h-4 flex-shrink-0" />
              Recent Analyses
            </div>
            {analyses && analyses.length > 0 && (
              confirming ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleClearAll}
                    disabled={clearing}
                    className="text-xs text-destructive font-semibold hover:text-destructive/80 transition-colors"
                  >
                    {clearing ? "Clearing…" : "Confirm"}
                  </button>
                  <span className="text-white/20 text-xs">·</span>
                  <button
                    onClick={() => setConfirming(false)}
                    className="text-xs text-white/40 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleClearAll}
                  title="Clear all analyses"
                  className="p-1 rounded-md text-white/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )
            )}
          </div>

          {isLoading ? (
            <div className="px-4 py-6 text-center text-sm text-white/40">
              Loading history...
            </div>
          ) : isError ? (
            <div className="px-4 py-6 text-center text-sm text-destructive/80">
              Failed to load history
            </div>
          ) : analyses?.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-white/40">
              No analyses yet
            </div>
          ) : (
            <div className="space-y-2">
              {analyses?.map((analysis) => {
                const isActive = location === `/analysis/${analysis.id}`;
                return (
                  <Link
                    key={analysis.id}
                    href={`/analysis/${analysis.id}`}
                    className={cn(
                      "block px-4 py-3 rounded-xl transition-all duration-200 border",
                      isActive
                        ? "bg-white/10 border-white/10 shadow-md"
                        : "bg-transparent border-transparent hover:bg-midnight-drone hover:border-white/5"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium text-sm truncate pr-2 text-white/90">
                        {analysis.url.replace(/^https?:\/\//, "")}
                      </div>
                      {analysis.status === "completed" && (
                        <span
                          className={cn(
                            "text-xs font-bold px-1.5 py-0.5 rounded-md flex-shrink-0",
                            (analysis.overallScore || 0) >= 80
                              ? "bg-action-green/20 text-action-green"
                              : (analysis.overallScore || 0) >= 50
                              ? "bg-primary/20 text-primary"
                              : "bg-destructive/20 text-destructive"
                          )}
                        >
                          {analysis.overallScore}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/40">
                      <span>{formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}</span>
                      {analysis.status === "pending" || analysis.status === "processing" ? (
                        <span className="text-primary flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          Processing
                        </span>
                      ) : analysis.status === "failed" ? (
                        <span className="text-destructive flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Failed
                        </span>
                      ) : (
                        <span className="text-action-green flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
