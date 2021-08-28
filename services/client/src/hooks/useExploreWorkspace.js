import { useMemo, useCallback, useEffect } from 'react';

import { getOr } from 'unchanged';
import { useSetState } from 'ahooks';

import useCollapse from 'hooks/useCollapse';

const FILTERS_SEC = 'filtersSec';
const DATA_SEC = 'dataSec';
const MODEL_SEC = 'modelingSec';
const VIS_SEC = 'visSec';
const ENRICHMENT_SEC = 'enrichmentSec';

const defaultSections = [
  FILTERS_SEC,
  DATA_SEC,
  MODEL_SEC,
];

export default ({ selectedQueryMembers }) => {
  const { 
    state: collapseState,
    setActiveKeys,
    getSectionIndex,
    onToggleSection 
  } = useCollapse([]);

  const [state, updateState] = useSetState({
    modelingSection: 'modelDefinition',
    dataSection: 'results',
    filtersCount: 0,
    experimentsCount: 0,
  });

  const filtersCount = useMemo(() => getOr([], 'filters', selectedQueryMembers).length, [selectedQueryMembers]);

  useEffect(
    () => {
      if (!collapseState.activePanelKey.length) {
        const activePanelKey = state.filtersCount > 0 && defaultSections || [DATA_SEC, MODEL_SEC, VIS_SEC, ENRICHMENT_SEC];

        setActiveKeys(activePanelKey);
      }
    }
  );

  useEffect(
    () => updateState(prev => {
      const { filtersCount: prevFiltersCount } = prev;

      if (prevFiltersCount !== filtersCount) {
        const pos = getSectionIndex(FILTERS_SEC);
        if (pos === -1 && filtersCount > 0) {
          onToggleSection(FILTERS_SEC);
        }

        if (pos > -1 && filtersCount === 0 && prevFiltersCount > 0) {
          onToggleSection(FILTERS_SEC);
        }

        return {
          ...prev,
          filtersCount,
        };
      }

      return prev;
    }),
    [filtersCount, getSectionIndex, onToggleSection, updateState]
  );

  const onDataSectionChange = useCallback(e => {
    const { value } = e.target;

    updateState({ dataSection: value });
  },
  [updateState]
  );

  const onModelingSectionChange = useCallback(e => {
    const { value } = e.target;

    updateState({ modelingSection: value });
  },
  [updateState]
  );

  const incExperimentsCnt = useCallback(() => {
    updateState(prev => ({ ...prev, experimentsCount: (prev.experimentsCount || 0) + 1 }));
  },
  [updateState]
  );

  return {
    collapseState,
    state,
    updateState,
    incExperimentsCnt,
    onToggleSection,
    onDataSectionChange,
    onModelingSectionChange,
  };
};
