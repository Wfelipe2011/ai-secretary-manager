import { Injectable, OnModuleInit } from '@nestjs/common';
import { CompiledStateGraph, MemorySaver, StateDefinition, StateGraph, StateType } from "@langchain/langgraph";
import { StateAnnotation } from './graph-state-annotation';

@Injectable()
export class GraphService implements OnModuleInit {
    graph: CompiledStateGraph<StateType<StateDefinition>, any>;
    private readonly checkpointer = new MemorySaver();

    constructor() { }

    onModuleInit() {
        const builder = new StateGraph(StateAnnotation);
        this.graph = builder.compile({ checkpointer: this.checkpointer });
    }
}