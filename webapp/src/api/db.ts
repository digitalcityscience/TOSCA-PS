import { useGlobalStore } from '@/stores/global';

export const db = {
  baseUrl() {
    return useGlobalStore().apiUrl;
  },

  getMasterplans: async () => {
    const response = await fetch(`${db.baseUrl()}masterplans`);
    return response;
  },

  postMasterplan: async (body: Masterplan) => {
    const response = await fetch(`${db.baseUrl()}masterplans`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: new Headers({ 'Content-Type': 'application/json' })
    })
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message);
    }
  },

  getPublicReviews: async () => {
    const response = await fetch(`${db.baseUrl()}publicreviews`);
    return response;
  },

  postPublicReview: async (body: PublicReview) => {
    const response = await fetch(`${db.baseUrl()}publicreviews`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: new Headers({ 'Content-Type': 'application/json' })
    })
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message);
    }
  }
}
