import { ScheduleCreateTool } from "./tools/ScheduleCreateTool";

void (async () => {
    // title, start, end, userPhone, serviceId
    console.log(await ScheduleCreateTool.invoke({
        title: "Teste",
        start: "2023-10-01T10:00:00Z",
        userPhone: "15981785706",
        serviceId: 2,
    }))
})();