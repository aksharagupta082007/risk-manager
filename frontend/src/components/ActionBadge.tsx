import React from 'react';
import { CheckCircle2, MessageSquare, CreditCard, ShieldAlert } from 'lucide-react';

interface ActionBadgeProps {
  action: string;
  compact?: boolean;
}

const actionConfig: Record<string, { label: string; compactLabel: string; icon: React.ElementType; classes: string }> = {
  a0_allow_cod: {
    label: 'a0: Allow COD',
    compactLabel: 'a0',
    icon: CheckCircle2,
    classes: 'bg-fintech-safe/10 text-fintech-safe border-fintech-safe/20',
  },
  a1_whatsapp_confirmation: {
    label: 'a1: WhatsApp',
    compactLabel: 'a1',
    icon: MessageSquare,
    classes: 'bg-fintech-confirm/10 text-fintech-confirm border-fintech-confirm/20',
  },
  a2_commitment_deposit: {
    label: 'a2: Deposit',
    compactLabel: 'a2',
    icon: CreditCard,
    classes: 'bg-fintech-deposit/10 text-fintech-deposit border-fintech-deposit/20',
  },
  a3_prepaid_only_or_hold: {
    label: 'a3: Prepaid / Hold',
    compactLabel: 'a3',
    icon: ShieldAlert,
    classes: 'bg-fintech-danger/10 text-fintech-danger border-fintech-danger/20',
  },
};

export const ActionBadge: React.FC<ActionBadgeProps> = ({ action, compact = false }) => {
  const config = actionConfig[action];
  if (!config) return <span className="text-[10px] text-fintech-muted font-mono">{action}</span>;

  const Icon = config.icon;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${config.classes}`}>
        <Icon className="w-3 h-3" />
        {config.compactLabel}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${config.classes}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};
