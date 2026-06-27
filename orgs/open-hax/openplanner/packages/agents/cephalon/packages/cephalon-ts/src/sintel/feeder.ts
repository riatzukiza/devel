/**
 * Sintel Perception Feeder
 * 
 * Connects the Sintel signal intelligence layer to Cephalon perception.
 * This is the J (perception) layer of the J→C→A loop.
 * 
 * Sintel acts as the sensory apparatus, feeding observations into the
 * Cephalon mind queue for cognitive processing and action.
 */

import {
  BskyDiscovery,
  DNSDiscovery,
  SignalAggregator,
  ExclusionPolicy,
  InMemoryExclusionStore,
  SintelCephalonBridge,
  type BskySignal,
  type CephalonSignal,
  type Observation,
} from '@open-hax/sintel';
import type { CephalonMindQueue } from './integration-queue.js';
import type { UUID } from './types/index.js';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Sintel perception feeder configuration.
 */
export interface SintelFeederConfig {
  /** Cephalon session ID */
  readonly sessionId: UUID;
  /** Cephalon ID within session */
  readonly cephalonId: UUID;
  /** Mind queue to feed signals into */
  readonly mindQueue: CephalonMindQueue;
  /** Circuit index for perception (default C5 = social/perception) */
  readonly circuitIndex?: number;
  /** Minimum confidence to forward (default 0.5) */
  readonly minConfidence?: number;
  /** Maximum signals per tick (default 10) */
  readonly maxSignalsPerTick?: number;
  /** Bluesky firehose options */
  readonly bluesky?: {
    /** Relay endpoint (default: wss://bsky.network) */
    readonly relay?: string;
    /** Record types to track */
    readonly collections?: string[];
    /** DIDs to track (empty = all) */
    readonly dids?: string[];
  };
  /** DNS discovery targets */
  readonly dnsTargets?: string[];
  /** Enable DNS discovery */
  readonly enableDNS?: boolean;
  /** Enable Bluesky firehose */
  readonly enableBluesky?: boolean;
  /** Tick interval for polling (ms) */
  readonly tickIntervalMs?: number;
}

/**
 * Signal categories that map to cephalon attention.
 */
export type PerceptionCategory = 
  | 'infrastructure'   // DNS, TLS, HTTP observations
  | 'social'           // Bluesky, social media signals
  | 'security'         // Vulnerability detections
  | 'anomaly'          // Unusual patterns
  | 'threat';          // Risk indicators

/**
 * Perception event for cephalon consumption.
 */
export interface PerceptionEvent {
  readonly id: UUID;
  readonly category: PerceptionCategory;
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
  readonly summary: string;
  readonly evidence: string;
  readonly confidence: number;
  readonly source: string;
  readonly tags: string[];
  readonly observedAt: string;
  readonly actionable: boolean;
  readonly suggestedAction?: string;
}

// ============================================================================
// Sintel Perception Feeder
// ============================================================================

/**
 * Feeds Sintel perception signals into the Cephalon mind queue.
 * 
 * This is the primary integration point between external signal intelligence
 * and cephalon cognition. Each perception event is formatted and queued
 * for the appropriate circuit.
 */
export class SintelPerceptionFeeder {
  private readonly config: Required<SintelFeederConfig>;
  private readonly bridge: SintelCephalonBridge;
  private readonly exclusionStore: InMemoryExclusionStore;
  private readonly exclusionPolicy: ExclusionPolicy;
  
  private bskyDiscovery: BskyDiscovery | null = null;
  private dnsDiscovery: DNSDiscovery | null = null;
  private aggregator: SignalAggregator | null = null;
  
  private isRunning = false;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  
  constructor(config: SintelFeederConfig) {
    this.config = {
      sessionId: config.sessionId,
      cephalonId: config.cephalonId,
      mindQueue: config.mindQueue,
      circuitIndex: config.circuitIndex ?? 5,
      minConfidence: config.minConfidence ?? 0.5,
      maxSignalsPerTick: config.maxSignalsPerTick ?? 10,
      bluesky: config.bluesky ?? {},
      dnsTargets: config.dnsTargets ?? [],
      enableDNS: config.enableDNS ?? false,
      enableBluesky: config.enableBluesky ?? true,
      tickIntervalMs: config.tickIntervalMs ?? 30000,
    };
    
    this.exclusionStore = new InMemoryExclusionStore();
    this.exclusionPolicy = new ExclusionPolicy(this.exclusionStore);
    
    this.bridge = new SintelCephalonBridge({
      sessionId: this.config.sessionId,
      cephalonId: this.config.cephalonId,
      circuitIndex: this.config.circuitIndex,
      minConfidence: this.config.minConfidence,
      maxSignalsPerTick: this.config.maxSignalsPerTick,
    });
  }
  
  /**
   * Start the perception feeder.
   */
  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    
    console.log(`[SintelFeeder] Starting perception feed for ${this.config.cephalonId}`);
    
    // Start Bluesky firehose if enabled
    if (this.config.enableBluesky) {
      await this.startBluesky();
    }
    
    // Start DNS discovery if enabled
    if (this.config.enableDNS && this.config.dnsTargets.length > 0) {
      await this.startDNS();
    }
    
    // Start tick timer
    this.tickTimer = setInterval(() => this.tick(), this.config.tickIntervalMs);
    
    console.log(`[SintelFeeder] Perception feed active`);
  }
  
  /**
   * Stop the perception feeder.
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;
    
    console.log(`[SintelFeeder] Stopping perception feed`);
    
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    
    if (this.bskyDiscovery) {
      this.bskyDiscovery.stop();
      this.bskyDiscovery = null;
    }
    
    console.log(`[SintelFeeder] Perception feed stopped`);
  }
  
  /**
   * Get pending perception events for cephalon consumption.
   */
  getPendingEvents(): PerceptionEvent[] {
    const stats = this.bridge.getStats();
    console.log(`[SintelFeeder] Buffer: ${stats.bufferSize} signals across ${Object.keys(stats.categories).length} categories`);
    
    return this.bridge.getPendingSignals().map(signal => ({
      id: signal.id as UUID,
      category: signal.category as PerceptionCategory,
      priority: signal.priority,
      summary: signal.summary,
      evidence: signal.evidence,
      confidence: signal.confidence,
      source: signal.source,
      tags: signal.tags,
      observedAt: signal.observedAt,
      actionable: signal.actionable,
      suggestedAction: signal.suggestedAction,
    }));
  }
  
  /**
   * Get buffer statistics.
   */
  getStats(): { bufferSize: number; categories: Record<string, number> } {
    return this.bridge.getStats();
  }
  
  /**
   * Track a specific topic for signal aggregation.
   */
  trackTopic(topic: string): void {
    if (this.bskyDiscovery) {
      this.bskyDiscovery.trackTopic(topic);
    }
  }
  
  // ============================================================================
  // Private Methods
  // ============================================================================
  
  private async startBluesky(): Promise<void> {
    try {
      this.bskyDiscovery = new BskyDiscovery();
      
      await this.bskyDiscovery.start({
        relay: this.config.bluesky.relay,
        collections: this.config.bluesky.collections as any[],
        dids: this.config.bluesky.dids,
      });
      
      console.log(`[SintelFeeder] Bluesky firehose connected to ${this.config.bluesky.relay || 'wss://bsky.network'}`);
    } catch (err) {
      console.error(`[SintelFeeder] Failed to start Bluesky:`, err);
    }
  }
  
  private async startDNS(): Promise<void> {
    try {
      this.dnsDiscovery = new DNSDiscovery();
      this.aggregator = new SignalAggregator({ use_real_probes: true });
      
      console.log(`[SintelFeeder] DNS discovery enabled for ${this.config.dnsTargets.length} targets`);
    } catch (err) {
      console.error(`[SintelFeeder] Failed to start DNS discovery:`, err);
    }
  }
  
  /**
   * Tick: process pending signals and feed to mind queue.
   */
  private async tick(): Promise<void> {
    if (!this.isRunning) return;
    
    // Process Bluesky signals
    if (this.bskyDiscovery) {
      const signals = this.bskyDiscovery.getSignals(50);
      for (const signal of signals) {
        this.bridge.processBskySignal(signal);
      }
    }
    
    // Convert to cephalon message proposals
    const proposals = this.bridge.toMessageProposals();
    
    // Submit to mind queue
    for (const proposal of proposals) {
      try {
        this.config.mindQueue.proposeMessage({
          sessionId: proposal.sessionId,
          cephalonId: proposal.cephalonId,
          circuitIndex: proposal.circuitIndex,
          content: proposal.content,
          rationale: proposal.rationale,
          sourceEventType: proposal.sourceEventType,
        });
        
        console.log(`[SintelFeeder] Queued ${proposal.sourceEventType} signal for circuit ${proposal.circuitIndex}`);
      } catch (err) {
        console.error(`[SintelFeeder] Failed to queue signal:`, err);
      }
    }
    
    // Clear processed signals
    if (proposals.length > 0) {
      this.bridge.clearSignals(proposals.map(p => p.id as UUID));
    }
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a Sintel perception feeder for a cephalon.
 */
export function createSintelFeeder(
  sessionId: string,
  cephalonId: string,
  mindQueue: CephalonMindQueue,
  options?: Partial<SintelFeederConfig>
): SintelPerceptionFeeder {
  return new SintelPerceptionFeeder({
    sessionId,
    cephalonId,
    mindQueue,
    ...options,
  });
}