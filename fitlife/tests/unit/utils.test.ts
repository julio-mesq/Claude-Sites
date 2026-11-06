import { describe, expect, it } from "vitest";
import { addDaysKey, dateKey, formatDuration, initials, keyToDate, weekStartKey, zonedStartOfDay } from "@/lib/utils";

describe("datas", () => {
  it("dateKey respeita o fuso", () => {
    const d = new Date("2026-11-06T02:30:00Z");
    expect(dateKey(d, "America/Sao_Paulo")).toBe("2026-11-05");
    expect(dateKey(d, "UTC")).toBe("2026-11-06");
  });
  it("aritmética de chaves", () => {
    expect(addDaysKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysKey("2024-03-01", -1)).toBe("2024-02-29");
    expect(keyToDate("2026-11-06").toISOString()).toBe("2026-11-06T00:00:00.000Z");
  });
  it("início da semana é segunda-feira", () => {
    expect(weekStartKey("2026-11-06")).toBe("2026-11-02");
    expect(weekStartKey("2026-11-08")).toBe("2026-11-02");
    expect(weekStartKey("2026-11-02")).toBe("2026-11-02");
  });
  it("meia-noite local em UTC", () => {
    expect(zonedStartOfDay("2026-11-06", "America/Sao_Paulo").toISOString()).toBe("2026-11-06T03:00:00.000Z");
    expect(zonedStartOfDay("2026-11-06", "UTC").toISOString()).toBe("2026-11-06T00:00:00.000Z");
  });
});

describe("formatação", () => {
  it("duração", () => {
    expect(formatDuration(65)).toBe("01:05");
    expect(formatDuration(3725)).toBe("1h 02min");
  });
  it("iniciais", () => {
    expect(initials("ana maria souza")).toBe("AM");
    expect(initials("Zé")).toBe("Z");
  });
});
