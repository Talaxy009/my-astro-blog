import { atom } from 'nanostores';

export const pageIndex = atom(1);

export const menuIndex = atom(0);

export const theme = atom<'light' | 'dark'>('light');
