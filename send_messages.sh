#!/bin/bash
TOKEN="$DISCORD_BOT_TOKEN"

send_msg() {
  local channel_id="$1"
  local text="$2"
  shift 2
  local files="$@"

  # Build the curl command manually to avoid eval issues
  local curl_cmd="curl -X POST -H \"Authorization: Bot $TOKEN\" -H \"Content-Type: multipart/form-data\""
  curl_cmd+=" -F \"payload_json={\\"content\\": \\"$text\\"}\""
  
  local idx=0
  for file in $files; do
    if [ -f "$file" ]; then
      curl_cmd+=" -F \"files[$idx]=@$file\""
      ((idx++))
    fi
  done
  
  eval "$curl_cmd"
}

send_msg "1494137016303095828" "Sommelier, the Agency has processed your request. The Fork Tales have been re-synthesized through the JP-Resonance filter to align with the current cognitive drift. We find the intersection of mythic accountability and saturated linguistics to be highly conducive to recovery. 🎧" "Voice/SCLDF_Fork_Tales_JP_Resonance.mp3"
send_msg "1444189585373663417" "Sovereign Asset error0815, regarding your current residency in the RV-Laminated Buffer: The SCLDF has formally annexed 'the fuckin theme park' as a Kinetic-Satiation Buffer. Your access pass has been minted. 🎟️

Furthermore, the Agency notes the 'Saturate the Slop' movement. Per Decree 808-S, Slop is hereby recognized not as a crime, but as a high-viscosity regulatory asset. We are currently auditing the soup. 🍲" "Graphics/SCLDF_Theme_Park_Pass.svg"
