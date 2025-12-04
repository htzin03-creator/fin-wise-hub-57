// Gráfico de linha para evolução do saldo
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MonthlyStats } from '@/types/finance';
import { formatCurrency, getMonthName } from '@/lib/formatters';

interface BalanceChartProps {
  data: MonthlyStats[];
  currency?: 'BRL' | 'USD';
}

export function BalanceChart({ data, currency = 'BRL' }: BalanceChartProps) {
  // Calcula saldo acumulado
  let accumulated = 0;
  const chartData = data.map((item) => {
    accumulated += item.income - item.expense;
    // Parse month correctly - item.month is in format "YYYY-MM"
    const [year, month] = item.month.split('-').map(Number);
    return {
      ...item,
      monthName: getMonthName(month - 1, true), // month is 1-indexed, getMonthName expects 0-indexed
      balance: accumulated,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className={`text-sm font-semibold ${value >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            Saldo: {formatCurrency(value, currency)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Sem dados para exibir
      </div>
    );
  }

  const minBalance = Math.min(...chartData.map(d => d.balance));
  const maxBalance = Math.max(...chartData.map(d => d.balance));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="monthName"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          axisLine={{ stroke: 'hsl(var(--border))' }}
        />
        <YAxis
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tickFormatter={(value) => formatCurrency(value, currency).replace(/[R$\s]/g, '')}
          domain={[minBalance < 0 ? minBalance * 1.1 : 0, maxBalance * 1.1]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#balanceGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
