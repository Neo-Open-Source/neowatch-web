import type { EntryStatus } from "../entry-status";

export type { EntryStatus } from "../entry-status";

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  banner: string;
  role: string;
  createdAt: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface LoginTicket {
  url: string;
}

export type FavoriteType = "media" | "character" | "staff";

export interface FavoriteInput {
  title: string;
  image?: string;
  subtitle?: string;
}

export interface FavoriteView {
  type: FavoriteType;
  id: string;
  title: string;
  image?: string;
  subtitle?: string;
  createdAt: string;
}

export interface EntryInput {
  status: EntryStatus;
  kind?: string | undefined;
  title?: string | undefined;
  poster?: string | undefined;
}

export interface EntryView {
  key: string;
  kind: string;
  status: EntryStatus;
  title: string;
  poster: string;
}
