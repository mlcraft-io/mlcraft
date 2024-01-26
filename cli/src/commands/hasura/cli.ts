import {Args, Flags} from "@oclif/core";
import {URL} from "node:url";

import BaseCommand from "../../BaseCommand.js";
import { callSystem } from "../../utils.js";

export default class Hasura extends BaseCommand {
  static args = {
    ...BaseCommand.args,
    cmd: Args.string({
      description: "Command, what will provided to Hasura",
      required: true,
    })
  };

  static description = "Manage Hasura service";

  static flags = {
    ...BaseCommand.flags,
    adminSecret: Flags.string({env: "HASURA_GRAPHQL_ADMIN_SECRET"}),
    hasuraAddr: Flags.string({default: "http://hasura:8080"}),
    hasuraDir: Flags.string({default: "./services/hasura"}),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Hasura);
    const parsedUrl = new URL(flags.hasuraAddr);

    const endpoint = `${parsedUrl.hostname}:${parsedUrl.port}`;
    const argsStr = `--endpoint http://${endpoint} --admin-secret ${flags.adminSecret}`;

    await callSystem("docker build -t hasura_cli ./scripts/containers/hasura-cli");

    const cliCmd = `hasura-cli ${args.cmd} ${argsStr}`;

    await callSystem(`docker run --rm --name hasura-cli-tool -v ${flags.hasuraDir}:/config -v ${flags.hasuraDir}/migrations:/migrations -v ${flags.hasuraDir}/metadata:/metadata -v ${flags.hasuraDir}/seeds:/seeds hasura_cli sh -c "${cliCmd}"`);
  }
}