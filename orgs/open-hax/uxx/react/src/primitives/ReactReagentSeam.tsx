/**
 * ReactReagentSeam Component
 *
 * Implements the react-reagent-seam.edn contract.
 * An adapter pattern for embedding components inside a host application,
 * enabling bidirectional state sharing and event communication.
 *
 * In pure React contexts, this provides the seam pattern without Reagent.
 * For Reagent interop, use the Reagent version which provides the full adapter.
 */

import { type ReactNode, useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { tokens } from '@open-hax/uxx/tokens';

// Types derived from contract
export interface Adapter {
  /** Ready state: 'ready' or 'booting' */
  readyState: string;
  /** Host count value */
  hostCount: number;
  /** Event count value */
  eventCount: number;
  /** Increment host count */
  incrementHostCount: () => void;
  /** Emit donor event */
  emitDonorEvent: () => void;
}

export interface ReactReagentSeamProps {
  /** Initial host state */
  initialState?: {
    hostCount?: number;
    eventCount?: number;
  };
  /** Function that renders the donor component(s) */
  renderDonor: (adapter: Adapter) => ReactNode;
  /** Function that renders the host component(s) */
  renderHost: (adapter: Adapter) => ReactNode;
  /** CSS class for scoping styles */
  scopeClass?: string;
  /** Callback when seam is mounted */
  onMount?: () => void;
  /** Callback when seam is unmounted */
  onUnmount?: () => void;
}

// Context for nested components to access adapter
const AdapterContext = createContext<Adapter | null>(null);

/**
 * Hook to access the adapter from nested components.
 */
export function useAdapter(): Adapter | null {
  return useContext(AdapterContext);
}

/**
 * Generate scoped CSS for the seam container.
 */
function getScopeStyles(scopeClass: string): string {
  return `
.${scopeClass} {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(260px, 1fr);
  gap: ${tokens.spacing[4]}px;
  padding: ${tokens.spacing[4]}px;
  background: ${tokens.colors.background.elevated};
  min-height: 100%;
  color: ${tokens.colors.text.default};
  font-family: ${tokens.fontFamily.sans};
}
.${scopeClass} * {
  box-sizing: border-box;
}
.${scopeClass} .host-panel,
.${scopeClass} .donor-panel {
  border: 1px solid ${tokens.colors.border.default};
  border-radius: ${tokens.spacing[1]}px;
  padding: ${tokens.spacing[3]}px;
  background: ${tokens.colors.background.surface};
}
.${scopeClass} h2,
.${scopeClass} h3 {
  margin: 0 0 ${tokens.spacing[2]}px 0;
}
.${scopeClass} p {
  margin: ${tokens.spacing[1]}px 0;
  color: ${tokens.colors.text.secondary};
}
.${scopeClass} button {
  margin-top: ${tokens.spacing[2]}px;
  background: ${tokens.colors.accent.cyan};
  color: ${tokens.colors.background.default};
  border: 0;
  border-radius: ${tokens.spacing[0.5]}px;
  padding: ${tokens.spacing[2]}px ${tokens.spacing[3]}px;
  cursor: pointer;
  font-size: ${tokens.typography.bodySm.fontSize};
}
.${scopeClass} button:hover {
  opacity: 0.9;
}
.${scopeClass} .status {
  display: inline-block;
  padding: ${tokens.spacing[1]}px ${tokens.spacing[2]}px;
  border-radius: ${tokens.spacing[0.5]}px;
  background: ${tokens.colors.alpha.green._25};
  color: ${tokens.colors.accent.green};
  font-size: ${tokens.typography.bodySm.fontSize};
}
.${scopeClass} strong {
  color: ${tokens.colors.text.default};
}
`;
}

/**
 * Adapter seam for embedding components with shared state.
 *
 * @example
 * ```tsx
 * <ReactReagentSeam
 *   initialState={{ hostCount: 0, eventCount: 0 }}
 *   renderHost={(adapter) => (
 *     <div className="host-panel">
 *       <h2>Host Panel</h2>
 *       <p>Ready: <span className="status">{adapter.readyState}</span></p>
 *       <p>Count: <strong>{adapter.hostCount}</strong></p>
 *       <button onClick={adapter.incrementHostCount}>Increment</button>
 *     </div>
 *   )}
 *   renderDonor={(adapter) => (
 *     <div className="donor-panel">
 *       <h3>Donor Panel</h3>
 *       <p>Events: <strong>{adapter.eventCount}</strong></p>
 *       <button onClick={adapter.emitDonorEvent}>Emit Event</button>
 *     </div>
 *   )}
 * />
 * ```
 */
export function ReactReagentSeam({
  initialState = {},
  renderDonor,
  renderHost,
  scopeClass = 'react-host-seam-scope',
  onMount,
  onUnmount,
}: ReactReagentSeamProps) {
  const [mounted, setMounted] = useState(false);
  const [hostCount, setHostCount] = useState(initialState.hostCount ?? 0);
  const [eventCount, setEventCount] = useState(initialState.eventCount ?? 0);

  // Lifecycle
  useEffect(() => {
    setMounted(true);
    onMount?.();
    return () => {
      setMounted(false);
      onUnmount?.();
    };
  }, [onMount, onUnmount]);

  // Adapter callbacks
  const incrementHostCount = useCallback(() => {
    setHostCount((c) => c + 1);
  }, []);

  const emitDonorEvent = useCallback(() => {
    setEventCount((c) => c + 1);
  }, []);

  // Build adapter object
  const adapter: Adapter = useMemo(
    () => ({
      readyState: mounted ? 'ready' : 'booting',
      hostCount,
      eventCount,
      incrementHostCount,
      emitDonorEvent,
    }),
    [mounted, hostCount, eventCount, incrementHostCount, emitDonorEvent]
  );

  return (
    <AdapterContext.Provider value={adapter}>
      <section
        data-component="react-reagent-seam"
        data-host-ready={adapter.readyState}
        role="region"
        aria-label="Hybrid React/Reagent container"
        className={scopeClass}
      >
        {/* Inject scoped styles */}
        <style>{getScopeStyles(scopeClass)}</style>

        {/* Host panel */}
        <article className="host-panel" data-testid="host-panel">
          {renderHost(adapter)}
        </article>

        {/* Donor panel */}
        <article className="donor-panel" data-testid="donor-panel">
          {renderDonor(adapter)}
        </article>
      </section>
    </AdapterContext.Provider>
  );
}

export default ReactReagentSeam;
