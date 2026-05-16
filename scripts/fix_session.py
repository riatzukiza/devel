import re

with open('/home/err/devel/orgs/badlogic/pi-mono/packages/coding-agent/src/core/agent-session.ts', 'r') as f:
    lines = f.readlines()

# Remove all junk lines matching "this._lastInvokedSkill = skill.name;"
cleaned = [line for line in lines if 'this._lastInvokedSkill = skill.name;' not in line]

# Find the line with skillBlock = ... and insert after it
for i, line in enumerate(cleaned):
    if 'const skillBlock = ' in line:
        cleaned.insert(i + 1, '\t\t\tthis._lastInvokedSkill = skill.name;\n')
        break

with open('/home/err/devel/orgs/badlogic/pi-mono/packages/coding-agent/src/core/agent-session.ts', 'w') as f:
    f.writelines(cleaned)
