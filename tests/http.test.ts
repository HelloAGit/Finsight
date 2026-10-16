import { describe, expect, it } from "vitest";
import { failure, readBody } from "../src/lib/http";
describe("request boundaries", () => {
  it("accepts the browser destination host despite Next's internal localhost URL", async () => {
    const request = new Request("http://localhost:3000/api/products", {
      method: "POST",
      headers: { Host: "127.0.0.1:3000", Origin: "http://127.0.0.1:3000" },
      body: '{"name":"Product"}',
    });
    expect(await readBody(request)).toEqual({ name: "Product" });
  });
  it("rejects writes from another origin", async () => {
    const request = new Request("http://localhost:3000/api/products", {
      method: "POST",
      headers: { Host: "localhost:3000", Origin: "https://untrusted.example" },
      body: "{}",
    });
    await expect(readBody(request)).rejects.toMatchObject({ status: 403 });
  });
  it("rejects malformed JSON and oversized payloads", async () => {
    await expect(
      readBody(new Request("http://localhost/", { method: "POST", body: "{" })),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      readBody(
        new Request("http://localhost/", {
          method: "POST",
          body: JSON.stringify({ content: "x".repeat(21000) }),
        }),
      ),
    ).rejects.toMatchObject({ status: 413 });
  });
  it("never leaks raw provider exception details", async () => {
    const response = failure(new Error("secret-provider-payload"));
    expect(JSON.stringify(await response.json())).not.toContain(
      "secret-provider-payload",
    );
  });
});
