// Lista de transações recentes para o dashboard
import { Transaction } from '@/types/finance';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { DynamicIcon } from '@/components/ui/DynamicIcon';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const recentTransactions = transactions.slice(0, 5);

  if (recentTransactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma transação registrada</p>
        <p className="text-sm">Adicione sua primeira transação!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentTransactions.map((transaction, index) => (
        <div
          key={transaction.id}
          className={cn(
            'flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors animate-in opacity-0',
            `stagger-${index + 1}`
          )}
          style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                transaction.type === 'income'
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-rose-500/10 text-rose-500'
              )}
            >
              {transaction.category ? (
                <DynamicIcon name={transaction.category.icon} className="w-5 h-5" />
              ) : transaction.type === 'income' ? (
                <ArrowUpRight className="w-5 h-5" />
              ) : (
                <ArrowDownRight className="w-5 h-5" />
              )}
            </div>

            <div>
              <p className="font-medium">{transaction.description}</p>
              <p className="text-sm text-muted-foreground">
                {transaction.category?.name || 'Sem categoria'} • {formatDate(transaction.date)}
              </p>
            </div>
          </div>

          <p
            className={cn(
              'font-semibold',
              transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
            )}
          >
            {transaction.type === 'income' ? '+' : '-'}
            {formatCurrency(Number(transaction.amount), transaction.currency)}
          </p>
        </div>
      ))}
    </div>
  );
}
