import { ChatDeepSeek } from "@langchain/deepseek"
import { Logger } from "@nestjs/common"
import { AgentExecutor } from "langchain/agents"
import { StructuredTool } from "langchain/tools"
import { StateAnnotation } from "../graph/graph-state-annotation"

export interface IAgent {
    name: string
    logger: Logger
    model: ChatDeepSeek
    tools: Array<StructuredTool>
    executor: AgentExecutor
    systemPrompt: string
    invoke: (state: typeof StateAnnotation.State) => Promise<typeof StateAnnotation.State>
}