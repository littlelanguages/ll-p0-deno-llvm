import * as Assert from "https://deno.land/std@0.76.0/testing/asserts.ts";
import { greeting } from "./mod.ts";

Deno.test("Greeter", () => {
  Assert.assertEquals(greeting("World"), "Hello World");
});
