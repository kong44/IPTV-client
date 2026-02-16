
import { Channel } from '../types';

export const parseM3U = (content: string): Channel[] => {
  const lines = content.split('\n');
  const channels: Channel[] = [];
  let currentChannel: Partial<Channel> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,(.*)$/);
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupMatch = line.match(/group-title="([^"]*)"/);
      const idMatch = line.match(/tvg-id="([^"]*)"/);

      currentChannel.name = nameMatch ? nameMatch[1].trim() : 'Unknown Channel';
      currentChannel.logo = logoMatch ? logoMatch[1] : '';
      currentChannel.group = groupMatch ? groupMatch[1] : 'Uncategorized';
      currentChannel.id = idMatch ? idMatch[1] : `ch-${Math.random().toString(36).substr(2, 9)}`;
    } else if (line.startsWith('http')) {
      currentChannel.url = line;
      if (currentChannel.name && currentChannel.url) {
        channels.push(currentChannel as Channel);
      }
      currentChannel = {};
    }
  }

  return channels;
};
