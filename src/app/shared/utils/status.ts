/**
 * Canonical status → badge-class map.
 * Exact copy of dashboard.getStatusClass table (the most complete one:
 * property, lead, visit and deal statuses). Pages keep their local copies;
 * new code should use getStatusBadgeClass + StatusBadgeComponent.
 */
export const STATUS_BADGE_MAP: Record<string, string> = {
  Available: 'badge-success',
  Reserved: 'badge-warning',
  Sold: 'badge-danger',
  Rented: 'badge-info',
  'New Lead': 'badge-primary',
  Contacted: 'badge-primary',
  Qualified: 'badge-success',
  Hot: 'badge-danger',
  Negotiation: 'badge-warning',
  Closed: 'badge-success',
  Scheduled: 'badge-primary',
  Completed: 'badge-success',
  Cancelled: 'badge-muted',
  'No Show': 'badge-danger',
  'Visit Scheduled': 'badge-info',
  'Contract Signed': 'badge-warning',
  // Lowercase workflow statuses used by finance pages (commissions,
  // expenses, invoices, payments) and marketing pages.
  pending: 'badge-warning',
  Pending: 'badge-warning',
  'Pending Signature': 'badge-warning',
  approved: 'badge-success',
  Approved: 'badge-success',
  paid: 'badge-success',
  Paid: 'badge-success',
  sent: 'badge-primary',
  Sent: 'badge-primary',
  draft: 'badge-primary',
  Draft: 'badge-primary',
  overdue: 'badge-danger',
  Overdue: 'badge-danger',
  rejected: 'badge-danger',
  Rejected: 'badge-danger',
  cancelled: 'badge-muted',
  inactive: 'badge-muted',
  Inactive: 'badge-muted',
  defaulted: 'badge-danger',
  Defaulted: 'badge-danger',
  active: 'badge-success',
  Active: 'badge-success',
};

export function getStatusBadgeClass(status: string): string {
  return STATUS_BADGE_MAP[status] || 'badge-primary';
}
