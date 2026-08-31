export type TabType = 'explorer' | 'gif' | 'diy' | 'santa' | 'poster';

export interface MonkeAttributes {
  [key: string]: string | number | undefined;
  Body: string;
  Eyes: string;
  Earring: string;
  Head: string;
  Count: number;
  BodyCount?: number;
  EyesCount?: number;
  EarringCount?: number;
  HeadCount?: number;
}

export interface Monke {
  id: number;
  attributes: MonkeAttributes;
  rank?: number;
  inscription: number;
  block: number;
  scriptPubkey: string;
}

export interface ColorInfo {
  r: number;
  g: number;
  b: number;
  count: number;
}

export type SortField = 'rank' | 'id' | 'inscription' | 'block';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'grid' | 'table';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}
