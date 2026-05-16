import json

# Update active_agents
with open('./:data/active_agents', 'r') as f:
    agents = json.load(f)

for agent in agents:
    if agent['status'] == ':spawned':
        agent['status'] = ':active'

with open('./:data/active_agents', 'w') as f:
    json.dump(agents, f, indent=2)

# Clear missing_roles
with open('./:data/missing_roles', 'w') as f:
    f.write('[]')
