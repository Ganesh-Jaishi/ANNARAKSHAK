/**
 * StatusBadge — clean, professional SaaS status badges with subtle dot indicators.
 */
export default function StatusBadge({ status }) {
  if (!status) return null;

  const key = status.toLowerCase().replace(/[\s-]/g, '_');

  const configs = {
    safe: { label: 'Safe Window', className: 'status-safe' },
    urgent: { label: 'Urgent', className: 'status-urgent' },
    critical: { label: 'Critical', className: 'status-critical' },
    expired: { label: 'Expired', className: 'status-expired' },
    fresh: { label: 'Fresh', className: 'status-safe' },
    acceptable: { label: 'Acceptable', className: 'status-urgent' },
    deteriorating: { label: 'Deteriorating', className: 'status-critical' },
    unsuitable: { label: 'Unsuitable', className: 'status-expired' },
    pending: { label: 'Pending Response', className: 'status-urgent' },
    accepted: { label: 'Accepted', className: 'status-safe' },
    in_transit: { label: 'In Transit', className: 'status-info' },
    picked_up: { label: 'In Transit', className: 'status-info' },
    assigned: { label: 'Driver Assigned', className: 'status-info' },
    delivered: { label: 'Delivered', className: 'status-safe' },
    rejected: { label: 'Declined', className: 'status-critical' },
    human: { label: 'Human Suitable', className: 'status-safe' },
    animal: { label: 'Animal Suitable', className: 'status-urgent' },
    recovery: { label: 'Biogas/Recovery', className: 'status-info' },
    segregated: { label: 'Segregated', className: 'status-info' },
    completed: { label: 'Completed', className: 'status-safe' },
    registered: { label: 'Registered', className: 'status-info' },
  };

  const cfg = configs[key] || { 
    label: status.replace(/_/g, ' '), 
    className: 'status-info' 
  };

  return (
    <span className={`status-badge ${cfg.className}`}>
      <span className="dot" />
      <span style={{ textTransform: 'capitalize' }}>{cfg.label}</span>
    </span>
  );
}
