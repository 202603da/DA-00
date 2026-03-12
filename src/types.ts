export interface Asset {
  id: number;
  filename: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnail: string;
  keywords: string;
  prompt: string;
  format: string;
  resolution: string;
  tool: string;
  views: number;
  likes: number;
  created_at: string;
}
