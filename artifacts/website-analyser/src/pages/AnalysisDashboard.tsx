import { useState, useRef, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetAnalysisStatus,
  useGetAnalysis,
  useSubmitAnalysis,
  getGetAnalysisStatusQueryKey,
  getGetAnalysisQueryKey,
} from "@workspace/api-client-react";
import { Sidebar } from "@/components/Sidebar";
import { LoadingScreen } from "@/components/LoadingScreen";
import { RadialProgress } from "@/components/RadialProgress";
import {
  ArrowUpRight,
  X,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Target,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type DashboardView = "scorecard" | "annotated";

const intentIcons: Record<string, string> = {
  "Lead Generation": "🎯",
  "E-commerce": "🛍️",
  "SaaS / Software": "⚡",
  "Portfolio / Agency": "✨",
  "Local Business": "📍",
  "Blog / Content": "📖",
  "Landing Page": "🚀",
  "Corporate / Brand": "🏢",
};

export function AnalysisDashboard() {
  const [, params] = useRoute("/analysis/:id");
  const id = params?.id || "";
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [view, setView] = useState<DashboardView>("scorecard");
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [findingTab, setFindingTab] = useState<"all" | "strength" | "weakness">("all");
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const { mutate: retryAnalysis, isPending: isRetrying } = useSubmitAnalysis({
    mutation: {
      onSuccess: (data) => {
        setLocation(`/analysis/${data.id}`);
      },
      onError: () => {
        toast({
          title: "Retry failed",
          description: "Could not start a new analysis. Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const { data: statusData, isLoading: isStatusLoading } =
    useGetAnalysisStatus(id, {
      query: {
        queryKey: getGetAnalysisStatusQueryKey(id),
        refetchInterval: (query) => {
          const state = query.state.data?.status;
          if (state === "completed" || state === "failed") return false;
          return 2500;
        },
        enabled: !!id,
      },
    });

  const isCompleted = statusData?.status === "completed";
  const isFailed = statusData?.status === "failed";

  const { data: analysis, isLoading: isAnalysisLoading } = useGetAnalysis(id, {
    query: {
      queryKey: getGetAnalysisQueryKey(id),
      enabled: isCompleted,
    },
  });

  useEffect(() => {
    setView("scorecard");
    setSelectedFindingId(null);
    setFindingTab("all");
    setImgLoaded(false);
    setImgError(false);
  }, [id]);

  useEffect(() => {
    if (view === "annotated") {
      if (imgRef.current?.complete) {
        setImgLoaded(true);
      }
    }
  }, [view]);

  const sortedFindings = analysis
    ? [...analysis.findings].sort((a, b) => a.y - b.y)
    : [];

  const selectedFinding = sortedFindings.find((f) => f.id === selectedFindingId);
  const intentEmoji = analysis?.pageIntent ? intentIcons[analysis.pageIntent] ?? "🌐" : "🌐";

  const tabFindings =
    findingTab === "all"
      ? sortedFindings
      : sortedFindings.filter((f) => f.type === findingTab);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header — pure black like UI kit nav */}
        <header className="h-14 flex items-center px-6 justify-between panel-dark z-20 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {view === "annotated" && (
              <button
                onClick={() => { setView("scorecard"); setSelectedFindingId(null); }}
                className="flex items-center gap-1.5 text-sm text-white/45 hover:text-white transition-colors shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Scorecard</span>
              </button>
            )}
            <h2 className="font-display text-sm text-white/60 truncate min-w-0">
              {statusData?.url || "Loading..."}
            </h2>
            {isCompleted && analysis && (
              <div className="shrink-0 px-2 py-1 rounded-full bg-[rgba(5,200,75,0.2)] border border-action-green/20 text-action-green text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span className="hidden sm:inline">Done</span>
              </div>
            )}
          </div>

        </header>

        {/* Loading */}
        {(!statusData || isStatusLoading || statusData.status === "pending" || statusData.status === "processing") && (
          <div className="flex-1 flex items-center justify-center">
            <LoadingScreen />
          </div>
        )}

        {/* Failed */}
        {isFailed && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-2xl font-display font-bold text-black mb-2">Analysis Failed</h3>
            <p className="text-propolis-brown max-w-md mb-8">
              {statusData?.error ||
                "We encountered an error analysing this website. It might be blocking automated access or is currently unreachable."}
            </p>
            <button
              onClick={() => {
                const url = statusData?.url;
                if (url) retryAnalysis({ data: { url } });
              }}
              disabled={isRetrying}
              className="flex items-center gap-2 bg-forest-hive hover:bg-action-green text-white px-6 py-3 rounded-xl font-display font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
              {isRetrying ? "Retrying..." : "Retry"}
            </button>
          </div>
        )}

        {/* Completed */}
        {isCompleted && analysis && (
          <AnimatePresence mode="wait">

            {/* ── SCORECARD VIEW ── */}
            {view === "scorecard" && (
              <motion.div
                key="scorecard"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="flex-1 min-h-0 overflow-y-auto custom-scrollbar"
              >
                <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

                  {/* Page intent badge */}
                  {analysis.pageIntent && (
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{intentEmoji}</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-display font-semibold text-propolis-brown uppercase tracking-widest">
                          Page Purpose Detected
                        </span>
                        <span className="text-black font-semibold text-lg leading-tight">
                          {analysis.pageIntent}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Overall score + summary */}
                  <div className="p-6 rounded-2xl bg-white border border-[#e0dbd0] overflow-hidden">
                    <h3 className="text-lg font-display font-bold text-black mb-4">
                      How this site scores
                    </h3>
                    <div className="overflow-hidden">
                      <div className="float-right ml-5 mb-2">
                        <RadialProgress
                          score={analysis.overallScore || 0}
                          size={100}
                          strokeWidth={9}
                          label="Overall"
                        />
                      </div>
                      {analysis.summary && (
                        <p className="text-sm text-black leading-relaxed">
                          {analysis.summary}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CTA to annotated view */}
                  <button
                    onClick={() => setView("annotated")}
                    className="w-full flex items-center justify-center gap-3 bg-forest-hive hover:bg-action-green text-white font-display font-bold py-4 rounded-2xl transition-all group"
                  >
                    <Target className="w-5 h-5" />
                    Show me how I got that score
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Category scores */}
                  <div>
                    <h4 className="text-xs font-display font-semibold text-propolis-brown uppercase tracking-widest mb-4">
                      Category Breakdown
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {(analysis.scores ?? []).map((score, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + idx * 0.07 }}
                          className="p-4 rounded-xl bg-white border border-[#e0dbd0] hover:bg-white/80 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2.5">
                            <span className="font-semibold text-black text-sm">{score.name}</span>
                            <span
                              className={cn(
                                "font-bold text-sm",
                                score.score >= 80
                                  ? "text-action-green"
                                  : score.score >= 55
                                  ? "text-primary"
                                  : "text-destructive"
                              )}
                            >
                              {score.score}/100
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-[#e0dbd0] rounded-full overflow-hidden mb-2.5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${score.score}%` }}
                              transition={{ duration: 0.9, delay: 0.3 + idx * 0.07 }}
                              className={cn(
                                "h-full rounded-full",
                                score.score >= 80
                                  ? "bg-action-green"
                                  : score.score >= 55
                                  ? "bg-primary"
                                  : "bg-destructive"
                              )}
                            />
                          </div>
                          <p className="text-xs text-propolis-brown leading-relaxed">
                            {score.description}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Design Bees CTA Block — white card */}
                  <div className="rounded-2xl overflow-hidden border border-[#e0dbd0] bg-white">
                    <div className="p-8 text-center">
                      <h3 className="text-2xl font-display font-bold mb-3 text-black">
                        Ready to fix what's holding your site back?
                      </h3>
                      <p className="text-propolis-brown mb-6 max-w-lg mx-auto leading-relaxed">
                        Our team at Design Bees specialises in turning these insights into real improvements — better conversions, stronger copy, and a site that works harder for you. We audit every layer of your site, from technical performance and SEO to user experience and conversion strategy.
                      </p>
                      <a
                        href="https://designbees.com.au"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-display font-bold px-8 py-4 rounded-[10px] transition-all hover:bg-[#ffd060] hover:-translate-y-0.5"
                        style={{ background: '#F6BE38', color: '#000000' }}
                      >
                        Get Design Bees to fix this
                        <ArrowUpRight className="w-5 h-5" />
                      </a>
                    </div>
                  </div>

                  <div className="h-8" />
                </div>
              </motion.div>
            )}

            {/* ── ANNOTATED VIEW ── */}
            {view === "annotated" && (
              <motion.div
                key="annotated"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-h-0 flex overflow-hidden relative"
              >
                {/* Screenshot column */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-beeswax-cream/30 flex justify-center p-4 sm:p-6">
                  <div
                    className="relative shadow-lg shadow-black/10 ring-1 ring-[#e0dbd0] rounded-lg overflow-hidden max-w-5xl w-full h-max"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) setSelectedFindingId(null);
                    }}
                  >
                    {analysis.screenshotUrl && !imgError ? (
                      <img
                        ref={imgRef}
                        src={analysis.screenshotUrl}
                        alt="Website Screenshot"
                        className="w-full h-auto block"
                        onLoad={() => setImgLoaded(true)}
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className="w-full aspect-video bg-beeswax-cream flex items-center justify-center text-propolis-brown">
                        Screenshot Unavailable
                      </div>
                    )}

                    {/* Number pins */}
                    {imgLoaded &&
                      sortedFindings.map((finding, idx) => {
                        const isSelected = selectedFindingId === finding.id;
                        const isStrength = finding.type === "strength";
                        const pinX = finding.x + finding.width / 2;
                        const pinY = finding.y + finding.height / 2;

                        return (
                          <motion.button
                            key={finding.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.06, type: "spring", stiffness: 300 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFindingId(isSelected ? null : finding.id);
                            }}
                            title={finding.title}
                            className={cn(
                              "absolute z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg transition-all duration-200",
                              isStrength
                                ? "bg-action-green hover:bg-action-green/90 shadow-action-green/40"
                                : "bg-destructive hover:bg-destructive/90 shadow-destructive/40",
                              isSelected && "ring-4 ring-primary scale-125 shadow-2xl"
                            )}
                            style={{
                              left: `calc(${pinX}% - 14px)`,
                              top: `calc(${pinY}% - 14px)`,
                            }}
                          >
                            {idx + 1}
                          </motion.button>
                        );
                      })}
                  </div>
                </div>

                {/* Right panel: findings list or detail — hidden on mobile, visible sm+ */}
                <div className="hidden sm:flex w-80 border-l border-[rgba(246,190,56,0.12)] panel-dark flex-col overflow-hidden shadow-[-8px_0_24px_rgba(0,0,0,0.15)] z-10 shrink-0">
                  <AnimatePresence mode="wait">
                    {selectedFinding ? (
                      <motion.div
                        key={`detail-${selectedFinding.id}`}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 20, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar-dark p-5"
                      >
                        <div className="flex justify-between items-start mb-5">
                          <div
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                              selectedFinding.type === "strength"
                                ? "bg-[rgba(5,200,75,0.2)] text-action-green"
                                : "bg-destructive/20 text-destructive"
                            )}
                          >
                            {selectedFinding.type}
                          </div>
                          <button
                            onClick={() => setSelectedFindingId(null)}
                            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4 text-white/40 hover:text-white" />
                          </button>
                        </div>

                        <div className="mb-1 text-xs font-display text-primary uppercase tracking-widest">
                          {selectedFinding.category.replace(/_/g, " ")}
                        </div>
                        <h3 className="text-base font-display font-bold text-white mb-5 leading-snug">
                          {selectedFinding.title}
                        </h3>

                        <div className="space-y-5">
                          <div>
                            <h4 className="text-xs font-semibold text-propolis-brown mb-2 uppercase tracking-wider">
                              Evidence
                            </h4>
                            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-sm text-white/75 leading-relaxed italic">
                              "{selectedFinding.evidence}"
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-propolis-brown mb-2 uppercase tracking-wider">
                              Suggestion
                            </h4>
                            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-sm text-white/85 leading-relaxed">
                              {selectedFinding.suggestion}
                            </div>
                          </div>

                          {selectedFinding.type === "weakness" && (
                            <a
                              href="https://designbees.com.au"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full font-display font-bold text-sm px-4 py-3 rounded-[10px] transition-all hover:bg-[#ffd060] hover:-translate-y-0.5"
                              style={{ background: '#F6BE38', color: '#000000' }}
                            >
                              Let Design Bees fix this →
                            </a>
                          )}
                        </div>

                        <button
                          onClick={() => setSelectedFindingId(null)}
                          className="mt-6 flex items-center gap-1.5 text-xs text-white/45 hover:text-white transition-colors"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> All findings
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="findings-list"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="flex-1 flex flex-col overflow-hidden"
                      >
                        <div className="px-4 pt-4 pb-1">
                          <p className="text-xs font-semibold uppercase tracking-widest text-propolis-brown">
                            Findings Overview
                          </p>
                        </div>
                        <div className="p-3 border-b border-white/5 flex gap-2">
                          {(["all", "strength", "weakness"] as const).map((tab) => {
                            const strengthCount = sortedFindings.filter((f) => f.type === "strength").length;
                            const weaknessCount = sortedFindings.filter((f) => f.type === "weakness").length;
                            const icon = null;
                            const name = tab === "all" ? "All" : tab === "strength" ? "Strengths" : "Weaknesses";
                            const count = tab === "all" ? sortedFindings.length : tab === "strength" ? strengthCount : weaknessCount;
                            return (
                              <button
                                key={tab}
                                onClick={() => setFindingTab(tab)}
                                className={cn(
                                  "flex-1 flex flex-col items-center py-2.5 px-1 rounded-lg transition-colors gap-0.5",
                                  findingTab === tab
                                    ? tab === "strength"
                                      ? "bg-[rgba(5,200,75,0.2)] text-action-green"
                                      : tab === "weakness"
                                      ? "bg-destructive/20 text-destructive"
                                      : "bg-primary/20 text-primary"
                                    : "text-white/40 hover:text-white hover:bg-white/5"
                                )}
                              >
                                <span className="text-xs font-semibold whitespace-nowrap leading-none">
                                  {icon}{name}
                                </span>
                                <span className="text-base font-bold leading-none">{count}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* List */}
                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar-dark divide-y divide-white/5">
                          {tabFindings.length === 0 && (
                            <p className="text-xs text-white/40 text-center py-8 px-4">
                              No {findingTab === "strength" ? "strengths" : "weaknesses"} found.
                            </p>
                          )}
                          {tabFindings.map((finding) => {
                            const sortedIdx = sortedFindings.indexOf(finding);
                            const isStrength = finding.type === "strength";
                            return (
                              <button
                                key={finding.id}
                                onClick={() => setSelectedFindingId(finding.id)}
                                className="w-full text-left px-4 py-3.5 hover:bg-midnight-drone transition-colors flex items-start gap-3 group"
                              >
                                <span
                                  className={cn(
                                    "shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5",
                                    isStrength ? "bg-action-green/80" : "bg-destructive/80"
                                  )}
                                >
                                  {sortedIdx + 1}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-white/90 leading-snug truncate">
                                    {finding.title}
                                  </p>
                                  <p className="text-xs text-propolis-brown mt-0.5">
                                    {finding.category.replace(/_/g, " ")}
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors shrink-0 mt-1 ml-auto" />
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── MOBILE BOTTOM SHEET ── sm:hidden */}
                {/* Backdrop */}
                {selectedFinding && (
                  <div
                    className="sm:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setSelectedFindingId(null)}
                  />
                )}
                {/* Sheet */}
                <div
                  className={cn(
                    "sm:hidden fixed bottom-0 left-0 right-0 z-50 panel-dark rounded-t-2xl transition-transform duration-300 ease-out max-h-[75vh] flex flex-col",
                    selectedFinding ? "translate-y-0" : "translate-y-full"
                  )}
                >
                  {/* Drag handle */}
                  <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 bg-white/20 rounded-full" />
                  </div>

                  {selectedFinding && (
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar-dark px-5 pb-8 pt-2">
                      {/* Type badge + close */}
                      <div className="flex justify-between items-start mb-4">
                        <div className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                          selectedFinding.type === "strength"
                            ? "bg-[rgba(5,200,75,0.2)] text-action-green"
                            : "bg-destructive/20 text-destructive"
                        )}>
                          {selectedFinding.type}
                        </div>
                        <button
                          onClick={() => setSelectedFindingId(null)}
                          className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4 text-white/40" />
                        </button>
                      </div>

                      <div className="mb-1 text-xs font-display text-primary uppercase tracking-widest">
                        {selectedFinding.category.replace(/_/g, " ")}
                      </div>
                      <h3 className="text-base font-display font-bold text-white mb-4 leading-snug">
                        {selectedFinding.title}
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-semibold text-propolis-brown mb-2 uppercase tracking-wider">Evidence</h4>
                          <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-sm text-white/75 leading-relaxed italic">
                            "{selectedFinding.evidence}"
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-propolis-brown mb-2 uppercase tracking-wider">Suggestion</h4>
                          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-sm text-white/85 leading-relaxed">
                            {selectedFinding.suggestion}
                          </div>
                        </div>
                        {selectedFinding.type === "weakness" && (
                          <a
                            href="https://designbees.com.au"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full font-display font-bold text-sm px-4 py-3 rounded-[10px] transition-all hover:bg-[#ffd060]"
                            style={{ background: '#F6BE38', color: '#000000' }}
                          >
                            Let Design Bees fix this →
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
