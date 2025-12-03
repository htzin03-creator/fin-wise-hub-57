// Gráfico de pizza para despesas por categoria
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CategoryStats } from '@/types/finance';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

interface ExpenseChartProps {
  data: CategoryStats[];
  currency?: 'BRL' | 'USD';
}

const COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

export function ExpenseChart({ data, currency = 'BRL' }: ExpenseChartProps) {
  const chartData = data.map((item, index) => ({
    name: item.category.name,
    value: item.total,
    percentage: item.percentage,
    color: item.category.color || COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.value, currency)}
          </p>
          <p className="text-sm text-primary">
            {formatPercentage(data.percentage)}
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

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
