// Página de transações
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { useTransactions } from '@/hooks/useTransactions';
import { useBankTransactions } from '@/hooks/useBankTransactions';
import { useBankConnections } from '@/hooks/useBankConnections';
import { useNewTransactionNotifications } from '@/hooks/useNewTransactionNotifications';
import { Plus, Building2, RefreshCw, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function Transactions() {
  const [formOpen, setFormOpen] = useState(false);
  const { transactions: manualTransactions, isLoading: loadingManual } = useTransactions();
  const { transactions: bankTransactions, isLoading: loadingBank, fetchTransactions: refetchBankTransactions } = useBankTransactions();
  const { connections, syncConnection, isSyncing } = useBankConnections();
  const { newTransactionsCount, markAllAsSeen } = useNewTransactionNotifications();

  const hasConnectedBank = connections.length > 0;

  // Marca notificações como visualizadas quando a página é acessada
  useEffect(() => {
    if (newTransactionsCount > 0) {
      markAllAsSeen();
    }
  }, []);

  // Combinar transações manuais e bancárias para a visualização "Todas"
  const allTransactions = useMemo(() => {
    const manual = manualTransactions.map(t => ({
      id: t.id,
      description: t.description,
      amount: Number(t.amount),
      date: t.date,
      type: t.type as 'income' | 'expense',
      category: t.category,
      source: 'manual' as const,
      currency: t.currency,
    }));

    const bank = bankTransactions.map(t => ({
      id: t.id,
      description: t.description || 'Transação bancária',
      amount: Math.abs(t.amount),
      date: t.date,
      type: (t.amount >= 0 ? 'income' : 'expense') as 'income' | 'expense',
      category: null,
      source: 'bank' as const,
      currency: 'BRL',
      bankCategory: t.category,
    }));

    return [...manual, ...bank].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [manualTransactions, bankTransactions]);

  const handleSyncAll = async () => {
    for (const conn of connections) {
      await syncConnection(conn.id, conn.pluggy_item_id);
    }
    // Recarrega transações após sincronização
    await refetchBankTransactions();
  };

  const isLoading = loadingManual || loadingBank;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
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
          <h2 className="text-2xl font-bold">Suas Transações</h2>
          <p className="text-muted-foreground">
            {allTransactions.length} transações no total
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSyncAll} 
            disabled={isSyncing || !hasConnectedBank}
            title={!hasConnectedBank ? "Conecte uma conta bancária primeiro" : "Sincronizar transações bancárias"}
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sincronizar
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Banner para conectar banco */}
      {!hasConnectedBank && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Importe transações automaticamente</p>
              <p className="text-sm text-muted-foreground">Conecte sua conta bancária</p>
            </div>
          </div>
          <Link to="/bank-accounts">
            <Button variant="default" size="sm">
              Conectar
            </Button>
          </Link>
        </div>
      )}

      {/* Tabs para filtrar por fonte */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            Todas
            <Badge variant="secondary" className="h-5 px-1.5">
              {allTransactions.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            Manuais
            <Badge variant="secondary" className="h-5 px-1.5">
              {manualTransactions.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="bank" className="gap-2">
            Bancárias
            <Badge variant="secondary" className="h-5 px-1.5">
              {bankTransactions.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {allTransactions.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <p className="text-muted-foreground">Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      t.type === 'income' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                    )}>
                      {t.source === 'bank' ? (
                        <Building2 className={cn(
                          "w-5 h-5",
                          t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                        )} />
                      ) : t.category ? (
                        <div
                          className="w-5 h-5 rounded"
                          style={{ backgroundColor: t.category.color }}
                        />
                      ) : (
                        <div className={cn(
                          "w-5 h-5 rounded",
                          t.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'
                        )} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{t.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(t.date)}
                        {t.source === 'bank' && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">
                            Bancária
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className={cn(
                    "font-semibold",
                    t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                  )}>
                    {t.type === 'income' ? '+' : '-'}
                    {formatCurrency(t.amount, t.currency as 'BRL' | 'USD')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <TransactionList transactions={manualTransactions} />
        </TabsContent>

        <TabsContent value="bank" className="mt-4">
          {bankTransactions.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <Building2 className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {hasConnectedBank 
                  ? "Nenhuma transação bancária sincronizada ainda" 
                  : "Conecte sua conta bancária para ver transações"}
              </p>
              {!hasConnectedBank && (
                <Link to="/bank-accounts">
                  <Button variant="outline" className="mt-4">
                    Conectar Conta
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {bankTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      t.amount >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                    )}>
                      <Building2 className={cn(
                        "w-5 h-5",
                        t.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{t.description || 'Transação'}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(t.date)}
                        {t.category && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            • {t.category}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className={cn(
                    "font-semibold",
                    t.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  )}>
                    {t.amount >= 0 ? '+' : ''}
                    {formatCurrency(Math.abs(t.amount))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de nova transação */}
      <TransactionForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
