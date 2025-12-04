import { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConnectBankButtonProps {
  onSuccess: (itemId: string, connectorName?: string, connectorLogo?: string) => void;
}

declare global {
  interface Window {
    PluggyConnect?: {
      init: (config: {
        connectToken: string;
        onSuccess: (data: { item: { id: string; connector: { name: string; imageUrl: string } } }) => void;
        onError: (error: Error) => void;
        onClose: () => void;
      }) => { open: () => void };
    };
  }
}

export function ConnectBankButton({ onSuccess }: ConnectBankButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Load Pluggy Connect script
    if (!document.getElementById("pluggy-connect-script")) {
      const script = document.createElement("script");
      script.id = "pluggy-connect-script";
      script.src = "https://cdn.pluggy.ai/pluggy-connect/v2.10.0/pluggy-connect.js";
      script.async = true;
      script.onload = () => {
        console.log("Pluggy script loaded");
        setScriptLoaded(true);
      };
      script.onerror = (e) => {
        console.error("Failed to load Pluggy script:", e);
        toast.error("Erro ao carregar widget de conexão");
      };
      document.body.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, []);

  const handleConnect = async () => {
    if (!scriptLoaded) {
      toast.error("Aguarde o carregamento do widget");
      console.log("Script not loaded yet");
      return;
    }

    if (!window.PluggyConnect) {
      toast.error("Widget não disponível, recarregue a página");
      console.error("PluggyConnect not available on window");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Calling pluggy edge function...");
      const { data, error } = await supabase.functions.invoke("pluggy", {
        body: { action: "create-connect-token" },
      });

      console.log("Pluggy response:", { data, error });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Erro na edge function");
      }

      if (!data?.connectToken) {
        console.error("No connect token in response:", data);
        throw new Error("Token de conexão não recebido");
      }

      console.log("Opening Pluggy widget with token");
      const pluggyConnect = window.PluggyConnect.init({
        connectToken: data.connectToken,
        onSuccess: (successData) => {
          console.log("Pluggy connection successful:", successData);
          onSuccess(
            successData.item.id,
            successData.item.connector.name,
            successData.item.connector.imageUrl
          );
        },
        onError: (err) => {
          console.error("Pluggy connection error:", err);
          toast.error("Erro ao conectar conta bancária");
        },
        onClose: () => {
          console.log("Pluggy widget closed");
        },
      });

      pluggyConnect.open();
    } catch (error) {
      console.error("Error in handleConnect:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao iniciar conexão bancária");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleConnect} disabled={isLoading || !scriptLoaded}>
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Plus className="w-4 h-4 mr-2" />
      )}
      Conectar Conta Bancária
    </Button>
  );
}
