import { format } from 'date-fns';

/**
 * Local calendar date as `yyyy-MM-dd`. Prefer this over `toISOString().slice(0, 10)`,
 * which uses UTC and can be yesterday in IST (UTC+5:30) before ~05:30.
 */
export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * True when the stored calendar day (`yyyy-MM-dd` or ISO timestamp prefix) is
 * before today's local calendar day.
 */
export function isCalendarDateExpired(
  dateValue: string | Date | null | undefined
): boolean {
  if (!dateValue) return false;
  const datePart =
    typeof dateValue === 'string'
      ? dateValue.slice(0, 10)
      : toLocalDateString(dateValue);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return false;
  return toLocalDateString() > datePart;
}

export const ddmmyy = (date: string | Date | null): string => {
  if (!date) {
    return 'N/A';
  }

  if (typeof date === 'string') {
    try {
      return format(new Date(date), 'dd-MM-yyyy');
    } catch {
      return 'Invalid Date';
    }
  } else {
    try {
      return format(date, 'dd-MM-yyyy');
    } catch {
      return 'Invalid Date';
    }
  }
};

export function timeAgo(date: string) {
  const now = new Date();
  const past = new Date(date);
  const diff = now.getTime() - past.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} days ago`;
  if (hours > 0) return `${hours} hours ago`;
  if (minutes > 0) return `${minutes} minutes ago`;
  return 'just now';
}

/**
 * Returns a Tailwind color class for a given due date string, matching the logic from DueDateCell.
 * @param date Due date as ISO string or Date
 */
export function getDueDateSignalColor(date: string): string {
  const due_date = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  due_date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const daysDifference = Math.floor((due_date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (isNaN(daysDifference)) return 'bg-slate-200';
  if (daysDifference > 7) return 'bg-emerald-400';
  if (daysDifference > 0) return 'bg-amber-400';
  if (daysDifference === 0) return 'bg-blue-500';
  if (daysDifference < 0) return 'bg-rose-400';
  return 'bg-slate-200';
}

/**
 * Maps a bg color class (e.g., bg-rose-400) to the corresponding text color class (e.g., text-rose-400)
 */
export function bgToTextColorClass(bgClass: string): string {
  if (!bgClass) return '';
  return bgClass.replace('bg-', 'text-');
}


export const formatDateWithTime = (dateString: string): string => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const hourStr = String(hours).padStart(2, '0');
  return `${day}-${month}-${year} ${hourStr}:${minutes} ${ampm}`;
};


export const getDueDate = (discount_date_str: string | null, due_date_str: string) => {
  if (discount_date_str) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (discount_date_str >= todayStr) {
      return discount_date_str;
    }
  }
  return due_date_str ? due_date_str : null;
}