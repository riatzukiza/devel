import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { PiLaneConnections } from "../components/PiLaneConnections";
import type { RadarTile } from "../../api/types";
import type { EmbeddingState, SimilarityScore } from "../../embed/useEmbedding";

/** Create a minimal RadarTile for testing */
function makeTile(
  id: string,
  name: string,
  category: string,
  threads?: Array<{ id: string; title: string }>,
): RadarTile {
  return {
    radar: { id, slug: id, name, category, status: "active" },
    sourceCount: 1,
    submissionCount: 1,
    threads: threads?.map((t) => ({
      id: t.id,
      title: t.title,
      kind: "event" as const,
      members: [],
      source_distribution: {},
      confidence: 0.8,
      timeline: {
        first_seen: "2025-01-01T00:00:00Z",
        last_updated: "2025-01-01T01:00:00Z",
      },
      domain_tags: [],
      status: "active" as const,
    })),
  };
}

const readyState: EmbeddingState = {
  ready: true,
  onnxReady: false,
  activeBackend: "trigram-cpu",
  diagnostics: null,
  error: null,
};

const loadingState: EmbeddingState = {
  ready: false,
  onnxReady: false,
  activeBackend: "initializing",
  diagnostics: null,
  error: null,
};

describe("PiLaneConnections", () => {
  it("renders loading state when embedding is not ready", () => {
    const mockCompute = vi.fn().mockResolvedValue([]);
    render(
      <PiLaneConnections
        globalTiles={[makeTile("g1", "Global", "geopolitical")]}
        localTiles={[makeTile("l1", "Local", "community")]}
        embeddingState={loadingState}
        computeSimilarity={mockCompute}
      />,
    );
    expect(screen.getByTestId("pi-conn-loading")).toBeTruthy();
    expect(screen.getByText(/Initializing embedding engine/)).toBeTruthy();
  });

  it("renders empty state when no global or local tiles", () => {
    const mockCompute = vi.fn().mockResolvedValue([]);
    render(
      <PiLaneConnections
        globalTiles={[]}
        localTiles={[]}
        embeddingState={readyState}
        computeSimilarity={mockCompute}
      />,
    );
    expect(screen.getByTestId("pi-conn-empty")).toBeTruthy();
    expect(screen.getByText(/Connections will appear/)).toBeTruthy();
  });

  it("shows backend badge when ready", async () => {
    const mockCompute = vi.fn().mockResolvedValue([]);
    render(
      <PiLaneConnections
        globalTiles={[makeTile("g1", "Global", "geopolitical")]}
        localTiles={[makeTile("l1", "Local", "community")]}
        embeddingState={readyState}
        computeSimilarity={mockCompute}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("pi-conn-backend")).toBeTruthy();
    });
    expect(screen.getByTestId("pi-conn-backend").textContent).toContain("trigram-cpu");
  });

  it("renders connection cards with similarity scores", async () => {
    const scores: SimilarityScore[] = [
      { globalTitle: "Global Energy Crisis", localTitle: "Local Energy Action", similarity: 0.72 },
      { globalTitle: "Global Energy Crisis", localTitle: "Community Response", similarity: 0.35 },
    ];
    const mockCompute = vi.fn().mockResolvedValue(scores);

    render(
      <PiLaneConnections
        globalTiles={[makeTile("g1", "Global Energy Crisis", "geopolitical")]}
        localTiles={[
          makeTile("l1", "Local Energy Action", "local"),
          makeTile("l2", "Community Response", "community"),
        ]}
        embeddingState={readyState}
        computeSimilarity={mockCompute}
      />,
    );

    await waitFor(() => {
      const cards = screen.getAllByTestId("pi-conn-card");
      expect(cards.length).toBe(2);
    });

    // Check similarity scores are displayed
    const simLabels = screen.getAllByTestId("pi-conn-similarity");
    expect(simLabels[0].textContent).toBe("72%");
    expect(simLabels[1].textContent).toBe("35%");
  });

  it("displays η and μ lane tags on connection cards", async () => {
    const scores: SimilarityScore[] = [
      { globalTitle: "Global Thread", localTitle: "Local Thread", similarity: 0.5 },
    ];
    const mockCompute = vi.fn().mockResolvedValue(scores);

    render(
      <PiLaneConnections
        globalTiles={[makeTile("g1", "Global Thread", "geopolitical")]}
        localTiles={[makeTile("l1", "Local Thread", "local")]}
        embeddingState={readyState}
        computeSimilarity={mockCompute}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("η")).toBeTruthy();
      expect(screen.getByText("μ")).toBeTruthy();
    });
  });

  it("shows strength labels for different similarity levels", async () => {
    const scores: SimilarityScore[] = [
      { globalTitle: "A", localTitle: "B", similarity: 0.6 },
      { globalTitle: "C", localTitle: "D", similarity: 0.35 },
      { globalTitle: "E", localTitle: "F", similarity: 0.2 },
    ];
    const mockCompute = vi.fn().mockResolvedValue(scores);

    render(
      <PiLaneConnections
        globalTiles={[
          makeTile("g1", "A", "geopolitical"),
          makeTile("g2", "C", "infrastructure"),
          makeTile("g3", "E", "global"),
        ]}
        localTiles={[
          makeTile("l1", "B", "local"),
          makeTile("l2", "D", "community"),
          makeTile("l3", "F", "technology"),
        ]}
        embeddingState={readyState}
        computeSimilarity={mockCompute}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Strong")).toBeTruthy();
      expect(screen.getByText("Moderate")).toBeTruthy();
      expect(screen.getByText("Weak")).toBeTruthy();
    });
  });

  it("calls computeSimilarity with thread titles", async () => {
    const mockCompute = vi.fn().mockResolvedValue([]);
    const globalTiles = [
      makeTile("g1", "Geopolitics", "geopolitical", [
        { id: "t1", title: "Conflict in Region X" },
      ]),
    ];
    const localTiles = [
      makeTile("l1", "Community", "community", [
        { id: "t2", title: "Local Impact of Conflict" },
      ]),
    ];

    render(
      <PiLaneConnections
        globalTiles={globalTiles}
        localTiles={localTiles}
        embeddingState={readyState}
        computeSimilarity={mockCompute}
      />,
    );

    await waitFor(() => {
      expect(mockCompute).toHaveBeenCalledWith(
        ["Conflict in Region X"],
        ["Local Impact of Conflict"],
      );
    });
  });

  it("filters out scores below 10% similarity", async () => {
    const scores: SimilarityScore[] = [
      { globalTitle: "A", localTitle: "B", similarity: 0.5 },
      { globalTitle: "C", localTitle: "D", similarity: 0.05 }, // Below threshold
    ];
    const mockCompute = vi.fn().mockResolvedValue(scores);

    render(
      <PiLaneConnections
        globalTiles={[makeTile("g1", "A", "geopolitical"), makeTile("g2", "C", "global")]}
        localTiles={[makeTile("l1", "B", "local"), makeTile("l2", "D", "community")]}
        embeddingState={readyState}
        computeSimilarity={mockCompute}
      />,
    );

    await waitFor(() => {
      const cards = screen.getAllByTestId("pi-conn-card");
      // Only the score above 10% should be shown
      expect(cards.length).toBe(1);
    });
  });

  it("uses radar name as fallback when no threads exist", async () => {
    const mockCompute = vi.fn().mockResolvedValue([]);

    render(
      <PiLaneConnections
        globalTiles={[makeTile("g1", "Global Radar", "geopolitical")]}
        localTiles={[makeTile("l1", "Local Radar", "local")]}
        embeddingState={readyState}
        computeSimilarity={mockCompute}
      />,
    );

    await waitFor(() => {
      expect(mockCompute).toHaveBeenCalledWith(
        ["Global Radar"],
        ["Local Radar"],
      );
    });
  });

  it("shows connection count", async () => {
    const scores: SimilarityScore[] = [
      { globalTitle: "A", localTitle: "B", similarity: 0.5 },
      { globalTitle: "C", localTitle: "D", similarity: 0.3 },
    ];
    const mockCompute = vi.fn().mockResolvedValue(scores);

    render(
      <PiLaneConnections
        globalTiles={[makeTile("g1", "A", "geopolitical")]}
        localTiles={[makeTile("l1", "B", "local")]}
        embeddingState={readyState}
        computeSimilarity={mockCompute}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("2 connections")).toBeTruthy();
    });
  });
});
