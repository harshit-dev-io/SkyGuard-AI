/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_CARTO_API_KEY?: string;
  readonly VITE_CARTO_STYLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}