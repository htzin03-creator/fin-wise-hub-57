// Página principal do dashboard
import { useMemo } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { MonthlyChart } from '@/components/dashboard/MonthlyChart';
import { BalanceChart } from '@/components/dashboard/BalanceChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { GoalProgress } from '@/components/dashboard/GoalProgress';
import { useTransactions } from '@/hooks/useTransactions';
import { useGoals } from '@/hooks/useGoals';
import { CategoryStats, MonthlyStats } from '@/types/finance';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { transactions, isLoading: loadingTransactions } = useTransactions();
  const { goals, isLoading: loadingGoals } = useGoals();

  // Calcular estatísticas
  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = totalIncome - totalExpense;

    // Calcular tendência comparando com mês anterior
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const lastMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });

    const currentBalance =
      currentMonthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) -
      currentMonthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const lastBalance =
      lastMonthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) -
      lastMonthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const trendPercentage =
      lastBalance !== 0
        ? ((currentBalance - lastBalance) / Math.abs(lastBalance)) * 100
        : currentBalance > 0
        ? 100
        : 0;

    const trend: 'up' | 'down' | 'stable' =
      trendPercentage > 5 ? 'up' : trendPercentage < -5 ? 'down' : 'stable';

    return { totalIncome, totalExpense, balance, trend, trendPercentage };
  }, [transactions]);

  // Calcular estatísticas por categoria (despesas)
  const categoryStats: CategoryStats[] = useMemo(() => {
    const expenseTransactions = transactions.filter((t) => t.type === 'expense');
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    const categoryMap = new Map<string, { category: any; total: number; count: number }>();

    expenseTransactions.forEach((t) => {
      if (t.category) {
        const existing = categoryMap.get(t.category.id);
        if (existing) {
          existing.total += Number(t.amount);
          existing.count += 1;
        } else {
          categoryMap.set(t.category.id, {
            category: t.category,
            total: Number(t.amount),
            count: 1,
          });
        }
      }
    });

    return Array.from(categoryMap.values())
      .map((item) => ({
        ...item,
        percentage: totalExpense > 0 ? (item.total / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  // Calcular estatísticas mensais
  const monthlyStats: MonthlyStats[] = useMemo(() => {
    const monthMap = new Map<string, { income: number; expense: number }>();

    transactions.forEach((t) => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const existing = monthMap.get(monthKey) || { income: 0, expense: 0 };
      if (t.type === 'income') {
        existing.income += Number(t.amount);
      } else {
        existing.expense += Number(t.amount);
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
  }, [transactions]);

  const isLoading = loadingTransactions || loadingGoals;

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
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Saldo Total"
          value={stats.balance}
          icon={Wallet}
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
          value={transactions.length}
          icon={ArrowUpRight}
          currency={undefined}
        />
      </div>

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
          <RecentTransactions transactions={transactions} />
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Metas em Andamento</h3>
          <GoalProgress goals={goals} />
        </div>
      </div>
    </div>
  );
}
