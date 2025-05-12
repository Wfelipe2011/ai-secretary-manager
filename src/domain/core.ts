
import { Annotation, MemorySaver, MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ServiceAgent } from "./ServiceAgent";
import { ThinkingAgent } from "./ThinkingAgent";
import { ActionType } from "src/enums/ActionType";
import { CreateEventAgent } from "./CreateEventAgent";

const StateAnnotation = Annotation.Root({
  // Herda as especificações de mensagens
  ...MessagesAnnotation.spec,
  // Campos adicionais específicos para o fluxo
  // Próximo nó a ser chamado
  action: Annotation<ActionType>,
  // Entrada para o nó atual
  input: Annotation<string>,
});

const checkpointer = new MemorySaver();

function resolveNextNodeAfterThinking(state: typeof StateAnnotation.State): string {
  console.log("Processando transição condicional:", state.action);

  const transitionMap: Record<ActionType, string> = {
    "ATENDIMENTO": "service_agent",
    "CRIAR_AGENDAMENTO": "create_event_agent",
    "CONSULTAR_AGENDAMENTOS": "search_event_agent",
    "CANCELAR_AGENDAMENTO": "cancel_event_agent",
    "RESPONDER": "__end__",
  };

  return transitionMap[state.action] || "__end__";
}

const builder = new StateGraph(StateAnnotation)
  // Adiciona os nós ao grafo 
  .addNode("thinking_agent", ThinkingAgent)
  .addNode("service_agent", ServiceAgent)
  .addNode("create_event_agent", CreateEventAgent)
  // Adicionar condicional para o nó de categorização 
  .addConditionalEdges(
    "thinking_agent",
    resolveNextNodeAfterThinking,
    {
      service_agent: "service_agent",
      create_event_agent: "create_event_agent",
      __end__: "__end__",
    }
  )
  .addEdge("__start__", "thinking_agent")
  .addEdge("create_event_agent", "__end__")
  .addEdge("service_agent", "__end__")

console.log("Adicionadas transições!");

const graph = builder.compile({ checkpointer });

export {
  graph,
  StateAnnotation,
}