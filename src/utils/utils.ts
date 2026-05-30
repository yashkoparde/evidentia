import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  FileText, 
  Video, 
  Music, 
  Archive, 
  File, 
  Image as ImageIcon,
  FileCode,
  FileSearch,
  Type
} from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFileIcon(fileType: string, fileName?: string) {
  const type = fileType.toLowerCase();
  const name = fileName?.toLowerCase() || '';

  if (type.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.avi')) return Video;
  if (type.startsWith('audio/') || name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.ogg')) return Music;
  if (type.startsWith('image/') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.gif') || name.endsWith('.webp')) return ImageIcon;
  
  if (type.includes('pdf') || name.endsWith('.pdf')) return FileText;
  if (type.includes('zip') || type.includes('tar') || type.includes('rar') || name.endsWith('.zip') || name.endsWith('.rar')) return Archive;
  
  if (type.includes('json') || type.includes('javascript') || type.includes('typescript') || name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.json')) return FileCode;
  if (type.includes('text/') || name.endsWith('.txt') || name.endsWith('.md')) return Type;
  
  return File;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export async function generateHash(content: string | ArrayBuffer): Promise<string> {
  const encoder = new TextEncoder();
  const data = typeof content === 'string' ? encoder.encode(content) : content;
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
