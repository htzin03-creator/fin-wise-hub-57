// Página de metas financeiras
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GoalForm } from '@/components/goals/GoalForm';
import { GoalCard } from '@/components/goals/GoalCard';
import { useGoals } from '@/hooks/useGoals';
import { Goal } from '@/types/finance';
import { Plus, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function Goals() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const { goals, isLoading, deleteGoal } = useGoals();

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Suas Metas</h2>
          <p className="text-muted-foreground">
            {goals.length} metas criadas
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {/* Lista de metas */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal, index) => (
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
