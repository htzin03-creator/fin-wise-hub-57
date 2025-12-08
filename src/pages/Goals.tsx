// Página de metas financeiras
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { GoalForm } from '@/components/goals/GoalForm';
import { GoalCard } from '@/components/goals/GoalCard';
import { useGoals } from '@/hooks/useGoals';
import { Goal } from '@/types/finance';
import { Plus, Target, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export default function Goals() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const [completedOpen, setCompletedOpen] = useState(true);
  const { goals, isLoading, deleteGoal } = useGoals();

  // Separa metas em andamento e concluídas
  const { activeGoals, completedGoals } = useMemo(() => {
    const active: Goal[] = [];
    const completed: Goal[] = [];
    
    goals.forEach(goal => {
      const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
      if (progress >= 100) {
        completed.push(goal);
      } else {
        active.push(goal);
      }
    });
    
    return { activeGoals: active, completedGoals: completed };
  }, [goals]);

  const handleDelete = async () => {
    if (deletingGoal) {
      await deleteGoal.mutateAsync(deletingGoal.id);
      setDeletingGoal(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Suas Metas</h2>
          <p className="text-muted-foreground">
            {activeGoals.length} em andamento • {completedGoals.length} concluídas
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {/* Metas em andamento */}
      {goals.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold mb-2">Nenhuma meta criada</h3>
          <p className="text-muted-foreground mb-6">
            Crie sua primeira meta financeira e comece a economizar!
          </p>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar primeira meta
          </Button>
        </div>
      ) : (
        <>
          {/* Seção de metas em andamento */}
          {activeGoals.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Em Andamento</h3>
                <Badge variant="secondary">{activeGoals.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeGoals.map((goal, index) => (
                  <div
                    key={goal.id}
                    className="animate-in opacity-0"
                    style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
                  >
                    <GoalCard
                      goal={goal}
                      onEdit={setEditingGoal}
                      onDelete={setDeletingGoal}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Seção de metas concluídas */}
          {completedGoals.length > 0 && (
            <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 mb-4 w-full text-left hover:opacity-80 transition-opacity">
                  <Trophy className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-semibold">Conquistas</h3>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    {completedGoals.length}
                  </Badge>
                  <div className="flex-1" />
                  {completedOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedGoals.map((goal, index) => (
                    <div
                      key={goal.id}
                      className="animate-in opacity-0"
                      style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
                    >
                      <GoalCard
                        goal={goal}
                        onEdit={setEditingGoal}
                        onDelete={setDeletingGoal}
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Mensagem quando não há metas ativas */}
          {activeGoals.length === 0 && completedGoals.length > 0 && (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
              <h3 className="text-xl font-semibold mb-2">Parabéns!</h3>
              <p className="text-muted-foreground mb-6">
                Você completou todas as suas metas. Que tal criar uma nova?
              </p>
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Meta
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modal de nova meta */}
      <GoalForm open={formOpen} onOpenChange={setFormOpen} />

      {/* Modal de edição */}
      {editingGoal && (
        <GoalForm
          open={!!editingGoal}
          onOpenChange={() => setEditingGoal(null)}
          goal={editingGoal}
        />
      )}

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deletingGoal} onOpenChange={() => setDeletingGoal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a meta "{deletingGoal?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
