import { describe, expect, it } from "vitest";
import { documentSchema, commentSchema } from "@/lib/validation";

describe("documentSchema", () => {
  it("accepts a valid document", () => {
    const result = documentSchema.safeParse({
      title: "A valid title",
      body: "A body that is definitely long enough.",
      tags: ["engineering", "planning"],
      visibility: "TEAM",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a title under 3 characters", () => {
    const result = documentSchema.safeParse({
      title: "ab",
      body: "A body that is definitely long enough.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a title over 120 characters", () => {
    const result = documentSchema.safeParse({
      title: "a".repeat(121),
      body: "A body that is definitely long enough.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a body under 10 characters", () => {
    const result = documentSchema.safeParse({ title: "Valid title", body: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects more than 5 tags", () => {
    const result = documentSchema.safeParse({
      title: "Valid title",
      body: "A body that is definitely long enough.",
      tags: ["a", "b", "c", "d", "e", "f"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a tag with invalid characters", () => {
    const result = documentSchema.safeParse({
      title: "Valid title",
      body: "A body that is definitely long enough.",
      tags: ["Not Valid!"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unrecognized visibility value", () => {
    const result = documentSchema.safeParse({
      title: "Valid title",
      body: "A body that is definitely long enough.",
      visibility: "SECRET",
    });
    expect(result.success).toBe(false);
  });
});

describe("commentSchema", () => {
  it("accepts a body up to 2000 characters", () => {
    const result = commentSchema.safeParse({ body: "a".repeat(2000) });
    expect(result.success).toBe(true);
  });

  it("rejects a body over 2000 characters", () => {
    const result = commentSchema.safeParse({ body: "a".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("rejects an empty body", () => {
    const result = commentSchema.safeParse({ body: "" });
    expect(result.success).toBe(false);
  });
});
