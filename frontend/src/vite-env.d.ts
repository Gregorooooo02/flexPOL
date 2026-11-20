/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API base URL. Defaults to "/api", which the dev server proxies to the backend. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
