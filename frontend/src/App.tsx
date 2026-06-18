import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import PrintLabelsPage from './pages/PrintLabelsPage';
import LabelsPage from './pages/LabelsPage';
import TemplatesPage from './pages/TemplatesPage';
import TemplateDesignerPage from './pages/TemplateDesignerPage';
import LayoutsPage from './pages/LayoutsPage';
import LayoutDesignerPage from './pages/LayoutDesignerPage';
import SettingsPage from './pages/SettingsPage';
import MeasureStickerSheetPage from './pages/MeasureStickerSheetPage';
import ShopSetupPage from './pages/admin/ShopSetupPage';
import CategoriesPage from './pages/CategoriesPage';
import CategoryEditPage from './pages/CategoryEditPage';

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

            <Route path="/admin/categories" element={<CategoriesPage />} />
            <Route path="/admin/categories/new" element={<CategoryEditPage />} />
            <Route path="/admin/categories/:id" element={<CategoryEditPage />} />
            <Route path="/admin/formats" element={<TemplatesPage />} />
            <Route path="/admin/formats/new" element={<TemplateDesignerPage />} />
            <Route path="/admin/formats/:id/edit" element={<TemplateDesignerPage />} />
            <Route path="/admin/formats/:id/measure" element={<MeasureStickerSheetPage />} />
            <Route path="/admin/formats/new/measure" element={<MeasureStickerSheetPage />} />
            <Route path="/admin/designs" element={<LayoutsPage />} />
            <Route path="/admin/designs/new" element={<LayoutDesignerPage />} />
            <Route path="/admin/designs/:id/edit" element={<LayoutDesignerPage />} />
            <Route path="/admin/adjustment" element={<SettingsPage />} />
            <Route path="/admin/shop" element={<ShopSetupPage />} />

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
