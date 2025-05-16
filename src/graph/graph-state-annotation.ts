import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { ActionType } from "../enums/ActionType";

export const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  action: Annotation<ActionType>,
  input: Annotation<string>,
  output: Annotation<string>,
});