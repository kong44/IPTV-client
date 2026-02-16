
import React, { useState, useEffect, useMemo } from 'react';
import { Channel, AppView } from './types';
import { parseM3U } from './services/m3uParser';
import { getChannelRecommendation } from './services/geminiService';
import VideoPlayer from './components/VideoPlayer';
import ChannelCard from './components/ChannelCard';

const STORAGE_KEY = 'lumina_playlist';
const FAVORITES_KEY = 'lumina_favorites';
const LAST_URL_KEY = 'lumina_last_url';

const IPTV_ORG_PRESETS = [
  { name: 'All Channels (Global)', url: 'https://iptv-org.github.io/iptv/index.m3u', icon: '🌍' },
  { name: 'English Language', url: 'https://iptv-org.github.io/iptv/languages/eng.m3u', icon: '🇺🇸' },
  { name: 'Movies', url: 'https://iptv-org.github.io/iptv/categories/movies.m3u', icon: '🎬' },
  { name: 'News', url: 'https://iptv-org.github.io/iptv/categories/news.m3u', icon: '📰' },
  { name: 'Sports', url: 'https://iptv-org.github.io/iptv/categories/sports.m3u', icon: '⚽' },
  { name: 'Music', url: 'https://iptv-org.github.io/iptv/categories/music.m3u', icon: '🎵' },
  { name: 'Kids', url: 'https://iptv-org.github.io/iptv/categories/kids.m3u', icon: '🧸' },
];

const App: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [recommendation, setRecommendation] = useState<{ suggestedCategory: string, reason: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);

  // Load state from local storage
  useEffect(() => {
    const savedChannels = localStorage.getItem(STORAGE_KEY);
    const savedFavorites = localStorage.getItem(FAVORITES_KEY);

    if (savedChannels) setChannels(JSON.parse(savedChannels));
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
  }, []);

  // Update favorites storage
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  // AI Recommendation Trigger
  useEffect(() => {
    const fetchRec = async () => {
      if (favorites.length > 0 && channels.length > 0 && !recommendation) {
        const favChannels = channels.filter(c => favorites.includes(c.id));
        const rec = await getChannelRecommendation(favChannels, channels);
        setRecommendation(rec);
      }
    };
    fetchRec();
  }, [favorites, channels, recommendation]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseM3U(content);
      setChannels(parsed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const fetchPlaylistFromUrl = async (url: string) => {
    if (!url) return;
    setIsLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch playlist');
      const content = await response.text();
      const parsed = parseM3U(content);
      setChannels(parsed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      localStorage.setItem(LAST_URL_KEY, url);
    } catch (error) {
      console.error("Error fetching playlist:", error);
      alert("Failed to load playlist. Make sure the URL is valid and CORS is allowed.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = (e: React.MouseEvent, channel: Channel) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(channel.id) 
        ? prev.filter(id => id !== channel.id) 
        : [...prev, channel.id]
    );
  };

  const groups = useMemo(() => {
    const g = Array.from(new Set(channels.map(c => c.group)));
    return ['All', 'Favorites', ...g.sort()];
  }, [channels]);

  const filteredChannels = useMemo(() => {
    let result = channels;
    
    if (selectedGroup === 'Favorites') {
      result = channels.filter(c => favorites.includes(c.id));
    } else if (selectedGroup !== 'All') {
      result = channels.filter(c => c.group === selectedGroup);
    }

    if (searchQuery) {
      result = result.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.group.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return result;
  }, [channels, selectedGroup, searchQuery, favorites]);

  const goBackToAll = () => {
    setSelectedGroup('All');
    setSearchQuery('');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      {/* Sidebar - Desktop Only */}
      <aside className="w-72 bg-slate-900/50 border-r border-slate-800 flex flex-col flex-shrink-0 hidden lg:flex">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Lumina IPTV</h1>
          </div>

          <div className="space-y-6">
            <div>
              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Library</p>
              <nav className="space-y-1">
                {['All', 'Favorites'].map(group => (
                  <button
                    key={group}
                    onClick={() => setSelectedGroup(group)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      selectedGroup === group 
                        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </nav>
            </div>

            <div>
              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Categories</p>
              <nav className="space-y-1 overflow-y-auto max-h-[40vh] custom-scrollbar">
                {groups.filter(g => g !== 'All' && g !== 'Favorites').map(group => (
                  <button
                    key={group}
                    onClick={() => setSelectedGroup(group)}
                    className={`w-full text-left px-4 py-2 rounded-xl text-xs font-medium transition-all truncate ${
                      selectedGroup === group 
                        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
        
        <div className="mt-auto p-4 border-t border-slate-800 space-y-2">
           <button 
             onClick={() => { if(confirm('Clear all channels?')) setChannels([]); }}
             className="w-full px-4 py-2 text-xs text-slate-500 hover:text-red-400 transition-colors text-center"
           >
             Clear All Channels
           </button>
           <label className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer transition-colors text-sm font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload M3U
              <input type="file" className="hidden" accept=".m3u" onChange={handleFileUpload} />
           </label>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-slate-800/50 flex items-center justify-between px-4 sm:px-8 bg-slate-950/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4 flex-1">
            {/* Back Button */}
            {(selectedGroup !== 'All' || searchQuery) && (
              <button 
                onClick={goBackToAll}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all group flex items-center gap-2"
                title="Back to All"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-bold hidden sm:inline">Back</span>
              </button>
            )}

            <div className="flex-1 max-w-xl relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text"
                placeholder="Search channels..."
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6 ml-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-semibold text-white">{channels.length} Channels</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest truncate max-w-[100px]">{selectedGroup}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
               </svg>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar pb-32 lg:pb-8">
          {channels.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-4xl mx-auto space-y-12 py-10">
              <div className="text-center space-y-4">
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Setup Your Playlist</h2>
                <p className="text-slate-400 text-base sm:text-lg">Choose an IPTV-org preset or enter your own custom URL.</p>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {IPTV_ORG_PRESETS.map((preset) => (
                  <button
                    key={preset.url}
                    onClick={() => fetchPlaylistFromUrl(preset.url)}
                    className="p-6 bg-slate-900 border border-slate-800 rounded-3xl hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all text-left group shadow-xl hover:shadow-indigo-500/10"
                  >
                    <span className="text-3xl mb-4 block group-hover:scale-110 transition-transform">{preset.icon}</span>
                    <h3 className="font-bold text-white mb-1 truncate">{preset.name}</h3>
                    <p className="text-xs text-slate-500">Official iptv-org list</p>
                  </button>
                ))}
              </div>

              <div className="w-full flex flex-col sm:flex-row gap-4 items-center">
                <input 
                  type="text"
                  placeholder="Enter custom M3U URL..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
                <button 
                  onClick={() => fetchPlaylistFromUrl(customUrl)}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/20 whitespace-nowrap w-full sm:w-auto"
                >
                  Load URL
                </button>
              </div>

              <div className="flex items-center gap-4 w-full">
                <div className="h-px bg-slate-800 flex-1"></div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">or upload local file</span>
                <div className="h-px bg-slate-800 flex-1"></div>
              </div>

              <label className="flex items-center gap-3 px-8 py-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-2xl cursor-pointer transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Browse Local .m3u File
                <input type="file" className="hidden" accept=".m3u" onChange={handleFileUpload} />
              </label>
            </div>
          ) : (
            <div className="space-y-10">
              {/* AI Discovery Banner */}
              {recommendation && selectedGroup === 'All' && !searchQuery && (
                <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-[2.5rem] p-6 sm:p-10 flex flex-col md:flex-row items-center gap-8 sm:gap-10 shadow-2xl shadow-indigo-950/50 border border-indigo-400/20">
                  <div className="relative z-10 flex-1 space-y-5 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase text-indigo-100 border border-white/10 mx-auto md:mx-0">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-300"></span>
                      </span>
                      AI Analysis
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-black text-white leading-none">Your Next Favorite Channel</h3>
                    <p className="text-indigo-100/70 text-base sm:text-lg max-w-xl leading-relaxed">
                      Based on your preferences, you might enjoy <span className="text-white font-bold decoration-indigo-300/50 underline underline-offset-8 decoration-2 cursor-pointer" onClick={() => setSelectedGroup(recommendation.suggestedCategory)}>{recommendation.suggestedCategory}</span>. {recommendation.reason}
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2 justify-center md:justify-start">
                      <button 
                        onClick={() => setSelectedGroup(recommendation.suggestedCategory)}
                        className="px-8 py-4 bg-white text-indigo-600 font-black rounded-2xl hover:bg-indigo-50 transition-all shadow-xl hover:-translate-y-1 active:scale-95"
                      >
                        Explore Now
                      </button>
                      <button 
                         onClick={() => setRecommendation(null)}
                         className="px-8 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all border border-white/10 active:scale-95"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                  <div className="relative z-10 w-48 h-48 sm:w-56 sm:h-56 md:w-72 md:h-72 hidden sm:flex items-center justify-center shrink-0">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                    <img 
                      src={`https://picsum.photos/seed/${recommendation.suggestedCategory}/600/600`} 
                      className="w-full h-full object-cover rounded-[2rem] shadow-2xl rotate-6 group-hover:rotate-0 transition-all duration-700 border-4 border-white/10" 
                      alt="Discovery" 
                    />
                  </div>
                </div>
              )}

              {/* Grid Section */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                   <div className="space-y-1">
                     <h2 className="text-2xl font-black text-white flex items-center gap-3">
                       {selectedGroup} 
                       <span className="text-sm font-bold text-slate-500 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">{filteredChannels.length}</span>
                     </h2>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Channel Catalog</p>
                   </div>
                   
                   <div className="flex items-center gap-2">
                      <button className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                        </svg>
                      </button>
                   </div>
                </div>
                
                {filteredChannels.length === 0 ? (
                  <div className="py-24 sm:py-32 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-[2rem] px-6">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 font-bold">No channels found in this category.</p>
                    <button onClick={goBackToAll} className="mt-4 text-indigo-400 text-sm font-bold hover:underline">Show all channels</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-6">
                    {filteredChannels.map(channel => (
                      <ChannelCard 
                        key={channel.id} 
                        channel={channel} 
                        onClick={(c) => {
                          setActiveChannel(c);
                          setCurrentView(AppView.PLAYER);
                        }}
                        isFavorite={favorites.includes(channel.id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 flex items-center justify-around px-4 z-40">
        <button 
          onClick={goBackToAll}
          className={`flex flex-col items-center gap-1.5 transition-colors ${selectedGroup === 'All' ? 'text-indigo-400' : 'text-slate-500'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
        </button>
        <button 
          onClick={() => setSelectedGroup('Favorites')}
          className={`flex flex-col items-center gap-1.5 transition-colors ${selectedGroup === 'Favorites' ? 'text-indigo-400' : 'text-slate-500'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest">Saved</span>
        </button>
        <button 
          onClick={() => setIsCategoryDrawerOpen(true)}
          className={`flex flex-col items-center gap-1.5 transition-colors ${selectedGroup !== 'All' && selectedGroup !== 'Favorites' ? 'text-indigo-400' : 'text-slate-500'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest">Menu</span>
        </button>
        <button 
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.m3u';
            input.onchange = (e) => handleFileUpload(e as any);
            input.click();
          }}
          className="flex flex-col items-center gap-1.5 text-slate-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest">Import</span>
        </button>
      </nav>

      {/* Mobile Category Drawer */}
      {isCategoryDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCategoryDrawerOpen(false)}></div>
          <div className="relative w-full max-h-[80vh] bg-slate-900 rounded-t-[2.5rem] p-8 flex flex-col animate-slide-up border-t border-slate-800">
            <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-6"></div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">Categories</h2>
              <button onClick={() => setIsCategoryDrawerOpen(false)} className="p-2 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar space-y-2 pb-10">
               {groups.map(group => (
                  <button
                    key={group}
                    onClick={() => {
                      setSelectedGroup(group);
                      setIsCategoryDrawerOpen(false);
                    }}
                    className={`w-full text-left px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
                      selectedGroup === group 
                        ? 'bg-indigo-600 text-white' 
                        : 'text-slate-400 bg-slate-800/50 hover:bg-slate-800'
                    }`}
                  >
                    {group}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Video Player Overlay */}
      {activeChannel && currentView === AppView.PLAYER && (
        <VideoPlayer 
          url={activeChannel.url} 
          title={activeChannel.name}
          onClose={() => {
            setCurrentView(AppView.DASHBOARD);
            setActiveChannel(null);
          }} 
        />
      )}

      {/* Loading State Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-indigo-500/20 rounded-full"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="text-white font-black tracking-widest uppercase text-xs mb-1">Retrieving Catalog</p>
              <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">This may take a few seconds</p>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}} />
    </div>
  );
};

export default App;
