import buildSecurityContext from "./buildSecurityContext";

export const getDataSourceAccessList = (
  allMembers: any[],
  selectedDataSourceId: string | number,
  selectedTeamId: any
) => {
  const dataSourceMemberRole = allMembers.find(
    (member) => member.team_id === selectedTeamId
  )?.member_roles?.[0];

  if (!dataSourceMemberRole) {
    throw new Error(`403: member role not found`);
  }

  const { access_list: accessList } = dataSourceMemberRole;
  const dataSourceAccessList =
    accessList?.config?.datasources?.[selectedDataSourceId]?.cubes;

  return {
    role: dataSourceMemberRole?.team_role,
    dataSourceAccessList,
  };
};

const defineUserScope = (
  allDataSources: any[],
  allMembers: any,
  selectedDataSourceId: any,
  selectedBranchId?: string | undefined,
  selectedVersionId?: string | undefined
) => {
  const dataSource = allDataSources.find(
    (source: any) => source.id === selectedDataSourceId
  );

  if (!dataSource) {
    throw new Error(`404: source "${selectedDataSourceId}" not found`);
  }

  let selectedBranch;
  let selectedVersion;

  if (selectedBranchId) {
    const branch = dataSource.branches.find(
      (branch: any) => branch.id === selectedBranchId
    );

    if (!branch) {
      throw new Error(`404: branch "${selectedBranchId}" not found`);
    }

    selectedBranch = branch;
  } else {
    const defaultBranch = dataSource.branches.find(
      (branch: any) => branch.status === "active"
    );

    if (!defaultBranch) {
      throw new Error(`400: default branch not found`);
    }

    selectedBranch = defaultBranch;
  }

  if (selectedVersionId) {
    const version = selectedBranch.versions.find(
      (version: any) => version.id === selectedVersionId
    );

    if (!version) {
      throw new Error(`404: version "${selectedVersionId}" not found`);
    }

    selectedVersion = version;
  }

  const dataSourceAccessList = getDataSourceAccessList(
    allMembers,
    selectedDataSourceId,
    dataSource.team_id
  );

  const dataSourceContext = buildSecurityContext(
    dataSource,
    selectedBranch,
    selectedVersion
  );

  return {
    dataSource: dataSourceContext,
    ...dataSourceAccessList,
  };
};

export default defineUserScope;
