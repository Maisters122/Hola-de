export interface MultiplayerPlayer {
  id: string;
  name: string;
  isReady: boolean;
  carName?: string;
  crewName?: string;
  [key: string]: any;
}

export interface MultiplayerRoomState {
  code: string;
  roomCode?: string;
  hostName?: string;
  guestName?: string;
  isHostReady?: boolean;
  isGuestReady?: boolean;
  raceStarted?: boolean;
  laps?: number;
  players: any;
}
