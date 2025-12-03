// Formulário para adicionar/editar metas
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGoals } from '@/hooks/useGoals';
import { Goal, CurrencyType } from '@/types/finance';
import { formatDateForInput } from '@/lib/formatters';
import { Loader2 } from 'lucide-react';

const goalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Máximo 100 caracteres'),
  target_amount: z.number().positive('Valor deve ser positivo'),
  currency: z.enum(['BRL', 'USD']),
  deadline: z.string().optional(),
});

type FormData = z.infer<typeof goalSchema>;

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal;
}

export function GoalForm({ open, onOpenChange, goal }: GoalFormProps) {
  const { addGoal, updateGoal } = useGoals();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: goal?.name || '',
      target_amount: goal ? Number(goal.target_amount) : undefined,
      currency: goal?.currency || 'BRL',
      deadline: goal?.deadline ? formatDateForInput(goal.deadline) : '',
    },
  });

  const isEditing = !!goal;
  const isLoading = addGoal.isPending || updateGoal.isPending;

  const onSubmit = async (data: FormData) => {
    const formData = {
      name: data.name,
      target_amount: data.target_amount,
      currency: data.currency,
      deadline: data.deadline || null,
    };

    if (isEditing) {
      await updateGoal.mutateAsync({ id: goal.id, data: formData });
    } else {
      await addGoal.mutateAsync(formData);
    }

    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Meta</Label>
            <Input
              id="name"
              placeholder="Ex: Viagem, Reserva de emergência"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Valor e Moeda */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="target_amount">Valor da Meta</Label>
              <Input
                id="target_amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                {...register('target_amount', { valueAsNumber: true })}
              />
              {errors.target_amount && (
                <p className="text-sm text-destructive">{errors.target_amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Moeda</Label>
              <Select
                value={watch('currency')}
                onValueChange={(value) => setValue('currency', value as CurrencyType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">R$</SelectItem>
                  <SelectItem value="USD">US$</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Prazo */}
          <div className="space-y-2">
            <Label htmlFor="deadline">Prazo (opcional)</Label>
            <Input id="deadline" type="date" {...register('deadline')} />
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar Meta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
