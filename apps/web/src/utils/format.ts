export function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value: Date | string) {
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function greetingForNow(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 18) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function toDateTimeLocalValue(value = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatSeatStatus(status: string) {
  switch (status) {
    case 'pending_payment':
      return 'Waiting for tuition';
    case 'active':
      return 'Active';
    case 'completed':
      return 'Completed';
    case 'dropped':
      return 'Dropped';
    default:
      return status.replaceAll('_', ' ');
  }
}
export function optionalNumber(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return Number(trimmed);
}
