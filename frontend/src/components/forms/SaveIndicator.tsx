import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error';

interface SaveIndicatorProps {
  status: SaveStatus;
  className?: string;
}

export function SaveIndicator({ status, className }: SaveIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === 'saved') {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
    if (status === 'saving' || status === 'error') {
      setVisible(true);
    }
  }, [status]);

  if (!visible) return null;

  return (
    <div className={cn('transition-all duration-300', className)}>
      {status === 'saved' && (
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30">
          <CheckCircle className="w-4 h-4 text-success" />
          <span className="text-sm font-medium text-success">Sauvegarde réussie</span>
        </div>
      )}
      {status === 'saving' && (
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal/20">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-teal" />
          <span className="text-xs text-teal">Sauvegarde...</span>
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200">
          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
          <span className="text-xs text-red-600">Erreur de sauvegarde</span>
        </div>
      )}
    </div>
  );
}
