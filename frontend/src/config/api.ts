export const API_BASE_URL: string = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  ''
).replace(/\/+$/, '');

export default API_BASE_URL;
