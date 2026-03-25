import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-600';
    case 'SUBMITTED':
      return 'bg-gold-50 text-gold-dark';
    case 'REVIEWED':
      return 'bg-teal-50 text-teal';
    case 'VALIDATED':
      return 'bg-emerald-50 text-emerald-700';
    case 'ARCHIVED':
      return 'bg-navy/10 text-navy';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'Brouillon';
    case 'SUBMITTED':
      return 'Soumis';
    case 'REVIEWED':
      return 'En revue';
    case 'VALIDATED':
      return 'Validé';
    case 'ARCHIVED':
      return 'Archivé';
    default:
      return status;
  }
}
