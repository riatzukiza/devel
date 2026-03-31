import { describe, expect, test } from "bun:test";
import { slugify, stripHtmlToText } from "../text";

describe("resume-apply/text", () => {
  test("slugify", () => {
    expect(slugify("Costanoa / Ichi")).toBe("costanoa-ichi");
    expect(slugify("  Staff / Senior Full-Stack  ")).toBe("staff-senior-full-stack");
  });

  test("stripHtmlToText removes tags", () => {
    const text = stripHtmlToText("<html><body><h1>Hello</h1><p>World</p></body></html>");
    expect(text.includes("<h1>")).toBe(false);
    expect(text.includes("Hello")).toBe(true);
    expect(text.includes("World")).toBe(true);
  });
});
