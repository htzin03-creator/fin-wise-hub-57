// Card de estatísticas para o dashboard
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { CurrencyType } from '@/types/finance';

interface StatsCardProps {
  title: string;
  value: number;
  currency?: CurrencyType;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  className?: string;
  variant?: 'default' | 'income' | 'expense';
}

export function StatsCard({
  title,
  value,
  currency = 'BRL',
  icon: Icon,
  trend,
  trendValue,
  className,
  variant = 'default',
}: StatsCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover-lift',
        variant === 'income' && 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20',
        variant === 'expense' && 'bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20',
        variant === 'default' && 'bg-card border border-border',
        className
      )}
    >
      {/* Ícone decorativo de fundo */}
      <div className="absolute -right-4 -top-4 opacity-5">
        <Icon className="w-32 h-32" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              variant === 'income' && 'bg-emerald-500/20 text-emerald-500',
              variant === 'expense' && 'bg-rose-500/20 text-rose-500',
              variant === 'default' && 'bg-primary/10 text-primary'
            )}
          >
            <Icon className="w-6 h-6" />
          </div>

          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full',
                trend === 'up' && 'bg-emerald-500/10 text-emerald-500',
                trend === 'down' && 'bg-rose-500/10 text-rose-500',
                trend === 'stable' && 'bg-muted text-muted-foreground'
              )}
            >
              <TrendIcon className="w-3 h-3" />
              {trendValue !== undefined && <span>{Math.abs(trendValue).toFixed(1)}%</span>}
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p
          className={cn(
            'text-2xl lg:text-3xl font-bold',
            variant === 'income' && 'text-emerald-500',
            variant === 'expense' && 'text-rose-500'
          )}
        >
          {currency ? formatCurrency(value, currency) : value.toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  );
}
