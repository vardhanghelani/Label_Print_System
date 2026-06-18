import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { api } from '../../services/api';
import { PageHeader, LoadingSpinner } from '../../components/Layout';
import { JEWELLERY_SHEET_NAME } from '../../lib/jewellerySheet';

export default function ShopSetupPage() {
  const queryClient = useQueryClient();
  const [brandName, setBrandName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [defaultSheetBehavior, setDefaultSheetBehavior] = useState<'newSheet' | 'continueSheet'>('newSheet');
  const [saved, setSaved] = useState(false);

  const { data: shop, isLoading } = useQuery({
    queryKey: ['shop'],
    queryFn: api.settings.getShop,
  });

  useEffect(() => {
    if (shop) {
      setBrandName(shop.brandName);
      setLogoUrl(shop.logoUrl ?? '');
      setDefaultSheetBehavior(shop.defaultSheetBehavior ?? 'newSheet');
    }
  }, [shop]);

  const saveMutation = useMutation({
    mutationFn: api.settings.updateShop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Shop Setup"
        subtitle="Your shop name and print preferences"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate({
            brandName,
            logoUrl,
            defaultSheetBehavior,
            defaultTemplateId: shop?.defaultTemplateId,
            defaultLayoutId: shop?.defaultLayoutId,
          });
        }}
        className="card space-y-6"
      >
        <div className="rounded-xl bg-brand-50 px-5 py-4">
          <p className="font-semibold text-brand-800">Sticker Sheet (fixed)</p>
          <p className="mt-1 text-slate-700">{JEWELLERY_SHEET_NAME}</p>
          <p className="text-sm text-slate-600">137×172 mm · 14 interlocking jewellery stickers</p>
          <p className="mt-2 text-sm text-slate-500">
            After your first print, use <strong>Print Adjustment</strong> to fine-tune alignment.
          </p>
        </div>

        <div>
          <label className="label-text">Store Name</label>
          <input
            className="input-field"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="e.g. ABC Jewellers"
          />
          <p className="mt-2 text-base text-slate-500">Appears on every label automatically.</p>
        </div>

        <div>
          <label className="label-text">Shop Logo (optional)</label>
          <input
            className="input-field"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="Paste logo image link"
          />
        </div>

        <div>
          <label className="label-text">Default When Printing</label>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4">
              <input
                type="radio"
                name="sheetBehavior"
                checked={defaultSheetBehavior === 'newSheet'}
                onChange={() => setDefaultSheetBehavior('newSheet')}
                className="h-5 w-5"
              />
              <div>
                <p className="font-bold">New Sheet</p>
                <p className="text-sm text-slate-500">Start from sticker #1</p>
              </div>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4">
              <input
                type="radio"
                name="sheetBehavior"
                checked={defaultSheetBehavior === 'continueSheet'}
                onChange={() => setDefaultSheetBehavior('continueSheet')}
                className="h-5 w-5"
              />
              <div>
                <p className="font-bold">Continue Existing Sheet</p>
                <p className="text-sm text-slate-500">Pick up where you left off</p>
              </div>
            </label>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
          <Save className="h-5 w-5" />
          {saveMutation.isPending ? 'Saving...' : saved ? 'Saved!' : 'Save Shop Setup'}
        </button>
      </form>
    </div>
  );
}
