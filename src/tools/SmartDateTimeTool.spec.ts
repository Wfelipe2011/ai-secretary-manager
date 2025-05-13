import { SmartDateTimeTool } from "./SmartDateTimeTool";

describe('SmartDateTimeTool', () => {
  const tool = new SmartDateTimeTool();

  test('retorna null para texto sem datas', async () => {
    const res = await tool._call({ text: 'no date here' }); // Texto sem data
    const parsed = JSON.parse(res);
    expect(parsed.date).toBeNull();
    expect(parsed.originalText).toBe('no date here');
  });

  test('analisa uma data simples', async () => {
    const res = await tool._call({ text: 'March 3, 2025 at 5pm' }); // Março 3, 2025 às 17h
    const parsed = JSON.parse(res);
    expect(parsed.date).toMatch("2025-03-03T17:00:00-03:00");
    expect(parsed.parsedText.toLowerCase()).toContain('march 3, 2025');
  });

  test('analisa uma data relativa no futuro', async () => {
    const res = await tool._call({ text: 'next friday morning' }); // Próxima sexta-feira de manhã
    const parsed = JSON.parse(res);
    expect(parsed.date).toMatch("2025-05-23T06:00:00-03:00");
    expect(parsed.parsedText.toLowerCase()).toContain('next friday');
  });

  test('analisa datas específicas com horário', async () => {
    const res = await tool._call({ text: 'December 25, 2025 at 8:30am' }); // 25 de dezembro de 2025 às 8h30
    const parsed = JSON.parse(res);
    expect(parsed.date).toMatch("2025-12-25T08:30:00-03:00");
    expect(parsed.parsedText.toLowerCase()).toContain('december 25, 2025');
  });

  test('analisa datas relativas como "próxima semana"', async () => {
    const res = await tool._call({ text: 'next week on Monday' }); // Próxima semana na segunda-feira
    const parsed = JSON.parse(res);
    expect(parsed.parsedText.toLowerCase()).toContain('next week');
    expect(new Date(parsed.date).getDay()).toBe(1); // Segunda-feira
  });

  test('analisa datas ambíguas e resolve para o futuro', async () => {
    const res = await tool._call({ text: 'March 1st' }); // 1º de março
    const parsed = JSON.parse(res);
    const now = new Date();
    const parsedDate = new Date(parsed.date);
    expect(parsedDate.getFullYear()).toBeGreaterThanOrEqual(now.getFullYear());
    expect(parsed.parsedText.toLowerCase()).toContain('march 1st');
  });

  test('retorna null para texto de data inválido', async () => {
    const res = await tool._call({ text: 'random gibberish text' }); // Texto sem data
    const parsed = JSON.parse(res);
    expect(parsed.date).toBeNull();
    expect(parsed.originalText).toBe('random gibberish text');
  });

  test('analisa datas com fusos horários explícitos', async () => {
    const res = await tool._call({ text: 'June 15, 2024 at 3pm UTC' });
    const parsed = JSON.parse(res);
    expect(parsed.date).toMatch("2024-06-15T12:00:00-03:00"); // Ajustado para o fuso horário America/Sao_Paulo
    expect(parsed.parsedText.toLowerCase()).toContain('june 15, 2024');
  });

  test('analisa datas com frases relativas como "em dois dias"', async () => {
    const res = await tool._call({ text: 'in two days at noon' }); // Em dois dias ao meio-dia
    const parsed = JSON.parse(res);
    const now = new Date();
    const parsedDate = new Date(parsed.date);
    const diffInDays = Math.round((parsedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffInDays).toBe(2);
    expect(parsed.parsedText.toLowerCase()).toContain('in two days');
  });

  test('analisa datas com formatos mistos', async () => {
    const res = await tool._call({ text: '5pm on 07/04/2025' }); // 17h em 07/04/2025
    const parsed = JSON.parse(res);
    expect(parsed.date).toMatch("2025-07-04T17:00:00-03:00");
    expect(parsed.parsedText.toLowerCase()).toContain('07/04/2025');
  });
});
