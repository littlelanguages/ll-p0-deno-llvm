import * as Path from "./deps/path.ts";
import { translate } from "./dynamic/translate.ts";
import * as Tools from "./compiler/llvm/tools.ts";
import { IExecResponse } from "./deps/exec.ts";
import { compile } from "./compiler/compiler.ts";

if (Deno.args.length === 0) {
  console.log("Error: no files specificed");
}

const fileDateTime = (name: string): number => {
  try {
    return Deno.lstatSync(name)?.mtime?.getTime() || 0;
  } catch (_) {
    return 0;
  }
};

const setExtension = (
  pattern: Path.ParsedPath,
  extension: string,
): Path.ParsedPath => {
  const result = Object.assign({}, pattern);

  result.ext = extension;
  result.base = result.name + result.ext;

  return result;
};

const formatExtension = (
  pattern: Path.ParsedPath,
  extension: string,
): string => Path.format(setExtension(pattern, extension));

const run = (cmdResult: Promise<IExecResponse>): Promise<IExecResponse> =>
  cmdResult.then((r) =>
    (r.status.code === 0) ? Promise.resolve(r) : Promise.reject(r)
  );

for (let f of Deno.args) {
  const base = setExtension(Path.parse(f), "");

  const sourcename = formatExtension(base, ".p0");
  const targetname = Path.format(base);

  console.log(
    `${sourcename}: ${fileDateTime(sourcename)}  ${targetname}: ${
      fileDateTime(targetname)
    }`,
  );

  const targetnameDateTime = fileDateTime(targetname);
  if (
    targetnameDateTime === 0 || fileDateTime(sourcename) < targetnameDateTime
  ) {
    console.log(`Compiling ${sourcename}`);
    await Deno.readTextFile(sourcename)
      .then((input) =>
        translate(input)
          .either(
            (e) => {
              console.log(`>>>>>>>>>>>>>> ${JSON.stringify(e, null, 2)}`);
              return Promise.reject(e);
            },
            (tst) => {
              try {
                return Tools.write(
                  compile(tst, sourcename),
                  formatExtension(base, ".ll"),
                );
              } catch (e) {
                console.log(`>>>>>>>>>>>>>> ${e}`);
                return Promise.reject(e);
              }
            },
          )
          .then(() =>
            run(
              Tools.assemble(
                formatExtension(base, ".ll"),
                formatExtension(base, ".o"),
              ),
            )
          )
          .then(() =>
            run(
              Tools.link(
                [formatExtension(base, ".o"), "./tests/p0lib.o"],
                formatExtension(base, ".bc"),
              ),
            )
          ).catch((e) => console.log(e))
      );
  }
}
