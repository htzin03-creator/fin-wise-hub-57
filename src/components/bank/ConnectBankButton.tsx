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
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, []);

  const handleConnect = async () => {
    if (!scriptLoaded || !window.PluggyConnect) {
      toast.error("Aguarde o carregamento do widget");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("pluggy", {
        body: { action: "create-connect-token" },
      });

      if (error) throw error;

      const pluggyConnect = window.PluggyConnect.init({
        connectToken: data.connectToken,
        onSuccess: (data) => {
          console.log("Pluggy connection successful:", data);
          onSuccess(
            data.item.id,
            data.item.connector.name,
            data.item.connector.imageUrl
          );
        },
        onError: (error) => {
          console.error("Pluggy connection error:", error);
          toast.error("Erro ao conectar conta bancária");
        },
        onClose: () => {
          console.log("Pluggy widget closed");
        },
      });

      pluggyConnect.open();
    } catch (error) {
      console.error("Error creating connect token:", error);
      toast.error("Erro ao iniciar conexão bancária");
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
