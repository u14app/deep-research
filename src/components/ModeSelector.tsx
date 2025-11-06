'use client';

import { useModeStore } from '@/store/mode';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

export function ModeSelector() {
  const { t } = useTranslation();
  const { mode, setMode } = useModeStore();

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">
        {t('setting.researchMode', 'Research Mode')}:
      </label>
      <Select value={mode} onValueChange={(value: any) => setMode(value)}>
        <SelectTrigger className="w-[220px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="general">
            🔍 {t('mode.general', 'General Mode')}
          </SelectItem>
          <SelectItem value="professional">
            🧬 {t('mode.professional', 'Professional (Gene Research)')}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
