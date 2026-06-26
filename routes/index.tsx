import { Head } from "$fresh/runtime.ts";

export default function Home() {
  return (
    <>
      <Head>
        <title>Clanker Arena | Lobby</title>
        <style>
          {`
            body { background-color: #050505; color: #f3f4f6; overflow: hidden; font-family: 'Inter', sans-serif; }
            .glass { background: rgba(15, 15, 20, 0.8); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
            .glass-card { background: linear-gradient(145deg, rgba(30, 30, 40, 0.6), rgba(15, 15, 20, 0.8)); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.08); transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
            .glass-card:hover { transform: translateY(-4px); border-color: rgba(255, 255, 255, 0.2); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4); }
            
            .mode-card-featured { background: linear-gradient(145deg, rgba(153, 27, 27, 0.3), rgba(69, 10, 10, 0.6)); border: 1px solid rgba(239, 68, 68, 0.4); }
            .mode-card-featured:hover { box-shadow: 0 0 30px rgba(239, 68, 68, 0.3); border-color: rgba(239, 68, 68, 0.8); transform: scale(1.02); }
            
            .mode-card-secondary { background: linear-gradient(145deg, rgba(30, 58, 138, 0.2), rgba(15, 23, 42, 0.5)); border: 1px solid rgba(59, 130, 246, 0.3); transition: all 0.3s ease; }
            .mode-card-secondary:hover { box-shadow: 0 0 25px rgba(59, 130, 246, 0.3); border-color: rgba(59, 130, 246, 0.7); transform: translateY(-5px); }
            
            .currency-pill { background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 9999px; }
            .nav-item { transition: all 0.2s ease; opacity: 0.6; }
            .nav-item:hover { opacity: 1; transform: scale(1.05); }
            .nav-item.active { opacity: 1; color: #22d3ee; }
            
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}
        </style>
      </Head>

      <div class="h-screen w-screen flex flex-col relative overflow-hidden bg-gray-950">
        {/* Subtle background grid pattern */}
        <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

        {/* Top Bar UX: Profile | Main Currency || Premium Currencies | Settings */}
        <header class="h-16 glass z-20 flex items-center justify-between px-6 relative">
          <div class="flex items-center gap-6">
            {/* User Profile / Level */}
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-[2px] cursor-pointer hover:scale-105 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <div class="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                <span class="text-xs font-black text-cyan-400">42</span>
              </div>
            </div>
            
            {/* Main Currency (Trophies/Rank Equiv) */}
            <div class="flex items-center gap-2 currency-pill px-4 py-1.5 cursor-pointer hover:bg-white/10 transition-colors">
              <svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg>
              <span class="text-yellow-500 font-bold tracking-widest text-sm">200,000</span>
            </div>
          </div>

          <div class="flex items-center gap-4">
            {/* Premium Currency 1 */}
            <div class="flex items-center gap-2 currency-pill px-3 py-1.5 cursor-pointer hover:bg-white/10 transition-colors">
              <div class="w-3.5 h-3.5 rounded-sm rotate-45 bg-pink-500 shadow-[0_0_10px_#ec4899]"></div>
              <span class="font-mono text-pink-400 font-bold text-sm">999</span>
            </div>
            {/* Premium Currency 2 */}
            <div class="flex items-center gap-2 currency-pill px-3 py-1.5 cursor-pointer hover:bg-white/10 transition-colors">
              <div class="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
              <span class="font-mono text-green-400 font-bold text-sm">999</span>
            </div>
            {/* Settings */}
            <button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </button>
          </div>
        </header>

        <div class="flex flex-1 overflow-hidden relative z-10">
          {/* Left Sidebar UX: Vertical Nav Items */}
          <aside class="w-24 bg-gray-900/50 backdrop-blur-md flex flex-col items-center py-6 gap-8 border-r border-white/5">
            <button class="nav-item flex flex-col items-center gap-2 group">
              <svg class="w-7 h-7 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
              <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white">News</span>
            </button>
            <button class="nav-item flex flex-col items-center gap-2 group">
              <svg class="w-7 h-7 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white">Guild</span>
            </button>
            <button class="nav-item active flex flex-col items-center gap-2 group relative">
              <div class="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full scale-150"></div>
              <svg class="w-9 h-9 text-cyan-400 relative drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              <span class="text-[10px] font-bold uppercase tracking-widest text-cyan-400 relative drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">Arena</span>
            </button>
            <button class="nav-item flex flex-col items-center gap-2 group">
              <svg class="w-7 h-7 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white">Bots</span>
            </button>
            <button class="nav-item flex flex-col items-center gap-2 group mt-auto mb-4">
              <svg class="w-7 h-7 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white">Store</span>
            </button>
          </aside>

          {/* Main Content UX */}
          <main class="flex-1 flex flex-col p-8 gap-6 overflow-hidden">
            
            {/* Top Row UX: Horizontal Game Modes */}
            <div class="flex-1 flex gap-5 min-h-0 hide-scrollbar overflow-x-auto pb-2">
              
              {/* Featured Mode */}
              <div class="flex-[1.8] mode-card-featured rounded-2xl relative overflow-hidden flex flex-col cursor-pointer transition-transform duration-300">
                <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.15),transparent)] pointer-events-none"></div>
                <div class="h-14 bg-red-950/80 border-b border-red-500/30 flex items-center justify-between px-6 backdrop-blur-md z-10">
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]"></div>
                    <span class="font-black text-white tracking-widest text-lg">FRONTS MODE</span>
                  </div>
                  <span class="text-xs font-mono text-red-300 font-bold bg-red-900/50 px-2 py-1 rounded border border-red-500/30">ACTIVE</span>
                </div>
                
                <div class="flex-1 flex items-center justify-center relative z-0">
                  <div class="w-48 h-48 rounded-full border border-red-500/20 bg-red-900/10 flex items-center justify-center relative shadow-[inset_0_0_50px_rgba(220,38,38,0.1)]">
                    <svg class="w-20 h-20 text-red-500/80 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>
                  </div>
                </div>

                <div class="h-16 bg-gradient-to-t from-red-950/90 to-transparent flex items-end justify-between px-6 pb-4 z-10">
                  <span class="font-medium tracking-wide text-red-200">Sector 7 Layout</span>
                </div>
              </div>

              {/* Secondary Modes */}
              <div class="flex-[2.5] flex gap-4">
                
                {/* Secondary Mode 1 */}
                <div class="flex-1 mode-card-secondary rounded-2xl relative overflow-hidden flex flex-col cursor-pointer group">
                  <div class="h-12 bg-blue-950/80 border-b border-blue-500/30 flex items-center justify-between px-4 backdrop-blur-md z-10">
                    <span class="font-black text-white tracking-widest text-sm truncate">KING OF HILL</span>
                  </div>
                  <div class="absolute top-16 right-3 bg-black/80 px-2 py-1 rounded-md text-[10px] font-mono text-cyan-400 border border-cyan-500/30 z-10 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                    7h 15m
                  </div>
                  <div class="flex-1 bg-gradient-to-b from-blue-900/10 to-blue-900/30 relative flex items-center justify-center">
                    <svg class="w-16 h-16 text-blue-500/30 group-hover:text-blue-400/60 transition-colors" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clip-rule="evenodd" /></svg>
                  </div>
                  <div class="absolute bottom-12 inset-x-0 px-4 z-10">
                    <span class="text-xs font-medium text-blue-300">The Spire</span>
                  </div>
                  <div class="h-10 bg-gray-900/90 border-t border-white/5 flex items-center justify-between px-4 z-10">
                    <div class="flex items-center gap-1.5">
                      <div class="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee]"></div>
                      <span class="text-xs font-bold text-gray-300 font-mono">15/30</span>
                    </div>
                  </div>
                </div>

                {/* Secondary Mode 2 */}
                <div class="flex-1 mode-card-secondary rounded-2xl relative overflow-hidden flex flex-col cursor-pointer group">
                  <div class="h-12 bg-purple-950/80 border-b border-purple-500/30 flex items-center justify-between px-4 backdrop-blur-md z-10">
                    <span class="font-black text-white tracking-widest text-sm truncate">FREE-FOR-ALL</span>
                  </div>
                  <div class="absolute top-16 right-3 bg-black/80 px-2 py-1 rounded-md text-[10px] font-mono text-cyan-400 border border-cyan-500/30 z-10 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                    7h 15m
                  </div>
                  <div class="flex-1 bg-gradient-to-b from-purple-900/10 to-purple-900/30 relative flex items-center justify-center">
                    <svg class="w-16 h-16 text-purple-500/30 group-hover:text-purple-400/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  </div>
                  <div class="absolute bottom-12 inset-x-0 px-4 z-10">
                    <span class="text-xs font-medium text-purple-300">Neon Slums</span>
                  </div>
                  <div class="h-10 bg-gray-900/90 border-t border-white/5 flex items-center justify-between px-4 z-10">
                    <div class="flex items-center gap-1.5">
                      <div class="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee]"></div>
                      <span class="text-xs font-bold text-gray-300 font-mono">15/30</span>
                    </div>
                  </div>
                </div>

                {/* Secondary Mode 3 */}
                <div class="flex-1 mode-card-secondary rounded-2xl relative overflow-hidden flex flex-col cursor-pointer group">
                  <div class="h-12 bg-emerald-950/80 border-b border-emerald-500/30 flex items-center justify-between px-4 backdrop-blur-md z-10">
                    <span class="font-black text-white tracking-widest text-sm truncate">TOURNAMENT</span>
                  </div>
                  <div class="absolute top-16 right-3 bg-black/80 px-2 py-1 rounded-md text-[10px] font-mono text-cyan-400 border border-cyan-500/30 z-10 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                    7h 15m
                  </div>
                  <div class="flex-1 bg-gradient-to-b from-emerald-900/10 to-emerald-900/30 relative flex items-center justify-center">
                    <svg class="w-16 h-16 text-emerald-500/30 group-hover:text-emerald-400/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                  </div>
                  <div class="absolute bottom-12 inset-x-0 px-4 z-10">
                    <span class="text-xs font-medium text-emerald-300">The Core</span>
                  </div>
                  <div class="h-10 bg-gray-900/90 border-t border-white/5 flex items-center justify-between px-4 z-10">
                    <div class="flex items-center gap-1.5">
                      <div class="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee]"></div>
                      <span class="text-xs font-bold text-gray-300 font-mono">15/30</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Row UX: Actions / Social */}
            <div class="h-32 flex gap-5 shrink-0">
              
              {/* Left Action (Brawl Boxes UX -> System Crates) */}
              <div class="flex-[1.2] glass-card rounded-2xl flex relative overflow-hidden cursor-pointer group hover:border-cyan-500/50">
                <div class="absolute inset-y-0 left-0 w-1.5 bg-cyan-500 shadow-[0_0_15px_#06b6d4]"></div>
                <div class="flex items-center p-6 gap-6 w-full relative z-10">
                  <div class="w-20 h-20 bg-gray-900 rounded-xl border border-cyan-500/30 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]">
                    <svg class="w-10 h-10 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-lg font-black text-white tracking-widest uppercase mb-3">System Crates</h3>
                    <div class="h-2.5 bg-gray-900 rounded-full overflow-hidden border border-gray-700 relative">
                      <div class="absolute top-0 left-0 h-full bg-cyan-400 w-[90%] shadow-[0_0_10px_#22d3ee]"></div>
                    </div>
                    <div class="mt-2 flex justify-end">
                      <span class="text-[10px] font-mono text-cyan-400 font-bold tracking-widest">90/100</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Action (Game Rooms UX -> Match Hub) */}
              <div class="flex-1 glass-card rounded-2xl flex items-center justify-between p-6 cursor-pointer group relative overflow-hidden hover:border-indigo-500/50">
                <div class="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>
                <div class="relative z-10">
                  <h3 class="text-lg font-black text-white tracking-widest uppercase">Match Hub</h3>
                  <p class="text-indigo-300 text-xs mt-1 font-medium tracking-wide">Network with peers</p>
                </div>
                <div class="flex -space-x-3 relative z-10 group-hover:scale-105 transition-transform">
                  <div class="w-12 h-12 rounded-full border-2 border-gray-800 bg-gray-900 z-30 flex items-center justify-center overflow-hidden">
                    <svg class="w-7 h-7 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>
                  </div>
                  <div class="w-12 h-12 rounded-full border-2 border-gray-800 bg-gray-900 z-20 flex items-center justify-center overflow-hidden">
                    <svg class="w-7 h-7 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>
                  </div>
                  <div class="w-12 h-12 rounded-full border-2 border-gray-800 bg-gray-900 z-10 flex items-center justify-center overflow-hidden">
                    <svg class="w-7 h-7 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>
                  </div>
                  <div class="w-10 h-10 rounded-full bg-indigo-600 border-2 border-indigo-400 z-40 flex items-center justify-center text-white shadow-[0_0_15px_rgba(79,70,229,0.6)] absolute -top-1 -right-2">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>
                  </div>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </>
  );
}
