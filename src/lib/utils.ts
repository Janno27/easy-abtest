import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Merges Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to localized string
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, 'd MMMM yyyy', { locale: fr });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

/**
 * Calculate conversion rate from visits and conversions
 * @param visits Number of visits
 * @param conversions Number of conversions
 * @returns Formatted conversion rate
 */
export function calculateConversionRate(visits: number, conversions: number): string {
  if (!visits) return '0,00%';
  
  const rate = (conversions / visits) * 100;
  return rate.toLocaleString('fr-FR', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }) + '%';
}

/**
 * Get status badge color based on test status
 * @param status Test status
 * @returns Tailwind color class
 */
export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    'active': 'bg-green-100 text-green-800 border-green-200',
    'paused': 'bg-amber-100 text-amber-800 border-amber-200',
    'draft': 'bg-gray-100 text-gray-800 border-gray-200',
    'scheduled': 'bg-blue-100 text-blue-800 border-blue-200',
    'completed': 'bg-purple-100 text-purple-800 border-purple-200',
    'archived': 'bg-red-100 text-red-800 border-red-200'
  };
  
  return statusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
}