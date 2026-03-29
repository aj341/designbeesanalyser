import { useState } from "react";
import { useLocation } from "wouter";
import { useSubmitAnalysis } from "@workspace/api-client-react";
import { ArrowRight, Globe, Clock, TrendingUp, ListChecks } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/Sidebar";

export function Home() {
  const [url, setUrl] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { mutate: submitAnalysis, isPending } = useSubmitAnalysis({
    mutation: {
      onSuccess: (data) => {
        setLocation(`/analysis/${data.id}`);
      },
      onError: (error) => {
        toast({
          title: "Analysis Failed",
          description: error.message || "Please enter a valid URL.",
          variant: "destructive"
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    submitAnalysis({ data: { url: formattedUrl } });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 relative overflow-y-auto custom-scrollbar flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">
          <div className="max-w-3xl w-full text-center space-y-8">
            <div className="flex flex-col items-center gap-1">
              <img
                src={`${import.meta.env.BASE_URL}images/design-bees-logo.png`}
                alt="Design Bees"
                className="h-16 md:h-20 w-auto object-contain"
              />
              <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-black">
                Website Analyser
              </h1>
            </div>
            
            <p className="text-lg md:text-xl text-propolis-brown max-w-2xl mx-auto leading-relaxed">
              Enter your URL to instantly uncover conversion bottlenecks, copy weaknesses, and actionable improvements.
            </p>

            <form onSubmit={handleSubmit} className="mt-12 relative group max-w-2xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-yellow-400/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
              <div className="relative flex flex-col sm:flex-row sm:items-center bg-[#fafaf7] border-[1.5px] border-[#e0dbd0] rounded-2xl overflow-hidden shadow-lg shadow-black/5 focus-within:border-primary">
                <div className="flex items-center flex-1">
                  <div className="pl-6 pr-2 text-propolis-brown">
                    <Globe className="w-6 h-6" />
                  </div>
                  <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 bg-transparent border-none px-4 py-5 text-lg focus:outline-none text-black placeholder:text-drone-grey"
                    required
                  />
                </div>
                <div className="px-3 pb-3 sm:pb-0 sm:pr-3 sm:pl-0">
                  <button 
                    type="submit" 
                    disabled={isPending}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-black px-6 py-4 rounded-xl font-display font-bold hover:bg-[#ffd060] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? "Starting..." : "Analyse My Site"}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 max-w-4xl mx-auto text-center">
              {[
                { icon: Clock, title: "Your report, ready in seconds", desc: "Get a full breakdown of your site's performance without waiting — results in under a minute." },
                { icon: TrendingUp, title: "Spot what's costing you conversions", desc: "See exactly where visitors drop off and what's standing between them and taking action." },
                { icon: ListChecks, title: "Know exactly what to fix first", desc: "Prioritised recommendations so you can focus effort on changes that move the needle." }
              ].map((feature, i) => (
                <div key={i} className="bg-white backdrop-blur-sm border border-[#e0dbd0] p-6 rounded-2xl flex flex-col items-center shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-black mb-2">{feature.title}</h3>
                  <p className="text-sm text-propolis-brown leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
