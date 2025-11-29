// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import VideoUploadPanel from './components/VideoUploadPanel';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <VideoUploadPanel />
  </React.StrictMode>
);
