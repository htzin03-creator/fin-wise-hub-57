// Página de relatórios
import { useState, useMemo } from 'react';
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
import { useTransactions } from '@/hooks/useTransactions';
import { useBankTransactions } from '@/hooks/useBankTransactions';
import { useBankConnections } from '@/hooks/useBankConnections';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency, formatDate, formatDateForInput } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import {
  FileText,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Building2,
  Wallet,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

export default function Reports() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return formatDateForInput(date);
  });
  const [endDate, setEndDate] = useState(() => formatDateForInput(new Date()));
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const { transactions: manualTransactions, isLoading: loadingTransactions } = useTransactions();
  const { transactions: bankTransactions, isLoading: loadingBank } = useBankTransactions();
  const { accounts, connections, getTotalBalance, isLoading: loadingAccounts } = useBankConnections();
  const { categories, isLoading: loadingCategories } = useCategories();

  const hasConnectedBank = connections.length > 0;
  const bankBalance = getTotalBalance();

  // Combinar todas as transações
  const allTransactions = useMemo(() => {
    const manual = manualTransactions.map(t => ({
      id: t.id,
      description: t.description,
      amount: Number(t.amount),
      date: t.date,
      type: t.type as 'income' | 'expense',
      category: t.category,
      category_id: t.category_id,
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
      category_id: null,
      source: 'bank' as const,
      currency: 'BRL',
    }));

    return [...manual, ...bank];
  }, [manualTransactions, bankTransactions]);

  // Filtrar transações
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      const transactionDate = new Date(t.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59);

      const dateInRange = transactionDate >= start && transactionDate <= end;
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || t.category_id === categoryFilter;
      const matchesSource = sourceFilter === 'all' || t.source === sourceFilter;

      return dateInRange && matchesType && matchesCategory && matchesSource;
    });
  }, [allTransactions, startDate, endDate, typeFilter, categoryFilter, sourceFilter]);

  // Calcular totais
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  // Exportar CSV
  const exportCSV = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Fonte', 'Valor', 'Moeda'];
    const rows = filteredTransactions.map((t) => [
      formatDate(t.date),
      t.description,
      t.category?.name || 'Sem categoria',
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.source === 'bank' ? 'Bancária' : 'Manual',
      t.amount.toString(),
      t.currency,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${startDate}_${endDate}.csv`;
    link.click();
  };

  const isLoading = loadingTransactions || loadingCategories || loadingBank || loadingAccounts;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Relatórios</h2>
          <p className="text-muted-foreground">
            Analise suas finanças por período
          </p>
        </div>
        <Button onClick={exportCSV} disabled={filteredTransactions.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Saldo Bancário Atual */}
      {hasConnectedBank && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Bancário Atual</p>
                <p className={cn(
                  "text-3xl font-bold",
                  bankBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'
                )}>
                  {formatCurrency(bankBalance)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{accounts.length} conta(s)</p>
              <Link to="/bank-accounts">
                <Button variant="ghost" size="sm">Ver contas</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Filtros</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label>Data inicial</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Data final</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fonte</Label>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="manual">Manuais</SelectItem>
                <SelectItem value="bank">Bancárias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-6">
          <p className="text-sm text-muted-foreground mb-1">Total de Receitas</p>
          <p className="text-2xl font-bold text-emerald-500">
            {formatCurrency(totals.income)}
          </p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6">
          <p className="text-sm text-muted-foreground mb-1">Total de Despesas</p>
          <p className="text-2xl font-bold text-rose-500">
            {formatCurrency(totals.expense)}
          </p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6">
          <p className="text-sm text-muted-foreground mb-1">Balanço do Período</p>
          <p className={cn(
            'text-2xl font-bold',
            totals.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'
          )}>
            {formatCurrency(totals.balance)}
          </p>
        </div>
      </div>

      {/* Tabela de transações */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Transações do Período
            <span className="text-sm font-normal text-muted-foreground">
              ({filteredTransactions.length} registros)
            </span>
          </h3>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma transação encontrada no período</p>
            {!hasConnectedBank && (
              <Link to="/bank-accounts">
                <Button variant="outline" className="mt-4">
                  <Building2 className="w-4 h-4 mr-2" />
                  Conectar Conta Bancária
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Data</th>
                  <th className="text-left p-4 font-medium">Descrição</th>
                  <th className="text-left p-4 font-medium">Categoria</th>
                  <th className="text-left p-4 font-medium">Fonte</th>
                  <th className="text-left p-4 font-medium">Tipo</th>
                  <th className="text-right p-4 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((t) => (
                  <tr key={t.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-4 text-muted-foreground">
                      {formatDate(t.date)}
                    </td>
                    <td className="p-4 font-medium">{t.description}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {t.category ? (
                          <>
                            <div
                              className="w-6 h-6 rounded flex items-center justify-center"
                              style={{ backgroundColor: `${t.category.color}20`, color: t.category.color }}
                            >
                              <DynamicIcon name={t.category.icon} className="w-3 h-3" />
                            </div>
                            <span>{t.category.name}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                        t.source === 'bank' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {t.source === 'bank' ? (
                          <Building2 className="w-3 h-3" />
                        ) : (
                          <Wallet className="w-3 h-3" />
                        )}
                        {t.source === 'bank' ? 'Bancária' : 'Manual'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                          t.type === 'income'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-rose-500/10 text-rose-500'
                        )}
                      >
                        {t.type === 'income' ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {t.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td
                      className={cn(
                        'p-4 text-right font-semibold',
                        t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                      )}
                    >
                      {t.type === 'income' ? '+' : '-'}
                      {formatCurrency(Number(t.amount), t.currency as 'BRL' | 'USD')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
