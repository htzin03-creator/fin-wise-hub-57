// Formulário para adicionar/editar transações
import { useState } from 'react';
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
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { Transaction, TransactionType, CurrencyType } from '@/types/finance';
import { formatDateForInput } from '@/lib/formatters';
import { Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const transactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(200, 'Máximo 200 caracteres'),
  amount: z.number().positive('Valor deve ser positivo'),
  currency: z.enum(['BRL', 'USD']),
  type: z.enum(['income', 'expense']),
  category_id: z.string().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
});

type FormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction;
}

export function TransactionForm({ open, onOpenChange, transaction }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(transaction?.type || 'expense');
  const { incomeCategories, expenseCategories } = useCategories();
  const { addTransaction, updateTransaction } = useTransactions();

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: transaction?.description || '',
      amount: transaction ? Number(transaction.amount) : undefined,
      currency: transaction?.currency || 'BRL',
      type: transaction?.type || 'expense',
      category_id: transaction?.category_id || '',
      date: transaction ? formatDateForInput(transaction.date) : formatDateForInput(new Date()),
    },
  });

  const isEditing = !!transaction;
  const isLoading = addTransaction.isPending || updateTransaction.isPending;

  const onSubmit = async (data: FormData) => {
    const formData = {
      description: data.description,
      amount: data.amount,
      currency: data.currency,
      type: type,
      category_id: data.category_id || '',
      date: data.date,
    };

    if (isEditing) {
      await updateTransaction.mutateAsync({ id: transaction.id, data: formData });
    } else {
      await addTransaction.mutateAsync(formData);
    }

    reset();
    onOpenChange(false);
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setValue('type', newType);
    setValue('category_id', '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Transação' : 'Nova Transação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipo de transação */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={type === 'income' ? 'default' : 'outline'}
              className={cn(
                'h-12',
                type === 'income' && 'bg-emerald-500 hover:bg-emerald-600'
              )}
              onClick={() => handleTypeChange('income')}
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Receita
            </Button>
            <Button
              type="button"
              variant={type === 'expense' ? 'default' : 'outline'}
              className={cn(
                'h-12',
                type === 'expense' && 'bg-rose-500 hover:bg-rose-600'
              )}
              onClick={() => handleTypeChange('expense')}
            >
              <ArrowDownRight className="w-4 h-4 mr-2" />
              Despesa
            </Button>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Salário, Mercado, etc."
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Valor e Moeda */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
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

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={watch('category_id')}
              onValueChange={(value) => setValue('category_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input id="date" type="date" {...register('date')} />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
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
              {isEditing ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
