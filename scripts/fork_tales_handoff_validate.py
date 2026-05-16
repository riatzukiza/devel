#!/usr/bin/env python3
"""Validate Fork Tales audio-agent handoff packets.

This is a lightweight executable-spec validator, not a full JSON Schema engine.
It enforces the current handoff invariants μ1-μ5 from:

  docs/fork-tales-audio-agent-operating-model.md
  docs/fork-tales-audio-handoff-schemas.json
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

DEFAULT_SCHEMA = Path("/home/err/devel/docs/fork-tales-audio-handoff-schemas.json")


class Validation:
    def __init__(self) -> None:
        self.errors: list[dict[str, Any]] = []
        self.warnings: list[dict[str, Any]] = []
        self.checked_specs: list[str] = []

    def error(self, spec: str, path: str, message: str) -> None:
        self.errors.append({"spec": spec, "path": path, "message": message})

    def warn(self, spec: str, path: str, message: str) -> None:
        self.warnings.append({"spec": spec, "path": path, "message": message})

    def checked(self, spec: str) -> None:
        if spec not in self.checked_specs:
            self.checked_specs.append(spec)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def ensure_list(value: Any) -> list[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def nonempty(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (list, dict)):
        return len(value) > 0
    return True


def has_span(span: Any) -> bool:
    if not isinstance(span, dict):
        return False
    return (
        ("t0" in span and "t1" in span)
        or nonempty(span.get("bars"))
        or nonempty(span.get("section"))
    )


def artifact_items(value: Any) -> list[tuple[str, Any]]:
    if isinstance(value, list):
        return [(f"artifacts[{i}]", item) for i, item in enumerate(value)]
    if isinstance(value, dict):
        # Support both object-list style and legacy maps. Dict artifact refs are OK
        # only when each value is an object with artifact metadata.
        return [(f"artifacts.{key}", item) for key, item in value.items()]
    return []


def catalog_approved_ids(catalog: Any) -> set[str]:
    approved: set[str] = set()
    if isinstance(catalog, dict):
        entries = catalog.get("entries") or catalog.get("references") or []
        if isinstance(entries, dict):
            entries = [{"reference_id": k, **(v if isinstance(v, dict) else {})} for k, v in entries.items()]
        for entry in ensure_list(entries):
            if not isinstance(entry, dict):
                continue
            status = entry.get("approval_status") or entry.get("status")
            rid = entry.get("reference_id") or entry.get("id")
            if rid and status == "approved":
                approved.add(str(rid))
    return approved


def reference_entries(packet: dict[str, Any]) -> list[dict[str, Any]]:
    refs: list[dict[str, Any]] = []
    inputs = packet.get("inputs") or {}
    constraints = packet.get("constraints") or {}
    for source in [packet.get("references"), inputs.get("references"), constraints.get("references")]:
        for ref in ensure_list(source):
            if isinstance(ref, str):
                refs.append({"reference_id": ref})
            elif isinstance(ref, dict):
                refs.append(ref)
    return refs


def validate_common(packet: dict[str, Any], schema: dict[str, Any], v: Validation, packet_name: str) -> None:
    for field in schema.get("common_required_fields", []):
        if not nonempty(packet.get(field)):
            v.error("common", f"{packet_name}.{field}", "missing required common handoff field")
    kind = packet.get("handoff_kind")
    if kind and kind not in schema.get("handoff_kinds", []):
        v.error("common", f"{packet_name}.handoff_kind", f"unknown handoff_kind {kind!r}")
    mode = packet.get("mode")
    if mode and mode not in schema.get("modes", []):
        v.error("common", f"{packet_name}.mode", f"unknown mode {mode!r}")
    role = packet.get("role")
    if role and role not in schema.get("roles", []):
        v.error("common", f"{packet_name}.role", f"unknown role {role!r}")


def validate_required_by_kind(packet: dict[str, Any], schema: dict[str, Any], v: Validation, packet_name: str) -> None:
    kind = packet.get("handoff_kind")
    kind_schema = (schema.get("schemas") or {}).get(kind or "")
    if not isinstance(kind_schema, dict):
        return
    for field in kind_schema.get("required", []):
        if not nonempty(packet.get(field)):
            v.error("kind-required", f"{packet_name}.{field}", f"missing required field for {kind}")


def validate_mu1(packet: dict[str, Any], v: Validation, packet_name: str) -> None:
    """μ1: Every accepted artifact must include provenance, source span, unresolved issues."""
    v.checked("μ1")
    kind = packet.get("handoff_kind")
    status = packet.get("status") or packet.get("approval_status") or packet.get("verdict")
    applies = kind in {"reference_catalog_entry", "final_release"} or status in {"accept", "approved", "promoted", "final"}
    artifact_sources: list[tuple[str, Any]] = []
    if applies:
        artifact_sources.extend(artifact_items(packet.get("artifacts")))
    if kind == "qc_review":
        artifact_sources.extend(artifact_items(packet.get("accepted_artifacts")))
    if not artifact_sources:
        return
    for path, artifact in artifact_sources:
        if not isinstance(artifact, dict):
            v.error("μ1", f"{packet_name}.{path}", "accepted artifact must be an object, not a bare path")
            continue
        if not nonempty(artifact.get("provenance")):
            v.error("μ1", f"{packet_name}.{path}.provenance", "accepted artifact missing provenance")
        if not has_span(artifact.get("source_span")):
            v.error("μ1", f"{packet_name}.{path}.source_span", "accepted artifact missing source span")
        if "unresolved_issues" not in artifact:
            v.error("μ1", f"{packet_name}.{path}.unresolved_issues", "accepted artifact must include unresolved_issues list, even if empty")


def validate_mu2(packet: dict[str, Any], v: Validation, packet_name: str) -> None:
    """μ2: Reviewer rejection/revision requires actionable required_action."""
    if packet.get("handoff_kind") != "qc_review":
        return
    v.checked("μ2")
    verdict = packet.get("verdict")
    if verdict not in {"revise", "reject"}:
        return
    reasons = ensure_list(packet.get("reasons"))
    if not reasons:
        v.error("μ2", f"{packet_name}.reasons", "reviewer rejection/revision must include at least one reason")
        return
    actionable = False
    for i, reason in enumerate(reasons):
        if isinstance(reason, dict) and nonempty(reason.get("required_action")):
            actionable = True
        else:
            v.error("μ2", f"{packet_name}.reasons[{i}].required_action", "reason missing actionable required_action")
    if not actionable:
        v.error("μ2", f"{packet_name}.reasons", "no actionable required_action found")


def validate_mu3(packet: dict[str, Any], v: Validation, packet_name: str) -> None:
    """μ3: Human rejection/revision must be structured by domain and span."""
    if packet.get("handoff_kind") != "human_audit":
        return
    v.checked("μ3")
    verdict = packet.get("verdict")
    if verdict not in {"revise", "reject"}:
        return
    findings = ensure_list(packet.get("findings"))
    if not findings:
        v.error("μ3", f"{packet_name}.findings", "human rejection/revision must include structured findings")
        return
    for i, finding in enumerate(findings):
        if not isinstance(finding, dict):
            v.error("μ3", f"{packet_name}.findings[{i}]", "finding must be an object")
            continue
        if not nonempty(finding.get("domain")):
            v.error("μ3", f"{packet_name}.findings[{i}].domain", "finding missing domain")
        if not has_span(finding.get("span")):
            v.error("μ3", f"{packet_name}.findings[{i}].span", "finding missing structured span")
        if not nonempty(finding.get("severity")):
            v.warn("μ3", f"{packet_name}.findings[{i}].severity", "finding should include severity")


def validate_mu4(packet: dict[str, Any], v: Validation, packet_name: str, approved_ids: set[str]) -> None:
    """μ4: Composition mode may only use approved references."""
    if packet.get("mode") != "composition":
        return
    v.checked("μ4")
    refs = reference_entries(packet)
    for i, ref in enumerate(refs):
        rid = ref.get("reference_id") or ref.get("id") or ref.get("path")
        status = ref.get("approval_status") or ref.get("status")
        exploratory = bool(ref.get("exploratory") or ref.get("non_training"))
        if exploratory:
            v.warn("μ4", f"{packet_name}.references[{i}]", "reference marked exploratory/non-training; not counted as approved catalog input")
            continue
        if status == "approved":
            continue
        if rid and rid in approved_ids:
            continue
        v.error("μ4", f"{packet_name}.references[{i}]", f"composition reference {rid!r} is not approved")


def validate_mu5(packet: dict[str, Any], v: Validation, packet_name: str) -> None:
    """μ5: Planner restarts must carry prior plan, failed artifacts, adjudication, review feedback."""
    applies = packet.get("handoff_kind") == "restart_packet" or bool(packet.get("is_restart"))
    if not applies:
        return
    v.checked("μ5")
    for field in ["prior_plan", "failed_artifacts", "adjudication_report", "review_feedback"]:
        if not nonempty(packet.get(field)):
            v.error("μ5", f"{packet_name}.{field}", "restart missing required context")


def validate_mu6(packet: dict[str, Any], v: Validation, packet_name: str) -> None:
    """μ6: Gemma Check is a tool/sub-agent, not an acceptance authority."""
    role = packet.get("role")
    kind = packet.get("handoff_kind")
    if role != "gemma_check_subagent" and kind != "gemma_check_result":
        return
    v.checked("μ6")
    if packet.get("verdict") in {"accept", "approve"}:
        v.error("μ6", f"{packet_name}.verdict", "gemma_check_subagent cannot accept or approve work")
    if kind in {"qc_review", "reference_catalog_entry", "final_release"}:
        v.error("μ6", f"{packet_name}.handoff_kind", "gemma_check_subagent cannot emit QC/catalog/final-release handoff")


def validate_packet(packet: dict[str, Any], schema: dict[str, Any], v: Validation, packet_name: str, approved_ids: set[str]) -> None:
    validate_common(packet, schema, v, packet_name)
    validate_required_by_kind(packet, schema, v, packet_name)
    validate_mu1(packet, v, packet_name)
    validate_mu2(packet, v, packet_name)
    validate_mu3(packet, v, packet_name)
    validate_mu4(packet, v, packet_name, approved_ids)
    validate_mu5(packet, v, packet_name)
    validate_mu6(packet, v, packet_name)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("packets", nargs="+", type=Path)
    parser.add_argument("--schema", default=DEFAULT_SCHEMA, type=Path)
    parser.add_argument("--catalog", type=Path, help="Optional approved reference catalog JSON")
    parser.add_argument("--out-json", type=Path)
    args = parser.parse_args()

    schema = load_json(args.schema)
    catalog = load_json(args.catalog) if args.catalog else {}
    approved_ids = catalog_approved_ids(catalog)
    v = Validation()

    for packet_path in args.packets:
        data = load_json(packet_path)
        packets = data if isinstance(data, list) else [data]
        for i, packet in enumerate(packets):
            if not isinstance(packet, dict):
                v.error("common", f"{packet_path}[{i}]", "packet must be an object")
                continue
            validate_packet(packet, schema, v, f"{packet_path.name}[{i}]", approved_ids)

    result = {
        "schema_version": "fork-tales-handoff-validation-report/v1",
        "ok": not v.errors,
        "checked_specs": sorted(v.checked_specs),
        "error_count": len(v.errors),
        "warning_count": len(v.warnings),
        "errors": v.errors,
        "warnings": v.warnings,
    }
    text = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.out_json:
        args.out_json.parent.mkdir(parents=True, exist_ok=True)
        args.out_json.write_text(text, encoding="utf-8")
    print(text, end="")
    if v.errors:
        raise SystemExit(1)


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        try:
            sys.stdout.close()
        except Exception:
            pass
