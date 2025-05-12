
import { Annotation, MemorySaver, MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ServiceAgent } from "./ServiceAgent";
import { ThinkingAgent } from "./ThinkingAgent";
import { ActionType } from "src/enums/ActionType";
import { CreateEventAgent } from "./CreateEventAgent";
import { ThankAgent } from "./ThankAgent";
import { FeedbackAgent } from "./FeedbackAgent";

const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  action: Annotation<ActionType>,
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
    "AGRADECIMENTO": "thank_agent",
    "RESPONDER": "feedback_agent",
  };

  return transitionMap[state.action] || "__end__";
}

const builder = new StateGraph(StateAnnotation)
  .addNode("thinking_agent", ThinkingAgent)
  .addNode("service_agent", ServiceAgent)
  .addNode("create_event_agent", CreateEventAgent)
  .addNode("thank_agent", ThankAgent)
  .addNode("feedback_agent",FeedbackAgent)
  .addConditionalEdges(
    "thinking_agent",
    resolveNextNodeAfterThinking,
    {
      service_agent: "service_agent",
      create_event_agent: "create_event_agent",
      thank_agent: "thank_agent",
      feedback_agent: "feedback_agent",
      __end__: "__end__",
    }
  )
  .addEdge("__start__", "thinking_agent")
  .addEdge("create_event_agent", "feedback_agent")
  .addEdge("service_agent", "__end__")
  .addEdge("thank_agent", "__end__")
  .addEdge("feedback_agent", "__end__")

console.log("Adicionadas transições!");

const graph = builder.compile({ checkpointer });

export {
  graph,
  StateAnnotation,
}