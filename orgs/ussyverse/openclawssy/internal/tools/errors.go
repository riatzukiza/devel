package tools

import "fmt"

type ErrorCode string

const (
	ErrCodeNotFound     ErrorCode = "tool.not_found"
	ErrCodeInvalidInput ErrorCode = "tool.input_invalid"
	ErrCodePolicyDenied ErrorCode = "policy.denied"
	ErrCodeTimeout      ErrorCode = "timeout"
	ErrCodeExecution    ErrorCode = "internal.error"
)

type ToolError struct {
	Code    ErrorCode
	Tool    string
	Message string
	Cause   error
}

func (e *ToolError) Error() string {
	if e.Tool == "" {
		return fmt.Sprintf("%s: %s", e.Code, e.Message)
	}
	return fmt.Sprintf("%s (%s): %s", e.Code, e.Tool, e.Message)
}

func (e *ToolError) Unwrap() error {
	if e == nil {
		return nil
	}
	return e.Cause
}

func wrapError(code ErrorCode, tool string, err error) error {
	if err == nil {
		return nil
	}
	return &ToolError{Code: code, Tool: tool, Message: err.Error(), Cause: err}
}
