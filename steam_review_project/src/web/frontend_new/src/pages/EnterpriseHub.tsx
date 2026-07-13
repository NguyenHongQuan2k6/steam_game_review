import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Bug, BarChart3, Check, ArrowLeft, ShieldCheck, Send } from 'lucide-react';

export const EnterpriseHub: React.FC = () => {
  const navigate = useNavigate();
  const [quoteEmail, setQuoteEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (quoteEmail) {
      setSubmitted(true);
    }
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const rotateX = ((yc - y) / yc) * 4; // subtle 4 degrees tilt
    const rotateY = ((x - xc) / xc) * 4;
    
    card.style.transition = 'transform 0.1s ease-out';
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.transition = 'transform 0.5s ease-out';
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-purple-600 pb-20 overflow-hidden relative">
      {/* Background glowing blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Top Navbar */}
      <nav className="border-b border-zinc-800/60 bg-[#09090b]/85 backdrop-blur-xl sticky top-0 z-[100] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sentiment')} className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em]">B2B Developer Hub</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/sentiment" className="text-xs font-mono text-zinc-400 hover:text-purple-400 transition-colors uppercase tracking-wider">
            Return to Analyzer
          </Link>
          <a href="/new/model-tester.html" className="text-xs font-mono text-zinc-400 hover:text-purple-400 transition-colors uppercase tracking-wider">
            Model Tester
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative py-24 px-5 max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* Label */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-8 bg-purple-500/60" />
          <span className="text-[10px] font-mono tracking-[0.25em] text-purple-400 uppercase">Cognitive NLP Telemetry</span>
          <div className="h-px w-8 bg-purple-500/60" />
        </div>

        <h1 className="font-cinzel font-bold text-white leading-[1.1] max-w-4xl">
          <span className="block text-3xl sm:text-4xl md:text-5xl">Convert Steam Backlash Into</span>
          <span className="block text-4xl sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400 mt-2">
            Product Optimization
          </span>
        </h1>

        <p className="text-base text-zinc-400 mt-6 max-w-2xl leading-relaxed">
          Monitor your brand health in real-time, extract constructive bug logs directly from unstructured text, and run deep comparative sentiment telemetry against competitor titles.
        </p>
      </header>

      {/* B2B Value Pillar Matrix */}
      <section className="max-w-6xl mx-auto px-5 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div 
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            className="bg-white/[0.01] backdrop-blur-md border border-white/[0.05] border-t-white/[0.10] rounded-2xl p-7 relative overflow-hidden group hover:border-purple-500/20 hover:bg-white/[0.02] hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.1)] transition-all duration-300"
            style={{ willChange: 'transform' }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: 'radial-gradient(350px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(168,85,247,0.06), transparent 60%)' }}
            />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent pointer-events-none" />
            
            <div className="w-11 h-11 bg-purple-600/15 rounded-xl flex items-center justify-center border border-purple-500/25 text-purple-400 mb-6">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-mono tracking-[0.2em] text-purple-400 uppercase mb-2">Crisis Control</div>
            <h3 className="text-lg font-bold mb-3 font-cinzel text-white">Early Crisis Intervention</h3>
            <div className="h-px w-6 bg-purple-500/30 mb-4" />
            <p className="text-zinc-400 text-sm leading-relaxed">
              Automated real-time alerts flagging aggressive "Review Bombing" anomalies. Our models detect spikes in malicious bot activity and coordinated review attacks within minutes.
            </p>
          </div>

          {/* Pillar 2 */}
          <div 
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            className="bg-white/[0.01] backdrop-blur-md border border-white/[0.05] border-t-white/[0.10] rounded-2xl p-7 relative overflow-hidden group hover:border-amber-500/20 hover:bg-white/[0.02] hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.08)] transition-all duration-300 md:-mt-3 md:mb-3"
            style={{ willChange: 'transform' }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: 'radial-gradient(350px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(245,158,11,0.05), transparent 60%)' }}
            />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent pointer-events-none" />
            
            <div className="w-11 h-11 bg-amber-600/15 rounded-xl flex items-center justify-center border border-amber-500/25 text-amber-400 mb-6">
              <Bug className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-mono tracking-[0.2em] text-amber-400 uppercase mb-2">Telemetry</div>
            <h3 className="text-lg font-bold mb-3 font-cinzel text-white">Automated Bug Extraction</h3>
            <div className="h-px w-6 bg-amber-500/30 mb-4" />
            <p className="text-zinc-400 text-sm leading-relaxed">
              Instant semantic compilation of engineering bugs, software crashes, and performance regressions mentioned directly within raw user reviews. Pinpoint hardware configs experiencing memory leaks.
            </p>
          </div>

          {/* Pillar 3 */}
          <div 
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            className="bg-white/[0.01] backdrop-blur-md border border-white/[0.05] border-t-white/[0.10] rounded-2xl p-7 relative overflow-hidden group hover:border-emerald-500/20 hover:bg-white/[0.02] hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.08)] transition-all duration-300"
            style={{ willChange: 'transform' }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: 'radial-gradient(350px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(16,185,129,0.05), transparent 60%)' }}
            />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent pointer-events-none" />
            
            <div className="w-11 h-11 bg-emerald-600/15 rounded-xl flex items-center justify-center border border-emerald-500/25 text-emerald-400 mb-6">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="text-[10px] font-mono tracking-[0.2em] text-emerald-400 uppercase mb-2">Analytics</div>
            <h3 className="text-lg font-bold mb-3 font-cinzel text-white">Competitive Intelligence</h3>
            <div className="h-px w-6 bg-emerald-500/30 mb-4" />
            <p className="text-zinc-400 text-sm leading-relaxed">
              Machine-learning backed breakdown of competitor titles prior to targeting release windows. Gain insights on feature demands, gameplay loops, and gaps in competitor support pipelines.
            </p>
          </div>
        </div>
      </section>

      {/* Programmatic Tiered Pricing Component */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-[10px] font-mono tracking-[0.25em] text-purple-400 uppercase">PRICING TIERS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-cinzel text-white">SaaS Developer Pricing</h2>
          <p className="text-zinc-500 mt-2 text-sm">Flexible tiers to scale your studio's telemetry capabilities.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {/* Tier 1 */}
          <div 
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            className="bg-white/[0.01] border border-white/[0.05] rounded-3xl p-8 flex flex-col justify-between shadow-xl relative hover:border-white/[0.1] transition-all duration-300"
            style={{ willChange: 'transform' }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: 'radial-gradient(350px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.02), transparent 60%)' }}
            />
            <div>
              <div className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase font-semibold">Tiers 01</div>
              <h3 className="text-xl font-bold mt-2 font-cinzel">Developer Sandbox</h3>
              <p className="text-zinc-500 text-xs mt-1">Pre-computed analytics for test titles.</p>
              
              <div className="mt-6 flex items-baseline gap-1 font-mono">
                <span className="text-4xl font-extrabold">$0</span>
                <span className="text-zinc-500 text-xs uppercase tracking-widest">/ Free</span>
              </div>

              <div className="h-px bg-white/[0.06] my-6" />

              <ul className="space-y-4 text-xs text-zinc-400">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>Access to pre-computed static analytics for up to 3 historic titles</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>Local CSV parsed data visualization telemetry</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>Standard TF-IDF coefficients overview</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => alert("Free tier active. Check local CSV templates in sandbox folders.")}
              className="w-full bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white font-medium py-3 rounded-xl text-xs uppercase tracking-widest transition-all mt-8"
            >
              Access Sandbox
            </button>
          </div>

          {/* Tier 2 */}
          <div 
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            className="bg-purple-950/[0.05] border-2 border-purple-500/50 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative transition-all duration-300 hover:border-purple-500"
            style={{ willChange: 'transform' }}
          >
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[9px] font-bold font-mono px-3.5 py-1 rounded-full uppercase tracking-widest">
              Recommended
            </div>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: 'radial-gradient(350px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(168,85,247,0.06), transparent 60%)' }}
            />
            
            <div>
              <div className="text-[9px] text-purple-400 font-mono tracking-widest uppercase font-semibold">Tiers 02</div>
              <h3 className="text-xl font-bold mt-2 font-cinzel">Publisher Pro</h3>
              <p className="text-zinc-500 text-xs mt-1">Real-time sentiment monitoring pipeline.</p>
              
              <div className="mt-6 flex items-baseline gap-1 font-mono">
                <span className="text-4xl font-extrabold text-purple-400">$49</span>
                <span className="text-zinc-500 text-xs">/ MONTH</span>
              </div>

              <div className="h-px bg-purple-500/20 my-6" />

              <ul className="space-y-4 text-xs text-zinc-300">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>Real-time monitoring pipelines hooked to 1 active AppID</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>Weekly automated diagnostic reviews delivered via webhook/email</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>Interactive sentiment analysis updates with API token access</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>Basic bug-tracking summary matrices exports</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => alert("Subscription portal coming soon. Publisher Pro pricing locked in.")}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl text-xs uppercase tracking-widest transition-all mt-8 shadow-lg shadow-purple-600/25 hover:scale-[1.01]"
            >
              Subscribe Now
            </button>
          </div>

          {/* Tier 3 */}
          <div 
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            className="bg-white/[0.01] border border-white/[0.05] rounded-3xl p-8 flex flex-col justify-between shadow-xl relative hover:border-white/[0.1] transition-all duration-300"
            style={{ willChange: 'transform' }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: 'radial-gradient(350px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.02), transparent 60%)' }}
            />
            <div>
              <div className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase font-semibold">Tiers 03</div>
              <h3 className="text-xl font-bold mt-2 font-cinzel">Enterprise Suite</h3>
              <p className="text-zinc-500 text-xs mt-1">Custom pipelines and workbook extracts.</p>
              
              <div className="mt-6 flex items-baseline gap-1 font-mono">
                <span className="text-4xl font-extrabold text-white">Custom</span>
                <span className="text-zinc-500 text-xs uppercase tracking-widest">/ Quote</span>
              </div>

              <div className="h-px bg-white/[0.06] my-6" />

              <ul className="space-y-4 text-xs text-zinc-400">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>Multi-title portfolio tracking with continuous indexing</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>Full raw data pipeline ingestion of Steam logs</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>Programmatic exports of NLP feature matrices via formatted workbooks (1_Data_Before_and_After_NLP.xlsx)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>Dedicated accounts representative & priority SLA</span>
                </li>
              </ul>
            </div>

            {submitted ? (
              <div className="mt-8 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-3.5 text-xs font-mono text-center flex items-center justify-center gap-1.5 animate-fade-in">
                <ShieldCheck className="w-4 h-4" />
                Quote Request Submitted
              </div>
            ) : (
              <form onSubmit={handleSubmitQuote} className="mt-8 flex flex-col gap-2 relative z-10">
                <input
                  type="email"
                  required
                  placeholder="Enter work email..."
                  value={quoteEmail}
                  onChange={(e) => setQuoteEmail(e.target.value)}
                  className="bg-[#09090b]/80 border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60"
                />
                <button
                  type="submit"
                  className="w-full bg-white hover:bg-zinc-100 text-zinc-950 font-semibold py-3 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  Request Quote
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Enterprise R&D Roadmap Section */}
      <section className="max-w-6xl mx-auto px-5 py-8 border-t border-zinc-900 mt-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-[10px] font-mono tracking-[0.25em] text-purple-400 uppercase">FUTURE R&D ROADMAP</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-cinzel text-white">
            Technology Initiatives
          </h2>
          <p className="text-zinc-500 mt-2 text-sm max-w-xl mx-auto">
            We continuously iterate our sentiment classification pipeline by researching and implementing cutting-edge NLP technologies.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          {/* Cải tiến Dữ liệu & Kỹ thuật đặc trưng */}
          <div className="bg-white/[0.01] border border-white/[0.04] rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/25 to-transparent pointer-events-none" />
            <div>
              <span className="text-[9px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Pipeline Optimization
              </span>
              <h3 className="text-lg font-bold mt-4 mb-3 font-cinzel">Pipeline Optimization & Feature Engineering</h3>
              <ul className="space-y-3 text-sm text-zinc-400 pl-1">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Balance Neutral-Class Samples:</strong> Collect and hand-label additional Neutral reviews to mitigate training set class imbalance.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Tune VADER Corrections:</strong> Optimize noise-filtering thresholds (currently ±0.35) used for automated label cleaning.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Sentiment-Lexicon Integration:</strong> Embed raw VADER sentiment scores directly as supplementary features alongside TF-IDF vectors.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Mô hình nâng cao BERT / Transformers */}
          <div className="bg-white/[0.01] border border-white/[0.04] rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent pointer-events-none" />
            <div>
              <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Transformer Architecture
              </span>
              <h3 className="text-lg font-bold mt-4 mb-3 font-cinzel">BERT & Deep Learning Architectures</h3>
              <ul className="space-y-3 text-sm text-zinc-400 pl-1">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Contextual Word Embeddings:</strong> Evaluate bidirectional transformer models (BERT) to capture rich context instead of bag-of-words n-grams.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Gradient Boosted Trees:</strong> Train and tune XGBoost classifiers to benchmark performance swings against the active linear SVM.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Resolve Complex Negation:</strong> Utilize transformer Attention mechanisms to capture long-range dependencies, resolving semantic gaming slang.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
