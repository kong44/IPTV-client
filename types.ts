
export interface Channel {
  id: string;
  name: string;
  logo: string;
  group: string;
  url: string;
  favorite?: boolean;
}

export interface Playlist {
  name: string;
  channels: Channel[];
  updatedAt: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  PLAYER = 'PLAYER',
  SETTINGS = 'SETTINGS',
}
