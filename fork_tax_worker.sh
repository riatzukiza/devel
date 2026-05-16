#!/bin/bash
TS="20260504T195059Z"
PROCESSED_SUBMODS=""
BLOCKERS=""

# Get all submodules
SUBMODS=$(git submodule status | awk '{print $2}')

for MOD in $SUBMODS; do
    echo "Checking $MOD..."
    cd "$MOD" || { echo "Blocker: Could not cd into $MOD"; echo "$MOD: fail-cd" >> blockers.log; continue; }
    
    if [ -n "$(git status --porcelain)" ]; then
        echo "Dirt detected in $MOD. Processing..."
        # Classify: just add everything that isn't ignored
        if git add -A; then
            if git commit -m "Π $MOD $TS"; then
                if git tag "Π/$MOD/$TS"; then
                    PROCESSED_SUBMODS="$PROCESSED_SUBMODS $MOD"
                else
                    BLOCKERS="$BLOCKERS $MOD (tag fail)"
                    echo "$MOD: tag fail" >> blockers.log
                fi
            else
                BLOCKERS="$BLOCKERS $MOD (commit fail)"
                echo "$MOD: commit fail" >> blockers.log
            fi
        else
            BLOCKERS="$BLOCKERS $MOD (add fail)"
            echo "$MOD: add fail" >> blockers.log
        fi
    fi
    cd - > /dev/null
done

echo "PROCESSED: $PROCESSED_SUBMODS" > processed.log
echo "BLOCKERS: $BLOCKERS" > blockers_summary.log
