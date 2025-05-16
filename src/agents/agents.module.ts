import { Module } from '@nestjs/common';
import { ConsultAppointmentsAgent } from './ConsultAppointmentsAgent';


@Module({
    providers: [
        ConsultAppointmentsAgent
    ],
    exports: [
        ConsultAppointmentsAgent
    ],
})
export class AgentsModule { }