// Gráfico de barras para comparativo mensal
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { MonthlyStats } from '@/types/finance';
import { formatCurrency, getMonthName } from '@/lib/formatters';

interface MonthlyChartProps {
  data: MonthlyStats[];
  currency?: 'BRL' | 'USD';
}

export function MonthlyChart({ data, currency = 'BRL' }: MonthlyChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    monthName: getMonthName(new Date(item.month + '-01').getMonth(), true),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.name}: {formatCurrency(entry.value, currency)}
            </p>
          ))}
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

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
        />
        <Bar
          dataKey="income"
          name="Receitas"
          fill="hsl(var(--income))"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="expense"
          name="Despesas"
          fill="hsl(var(--expense))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
