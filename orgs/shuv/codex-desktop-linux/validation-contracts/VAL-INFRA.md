# Validation Contracts: Core Infrastructure

**Area:** Core Infrastructure  
**Milestone:** 1 - Foundation  
**Scope:** Host registry, SSH command executor, OTEL instrumentation, shared types  
**Components:** `@codex-fleet/core`, Effect Schema, `@effect/opentelemetry`

---

## VAL-INFRA-001: Host Registry - Load Valid YAML Config

**Title:** Load and parse valid host registry YAML configuration

**Behavioral Description:**  
When the host registry module is initialized, the system SHALL load the YAML configuration file from the designated path. The system MUST parse all host entries and create an in-memory registry accessible by host name. The configuration file SHALL follow the expected schema with host name, connection details, and optional metadata.

**Pass Condition:**  
- YAML file is read successfully from the configured path
- All host entries are parsed into strongly-typed host objects
- Registry returns correct host count matching file entries
- Individual hosts are retrievable by name via registry lookup

**Fail Condition:**  
- File read operation throws unhandled exception
- Partial parsing leaves registry in inconsistent state
- Host count mismatch between file and registry
- Valid hosts are not accessible after initialization

**Evidence Requirements:**
- Source YAML file content (hosts.yaml or equivalent)
- Registry initialization return value/status
- Registry host count via API call
- Sample host lookup result for each configured host
- Initialization timestamp and duration

---

## VAL-INFRA-002: Host Registry - Schema Validation for Host Entries

**Title:** Validate host entries against Effect Schema definition

**Behavioral Description:**  
When parsing host configuration entries, the system SHALL validate each entry against the defined Effect Schema. Required fields (hostname, connection type) MUST be present and correctly typed. The schema validation MUST use `@codex-fleet/core` shared types for consistency across the fleet system.

**Pass Condition:**  
- Valid host entries pass schema validation without errors
- Schema violations produce typed validation errors with field path
- Effect Schema decode function returns `Either.right` for valid data
- All required fields are enforced (hostname, connection type)

**Fail Condition:**  
- Invalid entries are silently accepted into registry
- Schema errors lack field-level detail
- Type coercion masks invalid data
- Required field omission does not trigger error

**Evidence Requirements:**
- Effect Schema definition for host entry type
- Sample valid host entry and validation result
- Sample invalid host entry and validation error detail
- Field path in error message for nested schema violations

---

## VAL-INFRA-003: Host Registry - Handle Missing Config File

**Title:** Graceful error when host configuration file is missing

**Behavioral Description:**  
When the host registry attempts to load a configuration file that does not exist, the system SHALL return a typed error indicating file not found. The system MUST NOT crash or throw unhandled exceptions. The error SHALL include the attempted file path for debugging.

**Pass Condition:**  
- Missing file produces `ConfigNotFound` or equivalent typed error
- Error message includes the attempted file path
- No unhandled exceptions or process crashes
- Effect Either/Exit pattern used for error representation

**Fail Condition:**  
- Unhandled exception crashes the process
- Generic error without file path information
- Silent failure returning empty registry
- Error type indistinguishable from parse errors

**Evidence Requirements:**
- File path that does not exist (test path)
- Error return value with type and message
- Stack trace confirming no unhandled exception
- Effect error channel inspection

---

## VAL-INFRA-004: Host Registry - Default Values and Required Fields

**Title:** Apply default values for optional fields, enforce required fields

**Behavioral Description:**  
When parsing host entries, the system SHALL apply default values for optional configuration fields (e.g., default SSH port 22, default connection timeout). Required fields (hostname) MUST cause validation failure when missing. Default values SHALL be defined in the Effect Schema using `Schema.withDefault` or equivalent.

**Pass Condition:**  
- Optional fields without values receive schema-defined defaults
- SSH port defaults to 22 when not specified
- Connection timeout defaults to configured value (e.g., 30 seconds)
- Missing required fields trigger validation error

**Fail Condition:**  
- Optional fields remain undefined after parsing
- Defaults are applied inconsistently
- Required field missing does not trigger error
- Default values differ from schema definition

**Evidence Requirements:**
- Host entry with minimal required fields only
- Parsed host object showing default values populated
- Schema definition showing default declarations
- Required field omission error example

---

## VAL-INFRA-005: Host Registry - Multiple Host Configurations

**Title:** Support multiple hosts with distinct configurations

**Behavioral Description:**  
When the configuration file contains multiple host entries (localhost, shuvtest, shuvbot), the system SHALL create registry entries for each host with their individual settings. Each host MUST maintain independent configuration (port, user, key path). The registry SHALL support enumeration of all hosts and lookup by name.

**Pass Condition:**  
- All configured hosts are present in registry (3 hosts = 3 entries)
- Each host has independent configuration values
- `getAllHosts()` returns array with all hosts
- `getHost("shuvtest")` returns shuvtest-specific config
- No cross-contamination of host settings

**Fail Condition:**  
- Hosts share configuration incorrectly
- Later hosts overwrite earlier hosts
- `getAllHosts()` returns incorrect count
- Host-specific lookup returns wrong host's config

**Evidence Requirements:**
- Multi-host YAML configuration file
- Registry entry for each host with distinct settings
- `getAllHosts()` enumeration result
- Individual host lookups for localhost, shuvtest, shuvbot

---

## VAL-INFRA-006: SSH Executor - Command Execution on Remote Host

**Title:** Execute shell command on remote host via SSH

**Behavioral Description:**  
When `executeCommand` is invoked with a host identifier and command string, the system SHALL establish an SSH connection to the specified host and execute the command. The execution MUST occur on the remote host's shell, not locally. The operation SHALL be wrapped in Effect for composition and error handling.

**Pass Condition:**  
- Command executes on remote host (verified by host-specific output)
- Remote execution confirmed via hostname check (`hostname` command)
- Effect-wrapped operation supports composition
- Command string is passed unmodified to remote shell

**Fail Condition:**  
- Command executes locally instead of remotely
- SSH connection is not established
- Command string is corrupted or truncated
- Effect wrapper breaks composition semantics

**Evidence Requirements:**
- Command string provided to executor
- Remote host identifier
- Command output showing remote execution (e.g., remote hostname)
- Effect fiber/runtime execution trace

---

## VAL-INFRA-007: SSH Executor - Command Output Capture

**Title:** Capture stdout, stderr, and exit code from remote command

**Behavioral Description:**  
When a remote command completes, the SSH executor SHALL capture and return the command's stdout, stderr, and exit code. All three streams/values MUST be available in the result object. Large outputs SHALL be captured completely without truncation (within reasonable limits).

**Pass Condition:**  
- `stdout` field contains command standard output
- `stderr` field contains command error output
- `exitCode` field contains numeric exit code (0 for success)
- Multi-line output is preserved with line breaks

**Fail Condition:**  
- stdout or stderr is missing from result
- Exit code is missing or incorrectly typed
- Output streams are truncated unexpectedly
- stdout/stderr are merged incorrectly

**Evidence Requirements:**
- Command that produces stdout (e.g., `echo "hello"`)
- Command that produces stderr (e.g., `echo "error" >&2`)
- Command with specific exit code (e.g., `exit 42`)
- Result object with all three fields populated

---

## VAL-INFRA-008: SSH Executor - Connection Timeout Handling

**Title:** Enforce connection timeout for SSH connections

**Behavioral Description:**  
When establishing an SSH connection, the system SHALL enforce a configurable connection timeout. If the connection cannot be established within the timeout period, the system MUST return a typed timeout error. The timeout SHALL be distinct from command execution timeout.

**Pass Condition:**  
- Connection attempt fails after timeout period (not before)
- Timeout error is typed (`ConnectionTimeout` or equivalent)
- Error includes attempted host and timeout duration
- Non-responsive host triggers timeout (not hang)

**Fail Condition:**  
- Connection hangs indefinitely without timeout
- Timeout triggers before configured duration
- Timeout error is generic, not typed
- Successful connection is incorrectly timed out

**Evidence Requirements:**
- Configured timeout value (e.g., 10 seconds)
- Unreachable host address for timeout test
- Elapsed time measurement until error
- Typed error with timeout classification

---

## VAL-INFRA-009: SSH Executor - SSH Key-Based Authentication

**Title:** Authenticate to remote hosts using SSH keys

**Behavioral Description:**  
When connecting to a remote host, the SSH executor SHALL authenticate using SSH key-based authentication. The system MUST support reading keys from the standard SSH directory (~/.ssh/) and from paths specified in host configuration. The system SHALL NOT prompt for passwords in programmatic execution.

**Pass Condition:**  
- Connection succeeds using SSH key authentication
- No password prompts during connection
- Custom key path from host config is used when specified
- SSH agent is utilized when available

**Fail Condition:**  
- Password prompt blocks execution
- Key file not found produces unclear error
- Wrong key is used for host
- SSH agent is ignored when running

**Evidence Requirements:**
- Host configuration with key path (if custom)
- Successful authentication log/trace
- Absence of password prompt in execution
- SSH key fingerprint in debug output (if available)

---

## VAL-INFRA-010: SSH Executor - Command Failure Detection

**Title:** Detect and report failed command execution (non-zero exit)

**Behavioral Description:**  
When a remote command exits with a non-zero exit code, the SSH executor SHALL detect and report this as a command failure. The failure MUST be distinguishable from connection failures. The exit code, stderr content, and any partial stdout SHALL be available in the failure response.

**Pass Condition:**  
- Non-zero exit code produces failure/error result
- Exit code value is preserved in error (e.g., 1, 2, 127)
- stderr content is available in failure
- Failure type is `CommandFailed`, not `ConnectionError`

**Fail Condition:**  
- Non-zero exit reported as success
- Exit code value is lost in error
- stderr is unavailable on command failure
- Command failure confused with SSH connection error

**Evidence Requirements:**
- Command that exits with code 1 (e.g., `exit 1`)
- Command that exits with code 127 (command not found)
- Error result showing exit code and stderr
- Type discrimination between command and connection failures

---

## VAL-INFRA-011: OTEL Integration - Span Creation for Operations

**Title:** Create OpenTelemetry spans for fleet operations

**Behavioral Description:**  
When fleet operations are executed (SSH commands, registry lookups), the system SHALL create OpenTelemetry spans via `@effect/opentelemetry`. Each operation MUST have a span with appropriate name reflecting the operation type. Spans SHALL be properly started and ended, even on failure.

**Pass Condition:**  
- Span is created for SSH command execution
- Span name reflects operation (e.g., "ssh.execute", "registry.lookup")
- Span has valid start and end time
- Span is ended on both success and failure paths

**Fail Condition:**  
- Operation executes without span creation
- Span name is generic or missing operation context
- Span is not ended (leaked span)
- Failure path bypasses span completion

**Evidence Requirements:**
- Span export to collector (localhost:4318)
- Span name and operation correlation
- Span duration (end_time - start_time)
- Span status on success and failure cases

---

## VAL-INFRA-012: OTEL Integration - Span Attributes

**Title:** Record operation context as span attributes

**Behavioral Description:**  
When creating spans for fleet operations, the system SHALL attach relevant attributes including host identifier, operation type, and result status. For SSH operations, attributes MUST include remote host, command (sanitized if sensitive), and exit code. Attribute names SHOULD follow OpenTelemetry semantic conventions where applicable.

**Pass Condition:**  
- `host` attribute contains target host identifier
- `operation` attribute describes the action
- `exitCode` attribute (for SSH) contains numeric code
- Duration is recorded (either as attribute or span timing)

**Fail Condition:**  
- Key attributes are missing from span
- Attribute values are incorrect or mismatched
- Sensitive data (passwords, keys) appears in attributes
- Attribute names are inconsistent across operations

**Evidence Requirements:**
- Exported span with attributes visible
- Attribute key-value pairs for sample operation
- Verification of semantic convention usage
- Confirmation no sensitive data in attributes

---

## VAL-INFRA-013: OTEL Integration - Trace Context Propagation

**Title:** Propagate trace context across operation boundaries

**Behavioral Description:**  
When operations span multiple components (e.g., CLI → registry → SSH executor), the system SHALL propagate trace context to maintain parent-child span relationships. Child spans MUST reference parent span ID. The trace ID SHALL remain consistent across the entire operation flow.

**Pass Condition:**  
- All spans in operation share same trace_id
- Child spans have parent_span_id set to parent's span_id
- Span hierarchy visible in trace visualization
- Context propagation works across Effect fiber boundaries

**Fail Condition:**  
- Spans have different trace_ids (broken trace)
- Parent-child relationship not established
- Orphan spans without parent reference
- Context lost during async/fiber operations

**Evidence Requirements:**
- Multi-span trace for single operation
- trace_id consistency across spans
- parent_span_id linkage verification
- Trace visualization showing hierarchy

---

## VAL-INFRA-014: OTEL Integration - Export to Collector

**Title:** Export telemetry data to OTEL collector

**Behavioral Description:**  
The system SHALL export span data to the configured OpenTelemetry collector at localhost:4318 using OTLP/HTTP protocol. Export MUST occur for all completed spans. Failed exports SHALL be logged but MUST NOT cause operation failure (fire-and-forget semantics for telemetry).

**Pass Condition:**  
- Spans appear in collector (maple) after operation
- Export uses OTLP/HTTP to localhost:4318
- Export failure does not fail the operation
- All completed spans are exported (no data loss)

**Fail Condition:**  
- Spans not received by collector
- Wrong protocol or endpoint used
- Export failure causes operation to fail
- Spans dropped without export attempt

**Evidence Requirements:**
- Collector endpoint configuration (localhost:4318)
- Span visible in collector UI/query
- Network trace showing OTLP request
- Export error handling (when collector unavailable)

---

## VAL-INFRA-015: OTEL Integration - Error Recording in Spans

**Title:** Record errors and exceptions in span events

**Behavioral Description:**  
When operations fail with errors or exceptions, the system SHALL record the error information in the span. The span status MUST be set to ERROR. Error details (message, type) SHALL be recorded as span events or attributes following OTEL exception semantic conventions.

**Pass Condition:**  
- Span status set to ERROR on operation failure
- Error message recorded in span event or attribute
- Exception type recorded (`exception.type`)
- Stack trace available for debugging (if applicable)

**Fail Condition:**  
- Failed operation has OK span status
- Error details missing from span
- Exception semantic conventions not followed
- Error swallowed without span recording

**Evidence Requirements:**
- Intentionally failed operation (e.g., invalid host)
- Exported span with ERROR status
- Error event/attribute content
- Exception type and message fields

---

## Summary

| ID | Title | Category |
|----|-------|----------|
| VAL-INFRA-001 | Load Valid YAML Config | Host Registry |
| VAL-INFRA-002 | Schema Validation for Host Entries | Host Registry |
| VAL-INFRA-003 | Handle Missing Config File | Host Registry |
| VAL-INFRA-004 | Default Values and Required Fields | Host Registry |
| VAL-INFRA-005 | Multiple Host Configurations | Host Registry |
| VAL-INFRA-006 | Command Execution on Remote Host | SSH Executor |
| VAL-INFRA-007 | Command Output Capture | SSH Executor |
| VAL-INFRA-008 | Connection Timeout Handling | SSH Executor |
| VAL-INFRA-009 | SSH Key-Based Authentication | SSH Executor |
| VAL-INFRA-010 | Command Failure Detection | SSH Executor |
| VAL-INFRA-011 | Span Creation for Operations | OTEL Integration |
| VAL-INFRA-012 | Span Attributes | OTEL Integration |
| VAL-INFRA-013 | Trace Context Propagation | OTEL Integration |
| VAL-INFRA-014 | Export to Collector | OTEL Integration |
| VAL-INFRA-015 | Error Recording in Spans | OTEL Integration |

---

**Document Version:** 1.0  
**Created:** 2026-03-15  
**Author:** Validation Contract Generator
