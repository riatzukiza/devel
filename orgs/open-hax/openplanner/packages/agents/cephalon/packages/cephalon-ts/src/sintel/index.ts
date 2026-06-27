/**
 * Sintel Integration for Cephalons
 * 
 * Exports the perception feeder that connects Sintel signals
 * to the Cephalon mind queue.
 */

export {
  SintelPerceptionFeeder,
  createSintelFeeder,
  type SintelFeederConfig,
  type PerceptionCategory,
  type PerceptionEvent,
} from './feeder.js';