package tools

import (
	"context"
	"errors"
)

// RunCanceller is the interface for canceling runs.
// This is typically implemented by *runtime.RunTracker.
type RunCanceller interface {
	Cancel(runID string) error
}

var ErrRunNotFound = errors.New("run not found")

// registerRunCancelTool registers the run.cancel tool with the registry.
func registerRunCancelTool(reg *Registry, tracker RunCanceller) error {
	return reg.Register(ToolSpec{
		Name:        "run.cancel",
		Description: "Cancel an active run by ID",
		Required:    []string{"run_id"},
		ArgTypes:    map[string]ArgType{"run_id": ArgTypeString},
	}, func(ctx context.Context, req Request) (map[string]any, error) {
		return runCancel(ctx, req, tracker)
	})
}

// runCancel handles the run.cancel tool invocation.
func runCancel(_ context.Context, req Request, tracker RunCanceller) (map[string]any, error) {
	runID, err := getString(req.Args, "run_id")
	if err != nil {
		return nil, err
	}

	if tracker == nil {
		return nil, errors.New("run tracker not configured")
	}

	cancelErr := tracker.Cancel(runID)
	if cancelErr != nil {
		if errors.Is(cancelErr, ErrRunNotFound) {
			return map[string]any{
				"run_id":  runID,
				"found":   false,
				"summary": "Run not found or already completed",
			}, nil
		}
		return nil, cancelErr
	}

	return map[string]any{
		"run_id":    runID,
		"found":     true,
		"cancelled": true,
		"summary":   "Run cancellation requested",
	}, nil
}
