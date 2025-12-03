// Componente de progresso de metas para o dashboard
import { Goal } from '@/types/finance';
import { formatCurrency, formatPercentage, getDaysRemaining } from '@/lib/formatters';
import { Progress } from '@/components/ui/progress';
import { Target, Calendar, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalProgressProps {
  goals: Goal[];
}

export function GoalProgress({ goals }: GoalProgressProps) {
  const activeGoals = goals.slice(0, 3);

  if (activeGoals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Nenhuma meta definida</p>
        <p className="text-sm">Crie uma meta para acompanhar!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeGoals.map((goal, index) => {
        const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
        const isCompleted = progress >= 100;
        const daysRemaining = goal.deadline ? getDaysRemaining(goal.deadline) : null;

        return (
          <div
            key={goal.id}
            className={cn(
              'p-4 rounded-xl border transition-all animate-in opacity-0',
              isCompleted
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-card border-border'
            )}
            style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-500'
                      : 'bg-primary/10 text-primary'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Target className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{goal.name}</p>
                  {daysRemaining !== null && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {daysRemaining > 0
                        ? `${daysRemaining} dias restantes`
                        : daysRemaining === 0
                        ? 'Vence hoje!'
                        : 'Vencido'}
                    </p>
                  )}
                </div>
              </div>
              <span
                className={cn(
                  'text-sm font-medium px-2 py-1 rounded-full',
                  isCompleted
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {formatPercentage(Math.min(progress, 100), 0)}
              </span>
            </div>

            <Progress
              value={Math.min(progress, 100)}
              className={cn('h-2', isCompleted && '[&>div]:bg-emerald-500')}
            />

            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>{formatCurrency(Number(goal.current_amount), goal.currency)}</span>
              <span>{formatCurrency(Number(goal.target_amount), goal.currency)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
