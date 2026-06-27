import os
import re
import json

skills_dir = ".opencode/skills"
skill_names = os.listdir(skills_dir)

results = {}

def get_category(name):
    if any(x in name for x in ["kanban-state", "work-on", "validate"]):
        return "Kanban"
    if "testing" in name or "test-" in name:
        return "Testing"
    if "workspace" in name:
        return "Workspace"
    if "pm2" in name:
        return "PM2"
    if "git" in name or "submodule" in name:
        return "Git"
    if "opencode" in name:
        return "OpenCode"
    if "clojure" in name:
        return "Clojure"
    return "General"

def is_entry_point(name, content):
    if name.startswith("work-on-"):
        return True
    if name.startswith("workspace-"):
        return True
    if name.startswith("testing-"):
        return True
    if "Use This Skill When" in content:
        # If it has specific triggers or user-facing scenarios
        return True
    return False

for skill_name in skill_names:
    skill_path = os.path.join(skills_dir, skill_name, "SKILL.md")
    if not os.path.exists(skill_path):
        continue
    
    with open(skill_path, "r") as f:
        content = f.read()
    
    # Extract name and description from frontmatter
    name_match = re.search(r"^name:\s*(.*)$", content, re.MULTILINE)
    desc_match = re.search(r"^description:\s*\"?(.*?)\"?$", content, re.MULTILINE)
    
    name = name_match.group(1).strip() if name_match else skill_name
    description = desc_match.group(1).strip() if desc_match else ""
    
    if not description:
        # Try to find description in the first paragraph or header
        header_match = re.search(r"^# Skill:\s*(.*)$", content, re.MULTILINE)
        if header_match:
            # Look for the next non-empty line
            lines = content.split("\n")
            for i, line in enumerate(lines):
                if line.startswith("# Skill:"):
                    for j in range(i+1, len(lines)):
                        if lines[j].strip():
                            description = lines[j].strip()
                            break
                    break

    # Find next skills (mentions of other skills)
    # We look for strings that match other skill names
    next_skills = []
    for other_skill in skill_names:
        if other_skill == skill_name:
            continue
        # Match whole word
        if re.search(r"\b" + re.escape(other_skill) + r"\b", content):
            next_skills.append(other_skill)
            
    # Special handling for validate-X-to-<target> patterns
    target_match = re.search(r"validate-[a-z_]+-to-<target>", content)
    if target_match:
        # Find all validate skills that match the prefix
        prefix = target_match.group(0).split("-to-")[0]
        for other_skill in skill_names:
            if other_skill.startswith(prefix + "-to-"):
                next_skills.append(other_skill)

    results[name] = {
        "category": get_category(name),
        "description": description,
        "next_skills": sorted(list(set(next_skills))),
        "is_entry_point": is_entry_point(name, content)
    }

print(json.dumps(results, indent=2))
