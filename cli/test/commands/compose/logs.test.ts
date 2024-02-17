import { expect, test } from "@oclif/test";
import { wait } from "../../helpers.js";

describe("compose:logs", async () => {
  test
    .command(["compose:up"])
    .stderr()
    .it(
      "runs compose:logs with a container name argument",
      async (ctx, done) => {
        ctx.config.runCommand("compose:logs", ["actions"]);
        await wait(1000);

        expect(ctx.stderr).to.contain("actions");

        done();
      },
    );

  test
    .command(["compose:up"])
    .stderr()
    .it("runs compose:logs without arguments", async (ctx, done) => {
      ctx.config.runCommand("compose:logs");
      await wait(1000);

      expect(ctx.stderr).to.match(/hasura|actions|postgres|cubejs|redis/);

      done();
    });
});
