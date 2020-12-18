import * as Assert from "./deps/asserts.ts";
import { greeting } from "./mod.ts";

Deno.test("Greeter", () => {
  Assert.assertEquals(greeting("World"), "Hello World");
});
