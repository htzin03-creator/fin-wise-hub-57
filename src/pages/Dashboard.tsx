// Página principal do dashboard
import { useMemo, useEffect } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { MonthlyChart } from '@/components/dashboard/MonthlyChart';
import { BalanceChart } from '@/components/dashboard/BalanceChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { GoalProgress } from '@/components/dashboard/GoalProgress';
import { useTransactions } from '@/hooks/useTransactions';
import { useGoals } from '@/hooks/useGoals';
import { useBankConnections } from '@/hooks/useBankConnections';
import { useBankTransactions } from '@/hooks/useBankTransactions';
import { CategoryStats, MonthlyStats } from '@/types/finance';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { transactions, isLoading: loadingTransactions } = useTransactions();
  const { goals, isLoading: loadingGoals } = useGoals();
  const { accounts, connections, isLoading: loadingBank, getTotalBalance, syncConnection } = useBankConnections();
  const { transactions: bankTransactions, isLoading: loadingBankTransactions, fetchTransactions: fetchBankTransactions } = useBankTransactions();

  const bankBalance = getTotalBalance();
  const hasConnectedBank = connections.length > 0;

  // Auto-sync a cada 5 minutos
  useEffect(() => {
    if (!hasConnectedBank) return;
    
    const syncAll = async () => {
      for (const conn of connections) {
        await syncConnection(conn.id, conn.pluggy_item_id);
      }
      fetchBankTransactions();
    };

    // Sync inicial
    syncAll();

    // Polling a cada 5 minutos
    const interval = setInterval(syncAll, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [connections.length]);

  // Combinar transações manuais e bancárias para cálculos
  const allTransactionsForStats = useMemo(() => {
    // Transações manuais
    const manual = transactions.map(t => ({
      date: t.date,
      type: t.type as 'income' | 'expense',
      amount: Number(t.amount),
      category: t.category,
      description: t.description,
      source: 'manual' as const
    }));

    // Transações bancárias - converter amount negativo para expense, positivo para income
    const bank = bankTransactions.map(t => ({
      date: t.date,
      type: (Number(t.amount) < 0 ? 'expense' : 'income') as 'income' | 'expense',
      amount: Math.abs(Number(t.amount)),
      category: t.category ? { id: t.category, name: t.category, color: '#6B7280', icon: 'Tag', type: 'expense' as const } : null,
      description: t.description || 'Transação bancária',
      source: 'bank' as const
    }));

    return [...manual, ...bank];
  }, [transactions, bankTransactions]);

  // Calcular estatísticas usando todas as transações
  const stats = useMemo(() => {
    const totalIncome = allTransactionsForStats
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = allTransactionsForStats
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Usar saldo bancário se disponível
    const balance = hasConnectedBank ? bankBalance : totalIncome - totalExpense;

    // Calcular tendência comparando com mês anterior
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthTransactions = allTransactionsForStats.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const lastMonthTransactions = allTransactionsForStats.filter((t) => {
      const date = new Date(t.date);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });

    const currentBalance =
      currentMonthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0) -
      currentMonthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const lastBalance =
      lastMonthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0) -
      lastMonthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const trendPercentage =
      lastBalance !== 0
        ? ((currentBalance - lastBalance) / Math.abs(lastBalance)) * 100
        : currentBalance > 0
        ? 100
        : 0;

    const trend: 'up' | 'down' | 'stable' =
      trendPercentage > 5 ? 'up' : trendPercentage < -5 ? 'down' : 'stable';

    return { totalIncome, totalExpense, balance, trend, trendPercentage };
  }, [allTransactionsForStats, hasConnectedBank, bankBalance]);

  // Calcular estatísticas por categoria (despesas) usando todas as transações
  const categoryStats: CategoryStats[] = useMemo(() => {
    const expenseTransactions = allTransactionsForStats.filter((t) => t.type === 'expense');
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    const categoryMap = new Map<string, { category: any; total: number; count: number }>();

    expenseTransactions.forEach((t) => {
      const categoryKey = t.category?.id || 'sem-categoria';
      const existing = categoryMap.get(categoryKey);
      if (existing) {
        existing.total += t.amount;
        existing.count += 1;
      } else {
        categoryMap.set(categoryKey, {
          category: t.category || { id: 'sem-categoria', name: 'Sem Categoria', color: '#6B7280', icon: 'Tag', type: 'expense' },
          total: t.amount,
          count: 1,
        });
      }
    });

    return Array.from(categoryMap.values())
      .map((item) => ({
        ...item,
        percentage: totalExpense > 0 ? (item.total / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [allTransactionsForStats]);

  // Calcular estatísticas mensais usando todas as transações
  const monthlyStats: MonthlyStats[] = useMemo(() => {
    const monthMap = new Map<string, { income: number; expense: number }>();

    allTransactionsForStats.forEach((t) => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const existing = monthMap.get(monthKey) || { income: 0, expense: 0 };
      if (t.type === 'income') {
        existing.income += t.amount;
      } else {
        existing.expense += t.amount;
      }
      monthMap.set(monthKey, existing);
    });

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        balance: data.income - data.expense,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [allTransactionsForStats]);

  // Combinar transações para exibição recente
  const recentTransactionsForDisplay = useMemo(() => {
    const manual = transactions.map(t => ({
      ...t,
      source: 'manual' as const
    }));

    const bank = bankTransactions.map(t => ({
      id: t.id,
      description: t.description || 'Transação bancária',
      amount: Number(t.amount),
      date: t.date,
      type: (Number(t.amount) < 0 ? 'expense' : 'income') as 'income' | 'expense',
      category: t.category ? { id: t.category, name: t.category, color: '#6B7280', icon: 'Tag', type: 'expense' as const, user_id: '', is_default: false, created_at: '' } : null,
      currency: 'BRL' as const,
      user_id: t.user_id,
      created_at: t.created_at,
      updated_at: t.created_at,
      category_id: null,
      source: 'bank' as const
    }));

    return [...manual, ...bank]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, bankTransactions]);

  const isLoading = loadingTransactions || loadingGoals || loadingBank || loadingBankTransactions;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner para conectar banco se não tiver */}
      {!hasConnectedBank && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Conecte sua conta bancária</p>
              <p className="text-sm text-muted-foreground">Importe transações automaticamente</p>
            </div>
          </div>
          <Link to="/bank-accounts">
            <Button variant="default" size="sm">
              Conectar
            </Button>
          </Link>
        </div>
      )}

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={hasConnectedBank ? "Saldo Bancário" : "Saldo Total"}
          value={stats.balance}
          icon={hasConnectedBank ? Building2 : Wallet}
          trend={stats.trend}
          trendValue={stats.trendPercentage}
        />
        <StatsCard
          title="Total de Receitas"
          value={stats.totalIncome}
          icon={TrendingUp}
          variant="income"
        />
        <StatsCard
          title="Total de Despesas"
          value={stats.totalExpense}
          icon={TrendingDown}
          variant="expense"
        />
        <StatsCard
          title="Transações"
          value={allTransactionsForStats.length}
          icon={ArrowUpRight}
          currency={undefined}
        />
      </div>

      {/* Contas bancárias conectadas */}
      {hasConnectedBank && accounts.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Contas Conectadas</h3>
            <Link to="/bank-accounts">
              <Button variant="ghost" size="sm">Ver todas</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.slice(0, 3).map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border"
              >
                <div>
                  <p className="font-medium text-foreground">{account.name || "Conta"}</p>
                  <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
                </div>
                <p className={`font-semibold ${account.balance >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: account.currency || 'BRL' }).format(account.balance)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de pizza - Despesas por categoria */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Despesas por Categoria</h3>
          <ExpenseChart data={categoryStats} />
        </div>

        {/* Gráfico de barras - Comparativo mensal */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Comparativo Mensal</h3>
          <MonthlyChart data={monthlyStats} />
        </div>
      </div>

      {/* Gráfico de linha - Evolução do saldo */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Evolução do Saldo</h3>
        <BalanceChart data={monthlyStats} />
      </div>

      {/* Transações recentes e Metas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Transações Recentes</h3>
          <RecentTransactions transactions={recentTransactionsForDisplay} />
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Metas em Andamento</h3>
          <GoalProgress goals={goals} />
        </div>
      </div>
    </div>
  );
}
