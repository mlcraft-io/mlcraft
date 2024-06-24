import { Response } from "express";
import { ScaffoldingTemplate } from "@cubejs-backend/schema-compiler";

import {
  createDataSchema,
  findDataSchemas,
} from "../utils/dataSourceHelpers";
import createMd5Hex from "../utils/md5Hex";

import { ExtendedRequest } from "../types/ExtendedRequest";

type TableName = string | [string, string];

interface NormalizedTables {
  tables: TableName[];
  schema: { main?: any; ""?: any; };
}

const filterFiles = (mainFiles: any[], addFiles: any[]) => {
  const fileNames = mainFiles.map((f: { fileName: any; }) => f.fileName);
  return [
    ...mainFiles,
    ...addFiles.filter((f: { fileName: any; }) => !fileNames.includes(f.fileName)),
  ];
};

const normalizeTables = (schema: { main?: any; ""?: any; }, tables: any[], dbType: string): NormalizedTables => {
  let normalizedTables = tables.map((table: { name: string; }) => table?.name?.replace("/", "."));

  if (dbType === "questdb") {
    const questdbNormalizedTables = tables.map((table: { name: string; }) => [
      "",
      table?.name?.replace("/", ""),
    ]).flat();

    return {
      tables: questdbNormalizedTables,
      schema,
    };
  }

  if (dbType === "elasticsearch") {
    schema = { "": schema.main };
    const elasticsearchNormalizedTables = normalizedTables.map((table: string) => [
      "",
      table?.replace("main.", ""),
    ]).flat();

    return {
      tables: elasticsearchNormalizedTables,
      schema,
    };
  }

  if (dbType === "dremio") {
    const dremioNormalizedTables = tables.map((table: { name: string; }) => {
      const parts = table?.name?.split(".");
      return [parts.slice(0, -1).join("."), parts[parts.length - 1]];
    }).flat();

    return {
      tables: dremioNormalizedTables,
      schema,
    };
  }

  if (dbType === "ksql") {
    const ksqlNormalizedTables = tables.map((table: { name: string; }) => [
      "",
      table?.name?.replace(".", ""),
    ]).flat();

    return {
      tables: ksqlNormalizedTables,
      schema,
    };
  }

  return {
    tables: normalizedTables,
    schema,
  };
};

export default async (req: ExtendedRequest, res: Response, cubejs: { options: { driverFactory: (arg0: { securityContext: { authToken: string; userId: string | undefined; userScope: any; }; }) => any; }; compilerCache: { prune: () => void; }; }) => {
  const { securityContext } = req;
  const { userScope, userId, authToken } = securityContext;
  const { dataSourceId, dbType } = userScope.dataSource;

  const driver = await cubejs.options.driverFactory({ securityContext });

  try {
    let schema = await driver.tablesSchema();
    const {
      tables = [],
      overwrite = false,
      branchId,
      format = "yaml",
    } = req.body || {};

    const { tables: normalizedTables, schema: normalizedSchema } =
      normalizeTables(schema, tables, dbType);

    const scaffoldingTemplate = new ScaffoldingTemplate(
      normalizedSchema,
      driver,
      {
        format,
      }
    );

    const newFiles =
      scaffoldingTemplate.generateFilesByTableNames(normalizedTables);

    if (!newFiles.length) {
      return res.status(400).json({
        code: "generate_schema_no_new_files",
        message: "No new files created",
      });
    }

    const dataSchemas = await findDataSchemas({
      branchId,
      authToken,
    });

    const existedFiles = dataSchemas.map((row: { name: any; code: any; }) => ({
      fileName: row.name,
      content: row.code,
    }));

    let files;
    if (overwrite) {
      files = filterFiles(newFiles, existedFiles);
    } else {
      files = filterFiles(existedFiles, newFiles);
    }

    let commitChecksum = files.reduce((acc, cur) => acc + cur.code, "");
    commitChecksum = createMd5Hex(commitChecksum);

    const preparedSchemas = files.map((file) => ({
      name: file.fileName,
      code: file.content,
      user_id: userId,
      datasource_id: dataSourceId,
    }));

    const commitObject = {
      authToken,
      user_id: userId,
      branch_id: branchId,
      checksum: commitChecksum,
      dataschemas: {
        data: [...preparedSchemas],
      },
    };

    await createDataSchema(commitObject);

    if (cubejs.compilerCache) {
      cubejs.compilerCache.prune();
    }

    res.json({ code: "ok", message: "Generation finished" });
  } catch (err: any) {
    console.error(err);

    if (driver.release) {
      await driver.release();
    }

    res.status(500).json({
      code: "generate_schema_error",
      message: err.message || err,
    });
  }
};
