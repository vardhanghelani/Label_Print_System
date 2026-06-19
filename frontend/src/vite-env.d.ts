/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_PRINT_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
