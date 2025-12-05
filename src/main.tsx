/**
 * ================================================
 * ARQUIVO PRINCIPAL DE ENTRADA DA APLICAÇÃO
 * ================================================
 * 
 * Este é o ponto de entrada da aplicação React.
 * Responsável por:
 * - Importar o componente principal App
 * - Importar os estilos globais (index.css)
 * - Montar a aplicação no elemento DOM com id "root"
 * 
 * O React 18 usa createRoot ao invés de ReactDOM.render
 * para habilitar o modo concorrente (Concurrent Mode)
 */

// Importa a função createRoot do React DOM para renderização
import { createRoot } from "react-dom/client";

// Importa o componente raiz da aplicação
import App from "./App.tsx";

// Importa os estilos globais (Tailwind CSS e estilos customizados)
import "./index.css";

/**
 * Cria a raiz do React e renderiza o componente App
 * 
 * document.getElementById("root")! - Obtém o elemento HTML onde a aplicação será montada
 * O "!" é uma asserção TypeScript indicando que o elemento não será null
 * 
 * .render(<App />) - Renderiza o componente App dentro do elemento root
 */
createRoot(document.getElementById("root")!).render(<App />);
