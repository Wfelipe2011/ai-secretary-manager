import { CreateEventTool } from "../tools/CreateEventTool";

describe("CreateEventTool", () => {
  let tool: CreateEventTool;
  let mockPrisma: { schedule: { create: jest.Mock } };

  beforeEach(() => {
    // Cria mock do PrismaService apenas com schedule.create
    mockPrisma = { schedule: { create: jest.fn() } };
    tool = new CreateEventTool(mockPrisma as any);
  });

  test("deve retornar mensagem de sucesso quando o evento é criado", async () => {
    // Simula sucesso na criação
    mockPrisma.schedule.create.mockResolvedValue({ id: 1, title: "Test", start: new Date(), end: new Date() });

    const response = await tool._call({
      title: "Reunião de equipe",
      start: "2025-05-20T09:00:00.000Z",
      end: "2025-05-20T10:00:00.000Z",
    });

    expect(mockPrisma.schedule.create).toHaveBeenCalledWith({
      data: {
        title: "Reunião de equipe",
        start: new Date("2025-05-20T09:00:00.000Z"),
        end: new Date("2025-05-20T10:00:00.000Z"),
      },
    });

    const result = JSON.parse(response);
    expect(result).toEqual({ success: true, message: "Evento criado com sucesso." });
  });

  test("deve retornar mensagem de erro quando o Prisma lança uma exceção", async () => {
    // Simula erro no Prisma
    mockPrisma.schedule.create.mockRejectedValue(new Error("DB failure"));

    const response = await tool._call({
      title: "Falha Teste",
      start: "2025-06-01T12:00:00.000Z",
      end: "2025-06-01T13:00:00.000Z",
    });

    expect(mockPrisma.schedule.create).toHaveBeenCalled();
    const result = JSON.parse(response);
    expect(result).toEqual({ success: false, message: "DB failure" });
  });

  test("deve ter o nome e a descrição corretos", () => {
    expect(tool.name).toBe("create_event_tool");
    expect(tool.description).toContain("Creates a calendar event");
  });
});
