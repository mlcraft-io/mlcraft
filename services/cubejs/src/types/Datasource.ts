export type Datasource = {
  id: string;
  db_type: string;
  db_params: Object;
  dataschemas: any[];
  branches?: any[];
  team_id?: string | undefined;
}