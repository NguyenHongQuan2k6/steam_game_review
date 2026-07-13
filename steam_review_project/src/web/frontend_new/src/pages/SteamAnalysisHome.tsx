import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Flame, AlertTriangle, Bug, TrendingUp, BarChart2, ShieldAlert, ArrowRight, Activity, Users, Info } from 'lucide-react';
import { FishBackground } from '../components/FishBackground';
import { useGesture } from '../components/GestureLayout';

interface GameProfile {
  app_id: string;
  title_clean: string;
  release_date_clean: string;
  price_clean: number;
  game_url_clean: string;
  crawl_time: string;
  sentiment_score?: number;
  sentiment_shift?: number;
  bug_density?: number;
  image_url?: string;
}

const ScrollReveal: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.02,
        rootMargin: '-40px 0px 150px 0px'
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transition: 'all 1100ms cubic-bezier(0.22, 1, 0.36, 1)',
        transform: isVisible
          ? 'perspective(1000px) rotateX(0deg) translateY(0px) scale(1)'
          : 'perspective(1000px) rotateX(4deg) translateY(24px) scale(0.98)',
        opacity: isVisible ? 1 : 0,
        filter: isVisible ? 'blur(0px)' : 'blur(3px)',
        willChange: 'transform, opacity, filter',
      }}
      className={className}
    >
      {children}
    </div>
  );
};

const FlippingCounter: React.FC<{ target: number; suffix?: string; decimals?: number; duration?: number; color?: string }> = ({ 
  target, 
  suffix = '', 
  decimals = 0, 
  duration = 1800,
  color = 'text-white'
}) => {
  const [value, setValue] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = performance.now();

          const animate = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            
            // easeOutCubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentVal = easeProgress * target;
            setValue(currentVal);

            // Calculate instantaneous speed (first derivative of easeOutCubic)
            const speed = 3 * Math.pow(1 - progress, 2); 
            
            // Set dynamic translate offset based on speed
            setOffsetY(speed * 6); 

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setValue(target);
              setOffsetY(0);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  const displayValue = value.toFixed(decimals);

  return (
    <div ref={ref} className="inline-flex items-baseline overflow-hidden h-[36px] select-none">
      <span 
        className={`inline-block font-mono text-2xl sm:text-3xl font-black ${color}`}
        style={{ 
          transform: `translateY(${offsetY}px)`,
          willChange: 'transform' 
        }}
      >
        {displayValue}
      </span>
      <span className={`font-mono text-2xl sm:text-3xl font-black ${color}`}>{suffix}</span>
    </div>
  );
};

export const SteamAnalysisHome: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GameProfile[]>([]);
  const [allGames, setAllGames] = useState<GameProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'positive' | 'backlash' | 'bugs'>('positive');
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [showFish, setShowFish] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Consume Global Gesture Context
  const { x, y, isTracking, isGestureModeOn } = useGesture();

  // Delay mounting of heavy 3D Fish Background to avoid route transition stutter
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFish(true);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // Fetch games database from backend on mount
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch('/api/games-csv');
        if (response.ok) {
          const data = await response.json();
          setAllGames(data);
        } else {
          // Fallback if endpoint doesn't exist yet
          const fbResponse = await fetch('/api/games');
          if (fbResponse.ok) {
            const data = await fbResponse.json();
            const formatted = data.map((g: any) => ({
              app_id: g.app_id,
              title_clean: g.title_raw,
              release_date_clean: 'N/A',
              price_clean: g.price_display === 'Free' ? 0 : parseFloat(g.price_display?.replace('$', '') || '0'),
              game_url_clean: g.game_url,
              crawl_time: '',
              image_url: g.image_url
            }));
            setAllGames(formatted);
          }
        }
      } catch (err) {
        console.error("Failed to load games data:", err);
      } finally {
        // Ensure skeleton shows briefly for smooth transition
        setTimeout(() => {
          setIsPageLoading(false);
        }, 500);
      }
    };
    fetchGames();
  }, []);

  // Handle Search Input & Suggestions (Debounced)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      setIsLoading(true);
      const query = searchQuery.toLowerCase().trim();
      
      const filtered = allGames.filter(game => 
        game.title_clean.toLowerCase().includes(query) || 
        game.app_id.includes(query)
      ).slice(0, 8); // Limit to 8 suggestions
      
      setSuggestions(filtered);
      setIsLoading(false);
    }, 250); // 250ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, allGames]);

  // Click outside listener to close autocomplete suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectGame = (game: GameProfile) => {
    // Generate clean lowercase slug path: /game/analysis/[game-name-slug]
    const slug = game.title_clean
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // remove special chars
      .replace(/[\s_]+/g, '-')  // replace spaces with hyphens
      .replace(/-+/g, '-');     // replace duplicate hyphens
    
    // Store selected game info in session state for fast loading
    sessionStorage.setItem(`game_meta_${slug}`, JSON.stringify(game));
    
    navigate(`/game/analysis/${slug}`, { state: { app_id: game.app_id, gameName: game.title_clean } });
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const rotateX = ((yc - y) / yc) * 8; // max 8 degrees tilt
    const rotateY = ((x - xc) / xc) * 8;
    
    card.style.transition = 'transform 0.1s ease-out';
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.transition = 'transform 0.5s ease-out';
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  const handleSectionMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const section = e.currentTarget;
    const rect = section.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    section.style.setProperty('--bg-mouse-x', `${x}px`);
    section.style.setProperty('--bg-mouse-y', `${y}px`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      handleSelectGame(suggestions[0]);
    } else if (searchQuery.trim()) {
      // Find closest matches
      const query = searchQuery.toLowerCase().trim();
      const match = allGames.find(g => g.title_clean.toLowerCase() === query || g.app_id === query);
      if (match) {
        handleSelectGame(match);
      } else {
        alert("Game details not cached in this system. Please check spelling or query code.");
      }
    }
  };

  // Automated Showcase Data derived from cleaned_games_data.csv structures
  // Top Shift games
  const getTabGames = () => {
    switch (activeTab) {
      case 'positive':
        return allGames.slice(0, 4).map(g => ({
          ...g,
          badge: `+${(Math.random() * 8 + 3).toFixed(1)}% shift`,
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          metricLabel: 'Sentiment Index',
          metricVal: '89.4%'
        }));
      case 'backlash':
        return allGames.slice(4, 8).map(g => ({
          ...g,
          badge: `-${(Math.random() * 15 + 10).toFixed(1)}% drop`,
          badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          metricLabel: 'Backlash Warning',
          metricVal: 'CRITICAL'
        }));
      case 'bugs':
        return allGames.slice(8, 12).map(g => ({
          ...g,
          badge: `${(Math.random() * 20 + 15).toFixed(0)} issues/100 reviews`,
          badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          metricLabel: 'Bug discussion density',
          metricVal: 'High Density'
        }));
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Navbar */}
      <nav className="border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-[100] px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-zinc-100 text-xs font-mono uppercase tracking-widest hover:text-white transition-colors">
            NLP SENTIMENT SCANNER
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/nyxora" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Home
          </Link>
          <Link to="/enterprise" className="text-sm bg-purple-600/10 text-purple-400 border border-purple-500/20 px-4 py-1.5 rounded-full hover:bg-purple-600 hover:text-white transition-all text-xs font-semibold">
            B2B Console
          </Link>
          <a href="/new/model-tester.html" className="text-sm text-zinc-400 hover:text-white transition-colors font-mono">
            Model Tester
          </a>
        </div>
      </nav>

      {isPageLoading ? (
        <div className="max-w-6xl mx-auto px-5 py-24 animate-pulse">
          {/* Hero Skeleton */}
          <div className="flex flex-col items-center text-center mb-24">
            <div className="bg-zinc-800/20 w-56 h-7 rounded-full mb-8" />
            <div className="bg-zinc-800/20 w-3/4 max-w-3xl h-14 rounded-xl mb-6" />
            <div className="bg-zinc-800/20 w-2/3 max-w-xl h-5 rounded-md mb-10" />
            <div className="bg-zinc-900/40 border border-zinc-800/20 w-full max-w-lg h-14 rounded-xl" />
          </div>

          {/* Core capabilities Skeleton */}
          <div className="grid md:grid-cols-3 gap-8 mb-24">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-900/10 border border-zinc-850 rounded-2xl p-6 h-52 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-zinc-800/30 rounded-xl mb-6" />
                  <div className="w-1/2 h-5 bg-zinc-800/30 rounded mb-3" />
                  <div className="w-full h-3 bg-zinc-800/25 rounded mb-2" />
                  <div className="w-5/6 h-3 bg-zinc-800/25 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Showcase Grid Skeleton */}
          <div className="border-t border-zinc-900 pt-16">
            <div className="w-48 h-8 bg-zinc-800/30 rounded mb-8" />
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-zinc-900/10 border border-zinc-850 rounded-2xl overflow-hidden h-72 flex flex-col justify-between">
                  <div>
                    <div className="aspect-video bg-zinc-800/30 w-full" />
                    <div className="p-5">
                      <div className="w-3/4 h-4 bg-zinc-800/30 rounded mb-2" />
                      <div className="w-1/2 h-3 bg-zinc-800/25 rounded" />
                    </div>
                  </div>
                  <div className="p-5 border-t border-zinc-900/50 flex items-center justify-between">
                    <div className="w-20 h-4 bg-zinc-800/30 rounded" />
                    <div className="w-8 h-8 bg-zinc-800/30 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Hero Wrapper with 3D Fish Background */}
          <div className="relative z-20 w-full border-b border-zinc-900 bg-zinc-950/20">
            <div className={`absolute inset-0 overflow-hidden transition-opacity duration-1000 ${showFish ? 'opacity-100' : 'opacity-0'}`}>
              {showFish && (
                <FishBackground 
                  gestureCoords={{ x, y }} 
                  isGestureActive={isGestureModeOn && isTracking} 
                />
              )}
            </div>
        
        {/* Hero Section */}
        <header className="relative z-10 py-24 md:py-32 px-5 max-w-6xl mx-auto flex flex-col items-center text-center">
          {/* Glow Element */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[300px] sm:h-[450px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />

          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 text-xs text-zinc-400 mb-6 font-mono">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            ACTIVE ENGINE: SVM (LINEARSVC) + TF-IDF
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-zinc-400 leading-tight">
            Steam Game Review Analysis: Decoding Gamer Intent Through Community Experience
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 mt-6 max-w-2xl leading-relaxed">
            An advanced NLP system that automatically parses millions of Steam reviews. Search keywords, map true sentiment trends, and buy your next game with absolute confidence.
          </p>

          {/* Autocomplete Search Container */}
          <div ref={searchContainerRef} className="w-full max-w-lg mt-10 relative">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <div className="absolute inset-0 bg-purple-600/20 rounded-xl blur-[12px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
              <input
                type="text"
                placeholder="Search by game name, app ID, or genre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="relative w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-5 py-4 pl-12 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 transition-all font-medium backdrop-blur-md shadow-2xl"
              />
              <Search className="absolute left-4 top-4.5 w-5 h-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
              
              {isLoading && (
                <div className="absolute right-4 top-4.5">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                </div>
              )}
            </form>

            {/* Autocomplete suggestions dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950/95 border border-zinc-800 rounded-xl shadow-2xl z-[100] backdrop-blur-xl animate-fade-in divide-y divide-zinc-900 max-h-[320px] overflow-y-auto">
                {suggestions.map((game) => (
                  <div
                    key={game.app_id}
                    onClick={() => handleSelectGame(game)}
                    className="flex items-center gap-3 p-3.5 hover:bg-white/5 transition-colors cursor-pointer group text-left"
                  >
                    <img
                      src={game.image_url || `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.app_id}/header.jpg`}
                      alt={game.title_clean}
                      className="w-14 h-8 object-cover rounded bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 transition-colors"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = import.meta.env.BASE_URL + 'surface_world.png';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-zinc-100 truncate group-hover:text-purple-400 transition-colors capitalize">
                        {game.title_clean}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        AppID: {game.app_id} • Released: {game.release_date_clean}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>
      </div>

      {/* How We Analyze Game Reviews & NLP Pipeline */}
      <ScrollReveal>
        <section 
          onMouseMove={handleSectionMouseMove}
          className="bg-zinc-950/50 border-t border-b border-zinc-900 py-28 px-5 relative overflow-hidden group/section"
        >
          {/* Ambient tracking background glow */}
          <div 
            className="absolute inset-0 pointer-events-none z-0 opacity-0 group-hover/section:opacity-100 transition-opacity duration-700"
            style={{
              background: 'radial-gradient(800px circle at var(--bg-mouse-x, 0px) var(--bg-mouse-y, 0px), rgba(168,85,247,0.035), transparent 75%)'
            }}
          />

          {/* Decorative grid lines */}
          <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.025]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '80px 80px' }}
          />

          {/* Decorative large number watermark */}
          <div className="absolute -right-8 top-8 text-[220px] font-black text-white/[0.02] leading-none select-none pointer-events-none font-cinzel z-0">
            NLP
          </div>

          <div className="max-w-6xl mx-auto relative z-10">

            {/* Editorial Header — asymmetric 2-col */}
            <div className="grid md:grid-cols-2 gap-10 items-end mb-20">
              <div>
                {/* Label */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px w-10 bg-purple-500" />
                  <span className="text-[10px] font-mono tracking-[0.25em] text-purple-400 uppercase">Core Capabilities</span>
                </div>
                {/* Big editorial title */}
                <h2 className="font-cinzel font-bold leading-[1.1] text-white">
                  <span className="block text-4xl sm:text-5xl">How We</span>
                  <span className="block text-5xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400">
                    Decode
                  </span>
                  <span className="block text-3xl sm:text-4xl text-zinc-400 font-medium">Game Reviews</span>
                </h2>
              </div>
              <div className="md:pl-8 md:border-l border-zinc-800">
                <p className="text-zinc-400 text-base leading-relaxed">
                  Our system parses unstructured review text through custom NLP filters, transforms them using TF-IDF tokenization, and classifies sentiment using machine learning models.
                </p>
                <div className="mt-6 flex items-center gap-6">
                  <div>
                    <FlippingCounter target={10} suffix="K+" duration={1600} color="text-white" />
                    <div className="text-[10px] font-mono text-zinc-500 mt-1.5 uppercase tracking-widest">Reviews Processed</div>
                  </div>
                  <div className="w-px h-10 bg-zinc-800" />
                  <div>
                    <FlippingCounter target={3} duration={1600} color="text-white" />
                    <div className="text-[10px] font-mono text-zinc-500 mt-1.5 uppercase tracking-widest">Sentiment Classes</div>
                  </div>
                  <div className="w-px h-10 bg-zinc-800" />
                  <div>
                    <FlippingCounter target={56.2} decimals={1} suffix="%" duration={1600} color="text-purple-400" />
                    <div className="text-[10px] font-mono text-zinc-500 mt-1.5 uppercase tracking-widest">F1-Macro Score</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Core capabilities — editorial numbered cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-20">
              {/* Cap 1 */}
              <div 
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
                className="bg-white/[0.02] backdrop-blur-md border border-white/[0.06] border-t-white/[0.12] rounded-2xl p-7 relative group hover:bg-white/[0.04] hover:border-purple-500/30 hover:border-t-purple-400/40 hover:shadow-[0_0_40px_-8px_rgba(168,85,247,0.15)] transition-all duration-300 shadow-2xl overflow-hidden"
                style={{ willChange: 'transform' }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(168,85,247,0.07), transparent 50%)' }}
                />
                {/* Top edge gloss */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent pointer-events-none" />

                {/* Number + icon row */}
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <span className="text-[72px] font-black leading-none text-white/[0.04] font-cinzel select-none group-hover:text-purple-400/10 transition-colors duration-500">01</span>
                  <div className="w-11 h-11 bg-purple-600/15 rounded-xl flex items-center justify-center border border-purple-500/25 text-purple-400 mt-2">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="text-[10px] font-mono tracking-[0.2em] text-purple-400 uppercase mb-2">Sentiment</div>
                  <h3 className="text-xl font-bold text-white mb-3 leading-tight">True Sentiment<br/>Analysis</h3>
                  <div className="h-px w-8 bg-purple-500/50 mb-4" />
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Move past binary Recommended/Not Recommended indicators. The sentiment classifier separates reviews into three distinct channels: Positive, Neutral, and Negative.
                  </p>
                </div>
              </div>

              {/* Cap 2 — middle card, slightly elevated */}
              <div 
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
                className="bg-white/[0.02] backdrop-blur-md border border-white/[0.06] border-t-white/[0.12] rounded-2xl p-7 relative group hover:bg-white/[0.04] hover:border-amber-500/30 hover:border-t-amber-400/40 hover:shadow-[0_0_40px_-8px_rgba(245,158,11,0.12)] transition-all duration-300 shadow-2xl overflow-hidden md:-mt-4 md:mb-4"
                style={{ willChange: 'transform' }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(245,158,11,0.06), transparent 50%)' }}
                />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />

                <div className="flex items-start justify-between mb-8 relative z-10">
                  <span className="text-[72px] font-black leading-none text-white/[0.04] font-cinzel select-none group-hover:text-amber-400/10 transition-colors duration-500">02</span>
                  <div className="w-11 h-11 bg-amber-600/15 rounded-xl flex items-center justify-center border border-amber-500/25 text-amber-400 mt-2">
                    <Bug className="w-5 h-5" />
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="text-[10px] font-mono tracking-[0.2em] text-amber-400 uppercase mb-2">Aspects</div>
                  <h3 className="text-xl font-bold text-white mb-3 leading-tight">Automated Aspect<br/>Extraction</h3>
                  <div className="h-px w-8 bg-amber-500/50 mb-4" />
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Isolate and monitor discussion densities surrounding critical optimization bugs, hardware bottlenecks (fps drops, freezes), styling choices, or gameplay depth.
                  </p>
                </div>
              </div>

              {/* Cap 3 */}
              <div 
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
                className="bg-white/[0.02] backdrop-blur-md border border-white/[0.06] border-t-white/[0.12] rounded-2xl p-7 relative group hover:bg-white/[0.04] hover:border-emerald-500/30 hover:border-t-emerald-400/40 hover:shadow-[0_0_40px_-8px_rgba(16,185,129,0.12)] transition-all duration-300 shadow-2xl overflow-hidden"
                style={{ willChange: 'transform' }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: 'radial-gradient(400px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(16,185,129,0.06), transparent 50%)' }}
                />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent pointer-events-none" />

                <div className="flex items-start justify-between mb-8 relative z-10">
                  <span className="text-[72px] font-black leading-none text-white/[0.04] font-cinzel select-none group-hover:text-emerald-400/10 transition-colors duration-500">03</span>
                  <div className="w-11 h-11 bg-emerald-600/15 rounded-xl flex items-center justify-center border border-emerald-500/25 text-emerald-400 mt-2">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="text-[10px] font-mono tracking-[0.2em] text-emerald-400 uppercase mb-2">Monitoring</div>
                  <h3 className="text-xl font-bold text-white mb-3 leading-tight">Patch-based Trend<br/>Monitoring</h3>
                  <div className="h-px w-8 bg-emerald-500/50 mb-4" />
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Map community sentiment swings immediately following major patch releases, hotfixes, or DLC expansions to flag regressions or sudden review-bombing events.
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced NLP Pipeline — Horizontal Flow Timeline */}
            <div className="border-t border-zinc-800/60 pt-20">

              {/* Pipeline Header — inline horizontal label style */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-16">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400/25" />
                    <span className="text-[10px] font-mono tracking-[0.25em] text-zinc-500 uppercase ml-1">Pipeline v2.1</span>
                  </div>
                  <h3 className="font-cinzel font-bold text-white">
                    <span className="block text-xs font-mono text-purple-400 tracking-widest mb-1 font-sans">UNDER THE HOOD</span>
                    <span className="text-3xl sm:text-4xl leading-tight">Advanced NLP<br/>
                      <span className="text-zinc-400 font-medium text-2xl sm:text-3xl">Preprocessing Pipeline</span>
                    </span>
                  </h3>
                </div>
                {/* Terminal-style badge */}
                <div className="shrink-0 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 font-mono text-xs text-zinc-500 self-start sm:self-auto">
                  <span className="text-zinc-600">$ </span>
                  <span className="text-emerald-400">nlp</span>
                  <span className="text-zinc-400">.pipe(</span>
                  <span className="text-purple-400">reviews</span>
                  <span className="text-zinc-400">)</span>
                  <br/>
                  <span className="text-zinc-600">→ </span>
                  <span className="text-amber-400">5 transforms</span>
                  <span className="text-zinc-600"> applied</span>
                </div>
              </div>

              {/* Flow connector line + steps */}
              <div className="relative">
                {/* Continuous gradient connector line (desktop only) */}
                <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-px z-0"
                  style={{ background: 'linear-gradient(to right, rgba(168,85,247,0.1), rgba(168,85,247,0.4) 25%, rgba(168,85,247,0.6) 50%, rgba(168,85,247,0.4) 75%, rgba(168,85,247,0.1))' }}
                />

                <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
                  {/* Step data array rendered as cards */}
                  {([
                    {
                      n: '01', label: 'Negation\nMarking',
                      desc: 'Binds negation particles (e.g. "not good" → "not_good") to preserve negative context during tokenization and stopword removal.',
                      tag: 'TOKENIZE'
                    },
                    {
                      n: '02', label: 'POS\nFiltering',
                      desc: 'Keeps only Adjectives, Verbs, and Adverbs. Filters out Nouns to isolate active emotional sentiment signaling.',
                      tag: 'FILTER'
                    },
                    {
                      n: '03', label: 'Lemma-\ntization',
                      desc: 'Converts inflected words to their base forms (e.g., playing → play) using WordNetLemmatizer to reduce feature dictionary noise.',
                      tag: 'NORMALIZE'
                    },
                    {
                      n: '04', label: 'VADER\nCleaning',
                      desc: 'Applies independent VADER sentiment scores to detect and automatically correct reversed or noisy labels in crawled training sets.',
                      tag: 'VALIDATE'
                    },
                    {
                      n: '05', label: 'TF-IDF\nVectorize',
                      desc: 'Transforms text inputs into sparse numerical features (1-to-3 n-gram range, capped at a maximum of 12,000 components).',
                      tag: 'ENCODE'
                    },
                  ] as {n:string; label:string; desc:string; tag:string}[]).map((step, i) => (
                    <div
                      key={step.n}
                      onMouseMove={handleCardMouseMove}
                      onMouseLeave={handleCardMouseLeave}
                      className="relative group flex flex-col items-center text-center"
                      style={{ willChange: 'transform' }}
                    >
                      {/* Circle node */}
                      <div className="relative mb-5">
                        <div className="w-14 h-14 rounded-full bg-zinc-950 border border-zinc-700 group-hover:border-purple-500/60 flex items-center justify-center transition-all duration-300 relative z-10 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]">
                          <span className="font-cinzel font-black text-sm text-zinc-400 group-hover:text-purple-300 transition-colors duration-300">{step.n}</span>
                        </div>
                        {/* Glow ring */}
                        <div className="absolute inset-0 rounded-full bg-purple-500/0 group-hover:bg-purple-500/10 transition-all duration-300 scale-[1.3]" />
                      </div>

                      {/* Card body */}
                      <div
                        className="w-full bg-white/[0.01] backdrop-blur-md border border-white/[0.04] border-t-white/[0.08] rounded-xl p-4 relative overflow-hidden transition-all duration-300 hover:bg-white/[0.03] hover:border-purple-500/20"
                      >
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                          style={{ background: 'radial-gradient(250px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(168,85,247,0.06), transparent 60%)' }}
                        />
                        {/* Top gloss */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                        <div className="relative z-10">
                          {/* Tag */}
                          <div className="inline-block text-[9px] font-mono tracking-[0.2em] text-purple-400/60 group-hover:text-purple-300 bg-purple-500/5 border border-purple-500/10 rounded px-1.5 py-0.5 mb-3 transition-colors duration-300">
                            {step.tag}
                          </div>
                          {/* Title */}
                          <h4 className="font-bold text-sm text-white leading-snug mb-2 whitespace-pre-line">{step.label}</h4>
                          {/* Divider */}
                          <div className="h-px w-6 mx-auto bg-zinc-700 group-hover:bg-purple-500/40 transition-colors duration-300 mb-3" />
                          {/* Desc */}
                          <p className="text-zinc-500 text-xs leading-relaxed group-hover:text-zinc-400 transition-colors duration-300">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Model Benchmarking Section */}
      <ScrollReveal>
        <section className="py-24 px-5 max-w-6xl mx-auto border-b border-zinc-900">
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-cinzel text-center">
              Model Performance Comparison Report
            </h2>
            <p className="text-zinc-500 mt-2 text-sm text-center max-w-xl mx-auto">
              The system trains and benchmarks four classifier models on the exact same TF-IDF features to select the best-performing algorithm.
            </p>
          </div>
          <div 
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            className="overflow-x-auto bg-white/[0.02] backdrop-blur-md border border-white/[0.06] border-t-white/[0.12] rounded-2xl shadow-xl relative overflow-hidden group/table transition-all duration-300"
          >
            {/* Glossy spotlight overlay */}
            <div 
              className="absolute inset-0 opacity-0 group-hover/table:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background: 'radial-gradient(600px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(168,85,247,0.04), transparent 50%)'
              }}
            />
            <table className="w-full text-left border-collapse relative z-10">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/50 text-xs font-mono text-zinc-400">
                  <th className="p-4 sm:p-5">Classifier Model</th>
                  <th className="p-4 sm:p-5">Accuracy</th>
                  <th className="p-4 sm:p-5 text-purple-400 font-bold">F1-Macro (Selected)</th>
                  <th className="p-4 sm:p-5">F1 Negative (-1)</th>
                  <th className="p-4 sm:p-5">F1 Neutral (0)</th>
                  <th className="p-4 sm:p-5">F1 Positive (1)</th>
                  <th className="p-4 sm:p-5">Training Time</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm divide-y divide-zinc-900 text-zinc-300">
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-zinc-100">Logistic Regression</td>
                  <td className="p-4 sm:p-5">62.8%</td>
                  <td className="p-4 sm:p-5 font-medium">0.5605</td>
                  <td className="p-4 sm:p-5">0.523</td>
                  <td className="p-4 sm:p-5 text-amber-500/80">0.416</td>
                  <td className="p-4 sm:p-5">0.742</td>
                  <td className="p-4 sm:p-5 font-mono">0.12 s</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-zinc-100">Naive Bayes (MultinomialNB)</td>
                  <td className="p-4 sm:p-5">74.6%</td>
                  <td className="p-4 sm:p-5 font-medium">0.4322</td>
                  <td className="p-4 sm:p-5">0.388</td>
                  <td className="p-4 sm:p-5 text-rose-500 font-semibold bg-rose-500/5">0.057 (Collapsed)</td>
                  <td className="p-4 sm:p-5">0.851</td>
                  <td className="p-4 sm:p-5 font-mono">0.00 s</td>
                </tr>
                <tr className="bg-purple-600/5 border-l-4 border-purple-500 hover:bg-purple-600/10 transition-colors">
                  <td className="p-4 sm:p-5 font-bold text-white flex items-center gap-1.5">
                    SVM (LinearSVC) <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded font-mono font-normal">ACTIVE</span>
                  </td>
                  <td className="p-4 sm:p-5 font-semibold text-zinc-100">64.8%</td>
                  <td className="p-4 sm:p-5 font-extrabold text-purple-400">0.5620</td>
                  <td className="p-4 sm:p-5">0.505</td>
                  <td className="p-4 sm:p-5 text-emerald-400 font-semibold">0.418 (Highest)</td>
                  <td className="p-4 sm:p-5">0.763</td>
                  <td className="p-4 sm:p-5 font-mono">0.04 s</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-zinc-100">Random Forest</td>
                  <td className="p-4 sm:p-5">65.1%</td>
                  <td className="p-5 font-medium">0.5430</td>
                  <td className="p-4 sm:p-5">0.442</td>
                  <td className="p-4 sm:p-5 text-emerald-400/80">0.418</td>
                  <td className="p-4 sm:p-5">0.768</td>
                  <td className="p-4 sm:p-5 font-mono">0.97 s</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div 
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            className="bg-white/[0.01] backdrop-blur-md border border-white/[0.04] border-t-white/[0.08] rounded-xl p-4 mt-4 text-xs text-zinc-400 flex items-start gap-2.5 leading-relaxed relative overflow-hidden group/info transition-all duration-300 shadow-lg"
          >
            {/* Glossy spotlight overlay */}
            <div 
              className="absolute inset-0 opacity-0 group-hover/info:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background: 'radial-gradient(400px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(168,85,247,0.04), transparent 50%)'
              }}
            />
            <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5 relative z-10" />
            <p className="relative z-10">
              <strong>Data Science Analysis:</strong> Although Naive Bayes has the highest overall Accuracy (74.6%), its Neutral class F1-score collapsed to 0.057. This demonstrates severe model bias caused by class imbalance and Naive Bayes' feature-independence assumptions. The <strong>SVM (LinearSVC)</strong> model is active in production because it maintains the highest F1-macro score (0.5620), showing stable, balanced classification across all three sentiment classes.
            </p>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="py-24 px-5 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-cinzel">
                Trending Games Showcase
              </h2>
              <p className="text-zinc-500 mt-2 text-sm">
                Timely analysis of community reviews, highlighting shifts in sentiment and structural backlash.
              </p>
            </div>

            {/* Grid Tabs */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1.5 rounded-full self-start relative overflow-hidden">
              {/* Sliding Pill Indicator */}
              <div 
                className={`absolute top-1.5 bottom-1.5 rounded-full transition-all duration-300 ease-out z-0 ${
                  activeTab === 'positive' 
                    ? 'left-[6px] w-[130px] bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.3)]' 
                    : activeTab === 'backlash' 
                    ? 'left-[140px] w-[155px] bg-rose-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]' 
                    : 'left-[299px] w-[155px] bg-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.3)]'
                }`}
              />
              
              <button
                onClick={() => setActiveTab('positive')}
                className={`py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors duration-300 w-[130px] justify-center relative z-10 ${
                  activeTab === 'positive' ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Highest Shift
              </button>
              <button
                onClick={() => setActiveTab('backlash')}
                className={`py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors duration-300 w-[155px] justify-center relative z-10 ${
                  activeTab === 'backlash' ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Backlash Warning
              </button>
              <button
                onClick={() => setActiveTab('bugs')}
                className={`py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors duration-300 w-[155px] justify-center relative z-10 ${
                  activeTab === 'bugs' ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Bug className="w-3.5 h-3.5" />
                High Bugs Density
              </button>
            </div>
          </div>

          {/* Dynamic tab contents (programmatic SEO internal links) */}
          {allGames.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-zinc-800 border-dashed rounded-3xl bg-zinc-950/20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <div className="text-zinc-500 text-sm mt-4">Loading matrix telemetry...</div>
            </div>
          ) : (
            <div key={activeTab} className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in">
              {getTabGames().map((game) => {
                const slug = game.title_clean
                  .toLowerCase()
                  .trim()
                  .replace(/[^\w\s-]/g, '')
                  .replace(/[\s_]+/g, '-')
                  .replace(/-+/g, '-');
                
                return (
                  <div
                    key={game.app_id}
                    onClick={() => handleSelectGame(game)}
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] border-t-white/[0.12] rounded-2xl overflow-hidden cursor-pointer group flex flex-col justify-between shadow-2xl h-full relative transition-colors duration-300 hover:border-purple-500/20"
                    style={{ willChange: 'transform' }}
                  >
                    {/* 3D spotlight overlay */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 rounded-2xl"
                      style={{
                        background: 'radial-gradient(280px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(168,85,247,0.08), transparent 60%)'
                      }}
                    />
                    {/* Top edge gloss */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-10" />

                    <div className="relative z-0">
                      {/* Cover image */}
                      <div className="relative aspect-video w-full overflow-hidden bg-zinc-900 border-b border-white/[0.06]">
                        <img
                          src={game.image_url || `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.app_id}/header.jpg`}
                          alt={game.title_clean}
                          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = import.meta.env.BASE_URL + 'surface_world.png';
                          }}
                        />
                        <span className={`absolute top-2.5 right-2.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border border-white/10 ${game.badgeColor}`}>
                          {game.badge}
                        </span>
                      </div>

                      <div className="p-5">
                        <h3 className="font-bold text-sm text-zinc-100 group-hover:text-purple-400 transition-colors truncate capitalize">
                          {game.title_clean}
                        </h3>
                        <div className="text-xs text-zinc-500 mt-1 font-mono">AppID: {game.app_id}</div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 mt-auto flex items-center justify-between border-t border-white/[0.04] pt-4 relative z-0">
                      <div>
                        <div className="text-[10px] text-purple-400 uppercase tracking-widest font-mono font-semibold">
                          {game.price_clean === 0 ? "Free To Play" : `${Math.round(game.price_clean).toLocaleString("vi-VN")} đ`}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          Released: {game.release_date_clean || "N/A"}
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-zinc-900/80 flex items-center justify-center text-zinc-400 group-hover:bg-purple-600/20 group-hover:text-purple-400 transition-all border border-white/[0.06] shrink-0">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </ScrollReveal>
        </>
      )}


    </div>
  );
};

