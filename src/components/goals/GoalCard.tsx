// Card de meta financeira
import { useState } from 'react';
import { Goal } from '@/types/finance';
import { formatCurrency, formatPercentage, getDaysRemaining, formatDate } from '@/lib/formatters';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { useGoals } from '@/hooks/useGoals';
import { cn } from '@/lib/utils';
import {
  Target,
  Calendar,
  CheckCircle2,
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  Loader2,
} from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const [addAmountOpen, setAddAmountOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const { addToGoal } = useGoals();

  const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
  const isCompleted = progress >= 100;
  const daysRemaining = goal.deadline ? getDaysRemaining(goal.deadline) : null;

  const handleAddAmount = async () => {
    const value = parseFloat(amount);
    if (value > 0) {
      await addToGoal.mutateAsync({ id: goal.id, amount: value });
      setAmount('');
      setAddAmountOpen(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl p-6 transition-all hover-lift',
          isCompleted
            ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30'
            : 'bg-card border border-border'
        )}
      >
        {/* Badge de conclusão */}
        {isCompleted && (
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Concluída!
            </span>
          </div>
        )}

        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center',
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-500'
                  : 'bg-primary/10 text-primary'
              )}
            >
              <Target className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{goal.name}</h3>
              {goal.deadline && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(goal.deadline)} •{' '}
                  {daysRemaining !== null && daysRemaining > 0
                    ? `${daysRemaining} dias restantes`
                    : daysRemaining === 0
                    ? 'Vence hoje!'
                    : 'Vencido'}
                </p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isCompleted && (
                <>
                  <DropdownMenuItem onClick={() => setAddAmountOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar valor
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(goal)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(goal)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progresso */}
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Progresso</p>
              <p className="text-3xl font-bold">
                {formatCurrency(Number(goal.current_amount), goal.currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Meta</p>
              <p className="text-xl font-semibold text-muted-foreground">
                {formatCurrency(Number(goal.target_amount), goal.currency)}
              </p>
            </div>
          </div>

          <Progress
            value={Math.min(progress, 100)}
            className={cn('h-3', isCompleted && '[&>div]:bg-emerald-500')}
          />

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {formatPercentage(Math.min(progress, 100), 0)} concluído
            </span>
            <span className="text-muted-foreground">
              Faltam {formatCurrency(Math.max(Number(goal.target_amount) - Number(goal.current_amount), 0), goal.currency)}
            </span>
          </div>
        </div>

        {!isCompleted && (
          <Button
            className="w-full mt-4"
            variant="outline"
            onClick={() => setAddAmountOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar valor
          </Button>
        )}
      </div>

      {/* Modal para adicionar valor */}
      <ResponsiveModal
        open={addAmountOpen}
        onOpenChange={setAddAmountOpen}
        title="Adicionar valor à meta"
      >
        <div className="space-y-4">
          <Input
            type="number"
            step="0.01"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setAddAmountOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleAddAmount}
              disabled={addToGoal.isPending}
            >
              {addToGoal.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </>
  );
}
