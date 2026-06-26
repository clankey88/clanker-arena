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
            
            /* Slanted Card Shapes matching the reference */
            .mode-card-featured { 
              clip-path: polygon(0 0, 100% 0, 93% 100%, 0% 100%); 
              background: linear-gradient(145deg, rgba(153, 27, 27, 0.3), rgba(69, 10, 10, 0.6)); 
              border-left: 2px solid rgba(239, 68, 68, 0.4);
            }
            .mode-card-secondary-1 { 
              clip-path: polygon(7% 0, 100% 0, 93% 100%, 0% 100%); 
              background: linear-gradient(145deg, rgba(107, 33, 168, 0.3), rgba(49, 10, 80, 0.5)); 
            }
            .mode-card-secondary-2 { 
              clip-path: polygon(7% 0, 100% 0, 93% 100%, 0% 100%); 
              background: linear-gradient(145deg, rgba(21, 128, 61, 0.3), rgba(6, 60, 20, 0.5)); 
            }
            .mode-card-secondary-3 { 
              clip-path: polygon(7% 0, 100% 0, 100% 100%, 0% 100%); 
              background: linear-gradient(145deg, rgba(30, 58, 138, 0.3), rgba(15, 23, 42, 0.5)); 
            }
            
            .mode-hover-effect:hover { filter: brightness(1.2); z-index: 20; transform: scale(1.02); }
            
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
        <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

        {/* Top Header */}
        <header class="h-[10%] min-h-[4rem] max-h-[5rem] glass z-30 flex items-center justify-between px-6 relative">
          <div class="flex items-center gap-6">
            <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-[2px] cursor-pointer hover:scale-105 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <div class="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                <span class="text-sm font-black text-cyan-400">42</span>
              </div>
            </div>
            
            <div class="flex items-center gap-2 currency-pill px-6 py-2 cursor-pointer hover:bg-white/10 transition-colors">
              <svg class="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg>
              <span class="text-yellow-500 font-black tracking-widest text-lg">200,000</span>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 currency-pill px-4 py-2 cursor-pointer hover:bg-white/10 transition-colors">
              <div class="w-4 h-4 rounded-sm rotate-45 bg-pink-500 shadow-[0_0_10px_#ec4899]"></div>
              <span class="font-mono text-pink-400 font-bold text-base">999</span>
            </div>
            <div class="flex items-center gap-2 currency-pill px-4 py-2 cursor-pointer hover:bg-white/10 transition-colors">
              <div class="w-5 h-5 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
              <span class="font-mono text-green-400 font-bold text-base">999</span>
            </div>
            <button class="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </button>
          </div>
        </header>

        <div class="flex flex-1 overflow-hidden relative z-10 h-[90%]">
          {/* Left Sidebar */}
          <aside class="w-[6%] min-w-[5rem] bg-gray-900/50 backdrop-blur-md flex flex-col items-center py-8 gap-8 border-r border-white/5 z-20">
            <button class="nav-item flex flex-col items-center gap-2 group">
              <svg class="w-8 h-8 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
              <span class="text-[11px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white">News</span>
            </button>
            <button class="nav-item flex flex-col items-center gap-2 group">
              <svg class="w-8 h-8 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              <span class="text-[11px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white">Guild</span>
            </button>
            <button class="nav-item active flex flex-col items-center gap-2 group relative">
              <div class="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full scale-150"></div>
              <svg class="w-10 h-10 text-cyan-400 relative drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              <span class="text-[11px] font-bold uppercase tracking-widest text-cyan-400 relative drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">Arena</span>
            </button>
            <button class="nav-item flex flex-col items-center gap-2 group mt-auto mb-4">
              <svg class="w-8 h-8 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              <span class="text-[11px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white">Store</span>
            </button>
          </aside>

          {/* Main Area: 65% top row, 35% bottom row */}
          <main class="flex-1 flex flex-col overflow-hidden bg-gray-900 z-10 w-[94%]">
            
            {/* TOP ROW: Slanted Cards */}
            <div class="h-[75%] w-full flex p-2 border-b-4 border-gray-950">
              
              {/* Featured: 40% width */}
              <div class="w-[42%] h-full mode-card-featured flex flex-col relative cursor-pointer mode-hover-effect">
                <div class="h-[15%] bg-red-950/80 border-b border-red-500/50 flex items-center justify-between px-8 z-10 w-full">
                  <span class="font-black text-white tracking-widest text-2xl drop-shadow-md">FRONTS MODE</span>
                </div>
                
                <div class="flex-1 flex items-center justify-center relative bg-[url('https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=1000&q=80')] bg-cover bg-center">
                  <div class="absolute inset-0 bg-red-900/60 backdrop-blur-[2px]"></div>
                  <div class="w-64 h-64 rounded-full border-[6px] border-yellow-500/80 bg-red-950/80 flex items-center justify-center relative shadow-[0_0_50px_rgba(234,179,8,0.4)] z-10">
                    <svg class="w-32 h-32 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg>
                    <div class="absolute -bottom-10 right-4 w-24 h-24 bg-gray-950 rounded-full border-4 border-gray-700 flex items-center justify-center shadow-lg">
                      <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                  </div>
                </div>

                <div class="h-[12%] bg-gradient-to-t from-red-950 to-red-900/40 flex items-center px-8 z-10 border-t border-red-500/30">
                  <span class="font-bold tracking-wide text-red-100 text-xl">Neon District</span>
                </div>
              </div>

              {/* Secondary 1: 20% width. -margin matches the slant exactly */}
              <div class="w-[22%] -ml-[2%] h-full mode-card-secondary-1 flex flex-col relative cursor-pointer mode-hover-effect">
                <div class="h-[15%] bg-purple-950/80 border-b border-purple-500/50 flex items-center justify-center px-4 pl-10 z-10">
                  <span class="font-black text-white tracking-widest text-lg text-center leading-tight">KING OF HILL</span>
                </div>
                <div class="absolute top-[18%] right-[10%] bg-black/80 px-3 py-1.5 rounded-sm text-xs font-mono text-cyan-400 border border-cyan-500/50 z-20 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  7h 15m
                </div>
                
                <div class="flex-1 flex items-center justify-center relative bg-[url('https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?w=800&q=80')] bg-cover bg-center">
                  <div class="absolute inset-0 bg-purple-900/60 backdrop-blur-[2px]"></div>
                  <div class="w-32 h-32 bg-gray-950/80 border-4 border-purple-500/50 rounded-xl transform rotate-12 flex items-center justify-center z-10 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                    <svg class="w-16 h-16 text-purple-400 transform -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                  </div>
                </div>

                <div class="h-[12%] bg-gray-900/95 flex items-center justify-between px-6 pl-10 z-10 border-t border-purple-500/30">
                  <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
                    <span class="text-base font-bold text-gray-200 font-mono">15/30</span>
                  </div>
                </div>
              </div>

              {/* Secondary 2 */}
              <div class="w-[22%] -ml-[2%] h-full mode-card-secondary-2 flex flex-col relative cursor-pointer mode-hover-effect">
                <div class="h-[15%] bg-green-950/80 border-b border-green-500/50 flex items-center justify-center px-4 pl-10 z-10">
                  <span class="font-black text-white tracking-widest text-lg text-center leading-tight">FREE FOR ALL</span>
                </div>
                <div class="absolute top-[18%] right-[10%] bg-black/80 px-3 py-1.5 rounded-sm text-xs font-mono text-cyan-400 border border-cyan-500/50 z-20 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  7h 15m
                </div>
                
                <div class="flex-1 flex items-center justify-center relative bg-[url('https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&q=80')] bg-cover bg-center">
                  <div class="absolute inset-0 bg-green-900/60 backdrop-blur-[2px]"></div>
                  <div class="w-32 h-32 bg-gray-950/80 border-4 border-green-500/50 rounded-xl transform -rotate-6 flex items-center justify-center z-10 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                    <svg class="w-16 h-16 text-green-400 transform rotate-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  </div>
                </div>

                <div class="h-[12%] bg-gray-900/95 flex items-center justify-between px-6 pl-10 z-10 border-t border-green-500/30">
                  <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
                    <span class="text-base font-bold text-gray-200 font-mono">15/30</span>
                  </div>
                </div>
              </div>

              {/* Secondary 3 (Last, flat right edge) */}
              <div class="w-[20%] -ml-[2%] h-full mode-card-secondary-3 flex flex-col relative cursor-pointer mode-hover-effect">
                <div class="h-[15%] bg-blue-950/80 border-b border-blue-500/50 flex items-center justify-center px-4 pl-10 z-10">
                  <span class="font-black text-white tracking-widest text-lg text-center leading-tight">TOURNAMENT</span>
                </div>
                <div class="absolute top-[18%] right-[10%] bg-black/80 px-3 py-1.5 rounded-sm text-xs font-mono text-cyan-400 border border-cyan-500/50 z-20 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  7h 15m
                </div>
                
                <div class="flex-1 flex items-center justify-center relative bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80')] bg-cover bg-center">
                  <div class="absolute inset-0 bg-blue-900/60 backdrop-blur-[2px]"></div>
                  <div class="w-32 h-32 bg-gray-950/80 border-4 border-blue-500/50 rounded-xl transform rotate-6 flex items-center justify-center z-10 shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                    <svg class="w-16 h-16 text-blue-400 transform -rotate-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" /></svg>
                  </div>
                </div>

                <div class="h-[12%] bg-gray-900/95 flex items-center justify-between px-6 pl-10 z-10 border-t border-blue-500/30">
                  <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
                    <span class="text-base font-bold text-gray-200 font-mono">15/30</span>
                  </div>
                </div>
              </div>

            </div>

            {/* BOTTOM ROW: Actions (40% / 60%) */}
            <div class="h-[25%] flex p-2 gap-2 bg-[#050505]">
              
              {/* Left Action: System Crates (40%) */}
              <div class="w-[40%] h-full bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border-2 border-cyan-500/40 hover:border-cyan-400 flex relative overflow-hidden cursor-pointer transition-colors shadow-[inset_0_0_50px_rgba(6,182,212,0.05)]">
                <div class="absolute inset-y-0 left-0 w-3 bg-cyan-500 shadow-[0_0_20px_#06b6d4]"></div>
                <div class="flex items-center p-8 gap-8 w-full h-full relative z-10">
                  <div class="w-28 h-28 bg-gray-950 rounded-2xl border-2 border-cyan-500/50 flex items-center justify-center transform -rotate-6 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                    <svg class="w-16 h-16 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                  </div>
                  <div class="flex-1 flex flex-col justify-center">
                    <h3 class="text-3xl font-black text-white tracking-widest uppercase mb-4">System Crates</h3>
                    <div class="h-4 bg-gray-900 rounded-full overflow-hidden border border-gray-700 relative">
                      <div class="absolute top-0 left-0 h-full bg-cyan-400 w-[90%] shadow-[0_0_15px_#22d3ee]"></div>
                    </div>
                    <div class="mt-2 flex justify-between items-center">
                      <svg class="w-6 h-6 text-cyan-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd" /></svg>
                      <span class="text-sm font-mono text-cyan-400 font-bold tracking-widest">90/100</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Action: Match Hub (60%) */}
              <div class="w-[60%] h-full bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border-2 border-indigo-500/40 hover:border-indigo-400 flex items-center justify-between p-8 cursor-pointer relative overflow-hidden transition-colors shadow-[inset_0_0_50px_rgba(79,70,229,0.05)]">
                <div class="relative z-10 flex flex-col justify-center">
                  <h3 class="text-3xl font-black text-white tracking-widest uppercase">Match Hub</h3>
                  <p class="text-indigo-300 text-lg mt-2 font-medium tracking-wide">Connect to network peers</p>
                </div>
                <div class="flex items-center gap-6 relative z-10">
                  <div class="flex -space-x-4">
                    <div class="w-20 h-20 rounded-full border-[3px] border-indigo-900 bg-gray-900 flex items-center justify-center overflow-hidden shadow-lg">
                      <svg class="w-12 h-12 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>
                    </div>
                    <div class="w-20 h-20 rounded-full border-[3px] border-indigo-900 bg-gray-900 flex items-center justify-center overflow-hidden shadow-lg z-10 transform scale-110">
                      <svg class="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>
                    </div>
                    <div class="w-20 h-20 rounded-full border-[3px] border-indigo-900 bg-gray-900 flex items-center justify-center overflow-hidden shadow-lg z-20">
                      <svg class="w-12 h-12 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>
                    </div>
                  </div>
                  <div class="w-16 h-16 rounded-full bg-indigo-600 border-[3px] border-indigo-400 z-30 flex items-center justify-center text-white shadow-[0_0_25px_rgba(79,70,229,0.8)] cursor-pointer hover:bg-indigo-500 hover:scale-110 transition-all">
                    <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" /></svg>
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
