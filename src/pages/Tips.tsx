import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { GoalForm } from '@/components/goals/GoalForm';
import { 
  Lightbulb, 
  RefreshCw, 
  TrendingDown, 
  Sparkles,
  AlertCircle,
  PiggyBank,
  Target
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Goal } from '@/types/finance';

interface Tip {
  category: string;
  amount: number;
  percentage: string;
  tips: string[];
}

interface TipsResponse {
  tips: Tip[];
  summary: string;
  spendingData?: { category: string; amount: number; percentage: string }[];
}

export default function Tips() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [selectedGoalData, setSelectedGoalData] = useState<{ name: string; amount: number } | null>(null);
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery<TipsResponse>({
    queryKey: ['spending-tips'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('spending-tips');
      
      if (error) {
        if (error.message?.includes('429')) {
          throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
        }
        if (error.message?.includes('402')) {
          throw new Error('Créditos insuficientes para gerar dicas.');
        }
        throw error;
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      return data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Dicas atualizadas!');
    } catch (err) {
      toast.error('Erro ao atualizar dicas');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateGoal = (category: string, amount: number) => {
    // Suggest 20% reduction as goal
    const suggestedSavings = Math.round(amount * 0.2);
    setSelectedGoalData({
      name: `Economizar em ${category}`,
      amount: suggestedSavings > 0 ? suggestedSavings : 100,
    });
    setGoalFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Dicas para Economizar</h2>
            <p className="text-muted-foreground">
              Dicas personalizadas baseadas nos seus gastos
            </p>
          </div>
        </div>

        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar dicas</h3>
            <p className="text-muted-foreground text-center mb-4">
              {error instanceof Error ? error.message : 'Tente novamente mais tarde'}
            </p>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Dicas para Economizar
          </h2>
          <p className="text-muted-foreground">
            Dicas personalizadas baseadas nos seus gastos com IA
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
          {isRefreshing ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Atualizar Dicas
        </Button>
      </div>

      {/* Summary Card */}
      {data?.summary && (
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <PiggyBank className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Resumo</h3>
              <p className="text-muted-foreground">{data.summary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spending Overview */}
      {data?.spendingData && data.spendingData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-500" />
              Seus Maiores Gastos
            </CardTitle>
            <CardDescription>
              Categorias onde você mais gasta dinheiro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.spendingData.map((item, index) => (
                <div key={item.category} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{item.category}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          index === 0 ? "bg-rose-500" :
                          index === 1 ? "bg-orange-500" :
                          index === 2 ? "bg-amber-500" :
                          "bg-primary"
                        )}
                        style={{ width: `${Math.min(parseFloat(item.percentage), 100)}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {item.percentage}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data?.tips.map((tipGroup, index) => (
          <Card 
            key={tipGroup.category}
            className="hover:border-primary/30 transition-colors"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    index === 0 ? "bg-rose-500/10 text-rose-500" :
                    index === 1 ? "bg-orange-500/10 text-orange-500" :
                    index === 2 ? "bg-amber-500/10 text-amber-500" :
                    "bg-primary/10 text-primary"
                  )}>
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{tipGroup.category}</CardTitle>
                    {tipGroup.amount > 0 && (
                      <CardDescription>
                        {formatCurrency(tipGroup.amount)} ({tipGroup.percentage}% dos gastos)
                      </CardDescription>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {tipGroup.tips.map((tip, tipIndex) => (
                  <li key={tipIndex} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-emerald-500">
                        {tipIndex + 1}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {tip}
                    </p>
                  </li>
                ))}
              </ul>
              
              {tipGroup.amount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4"
                  onClick={() => handleCreateGoal(tipGroup.category, tipGroup.amount)}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Criar meta de economia
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {(!data?.tips || data.tips.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sem dicas ainda</h3>
            <p className="text-muted-foreground text-center mb-6">
              Adicione algumas transações para receber dicas personalizadas
            </p>
          </CardContent>
        </Card>
      )}

      {/* Goal Form Modal */}
      <GoalForm 
        open={goalFormOpen} 
        onOpenChange={(open) => {
          setGoalFormOpen(open);
          if (!open) setSelectedGoalData(null);
        }}
        defaultValues={selectedGoalData ? {
          name: selectedGoalData.name,
          target_amount: selectedGoalData.amount,
          currency: 'BRL' as const,
        } : undefined}
      />
    </div>
  );
}
