import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth";

describe("password hashing", () => {
  it("verifies a correct password against its own hash", async () => {
    const hash = await hashPassword("Demo1234!");
    await expect(verifyPassword("Demo1234!", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password against an unrelated hash", async () => {
    const hash = await hashPassword("Demo1234!");
    await expect(verifyPassword("WrongPassword!", hash)).resolves.toBe(false);
  });

  it("produces a different hash each time (salted)", async () => {
    const [h1, h2] = await Promise.all([hashPassword("Demo1234!"), hashPassword("Demo1234!")]);
    expect(h1).not.toBe(h2);
  });
});
