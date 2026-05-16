import re

with open('data/spawn_log.edn', 'r') as f:
    content = f.read()

# Find all entries {:timestamp ..., :species_conceived ..., :contract_id ...}
entries = re.findall(r'\{:timestamp "[^"]*", :species_conceived :[^,]+, :contract_id "[^"]*"\}', content)

# Add the new one if not present
new_entry = '{:timestamp "2026-04-28T02:25:00Z", :species_conceived :SULTAN_OF_TABOOS, :contract_id "novel_SULTAN_OF_TABOOS_20260428T0225"}'
if new_entry not in entries:
    entries.append(new_entry)

with open('data/spawn_log.edn', 'w') as f:
    f.write('[\n ' + ',\n '.join(entries) + '\n]')
