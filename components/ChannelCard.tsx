
import React from 'react';
import { Channel } from '../types';

interface ChannelCardProps {
  channel: Channel;
  onClick: (channel: Channel) => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, channel: Channel) => void;
}

const ChannelCard: React.FC<ChannelCardProps> = ({ channel, onClick, isFavorite, onToggleFavorite }) => {
  return (
    <div 
      onClick={() => onClick(channel)}
      className="group relative bg-slate-800/40 rounded-xl overflow-hidden border border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all duration-300 cursor-pointer flex flex-col aspect-video sm:aspect-square"
    >
      <div className="relative flex-1 p-4 flex items-center justify-center overflow-hidden">
        {channel.logo ? (
          <img 
            src={channel.logo} 
            alt={channel.name} 
            className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
               (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/' + channel.id + '/200/200';
            }}
          />
        ) : (
          <div className="text-4xl font-bold text-slate-600 opacity-50 select-none">
            {channel.name.charAt(0)}
          </div>
        )}
        
        <button
          onClick={(e) => onToggleFavorite(e, channel)}
          className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all duration-300 ${
            isFavorite ? 'bg-indigo-500 text-white shadow-lg' : 'bg-black/20 text-slate-300 hover:bg-black/40'
          }`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            viewBox="0 0 20 20" 
            fill={isFavorite ? 'currentColor' : 'none'} 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" 
            />
          </svg>
        </button>
      </div>

      <div className="p-3 bg-gradient-to-t from-black/60 to-transparent">
        <h3 className="text-sm font-semibold truncate group-hover:text-indigo-400 transition-colors">
          {channel.name}
        </h3>
        <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate mt-0.5">
          {channel.group}
        </p>
      </div>
    </div>
  );
};

export default ChannelCard;
