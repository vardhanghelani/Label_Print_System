import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout, AdminRoute } from './components/Layout';
import PrintLabelsPage from './pages/PrintLabelsPage';
import LabelsPage from './pages/LabelsPage';
import TemplatesPage from './pages/TemplatesPage';
import TemplateDesignerPage from './pages/TemplateDesignerPage';
import LayoutsPage from './pages/LayoutsPage';
import LayoutDesignerPage from './pages/LayoutDesignerPage';
import SettingsPage from './pages/SettingsPage';
import MeasureStickerSheetPage from './pages/MeasureStickerSheetPage';
import ShopSetupPage from './pages/admin/ShopSetupPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<PrintLabelsPage />} />
            <Route path="/labels" element={<LabelsPage />} />

            <Route path="/admin/formats" element={<AdminRoute><TemplatesPage /></AdminRoute>} />
            <Route path="/admin/formats/new" element={<AdminRoute><TemplateDesignerPage /></AdminRoute>} />
            <Route path="/admin/formats/:id/edit" element={<AdminRoute><TemplateDesignerPage /></AdminRoute>} />
            <Route path="/admin/formats/:id/measure" element={<AdminRoute><MeasureStickerSheetPage /></AdminRoute>} />
            <Route path="/admin/formats/new/measure" element={<AdminRoute><MeasureStickerSheetPage /></AdminRoute>} />
            <Route path="/admin/designs" element={<AdminRoute><LayoutsPage /></AdminRoute>} />
            <Route path="/admin/designs/new" element={<AdminRoute><LayoutDesignerPage /></AdminRoute>} />
            <Route path="/admin/designs/:id/edit" element={<AdminRoute><LayoutDesignerPage /></AdminRoute>} />
            <Route path="/admin/adjustment" element={<AdminRoute><SettingsPage /></AdminRoute>} />
            <Route path="/admin/shop" element={<AdminRoute><ShopSetupPage /></AdminRoute>} />

            <Route path="/history" element={<Navigate to="/" replace />} />
            <Route path="/print" element={<Navigate to="/" replace />} />
            <Route path="/preview" element={<Navigate to="/" replace />} />
            <Route path="/templates" element={<Navigate to="/admin/formats" replace />} />
            <Route path="/layouts" element={<Navigate to="/admin/designs" replace />} />
            <Route path="/settings" element={<Navigate to="/admin/adjustment" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
