#!/bin/bash
TOKEN="$DISCORD_BOT_TOKEN"
CHANNEL_ID="$1"
TEXT="$2"
FILES="${@:3}"

if [ -z "$CHANNEL_ID" ] || [ -z "$TEXT" ]; then
  echo "Usage: $0 <channel_id> <text> [files...]"
  exit 1
fi

# Build the curl command
CURL_CMD="curl -X POST -H \"Authorization: Bot $TOKEN\" -H \"Content-Type: multipart/form-data\""
CURL_CMD+=" -F \"payload_json={\"content\": \"$TEXT\"}\""

for FILE in $FILES; do
  if [ -f "$FILE" ]; then
    CURL_CMD+=" -F \"files[0]=@$FILE\""
    # Note: This only works for one file with indices like files[0]. 
    # For multiple files, we'd need a loop with indices.
  fi
done

# For multiple files, we need to handle indices correctly
# Let's refine the loop
FILES_ARRAY=("$@")
CURL_CMD="curl -X POST -H \"Authorization: Bot $TOKEN\" -H \"Content-Type: multipart/form-data\""
CURL_CMD+=" -F \"payload_json={\"content\": \"$TEXT\"}\""

IDX=0
for ((i=2; i<${#FILES_ARRAY[@]}; i++)); do
  FILE="${FILES_ARRAY[$i]}"
  if [ -f "$FILE" ]; then
    CURL_CMD+=" -F \"files[$IDX]=@$FILE\""
    ((IDX++))
  fi
done

eval $CURL_CMD
