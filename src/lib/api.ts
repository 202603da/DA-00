import { Asset } from '../types';

export const api = {
  async getAssets(page: number = 1, search: string = '', type: string = ''): Promise<Asset[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20',
      search,
      type
    });
    const response = await fetch(`/api/assets?${params}`);
    return response.json();
  },

  async getAsset(id: number): Promise<Asset> {
    const response = await fetch(`/api/assets/${id}`);
    return response.json();
  },

  async getRelatedAssets(id: number): Promise<Asset[]> {
    const response = await fetch(`/api/assets/${id}/related`);
    return response.json();
  },
  
  async incrementView(id: number): Promise<Asset> {
    const response = await fetch(`/api/assets/${id}/view`, { method: 'POST' });
    return response.json();
  },

  async incrementLike(id: number): Promise<Asset> {
    const response = await fetch(`/api/assets/${id}/like`, { method: 'POST' });
    return response.json();
  },

  async importFolder(path: string): Promise<{ message: string }> {
    const response = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });
    return response.json();
  }
};
