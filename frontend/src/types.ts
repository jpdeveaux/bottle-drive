export enum AddressState {
  unvisited = 'unvisited',
  completed = 'completed'
};

export enum Role {
  admin = 'admin', 
  volunteer = 'volunteer'
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastSeen: string;
  lastLat: number;
  lastLng: number;
  isApproved: boolean;
  zones: Zone[];
};

export interface Zone {
  id: string;
  name: string;
  north: number;
  south: number;
  east: number;
  west: number;
  users: User[];
}

export interface Address {
  id: string;
  street: string;
  state: AddressState;
  notes: string;
  lat: number;
  lng: number;
  zone?: Zone;
}
