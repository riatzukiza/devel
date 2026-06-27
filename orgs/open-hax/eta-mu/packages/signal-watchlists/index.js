import signalWatchlists from "./index.cjs";

export const normalizeHttpUrl = signalWatchlists.normalizeHttpUrl;
export const normalizeWatchlistSeedRow =
  signalWatchlists.normalizeWatchlistSeedRow;
export const parseWatchlistSeeds = signalWatchlists.parseWatchlistSeeds;
export const loadWatchlistSeedsFromFile =
  signalWatchlists.loadWatchlistSeedsFromFile;
export const filterWatchlistSeedsByDomainId =
  signalWatchlists.filterWatchlistSeedsByDomainId;
export const mergeRequestedAndWatchlistSeeds =
  signalWatchlists.mergeRequestedAndWatchlistSeeds;

export default signalWatchlists;
