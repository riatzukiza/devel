# oh-my-opencode Installation Plan

## User Configuration
Based on user's subscription answers:
- Claude: No (has z.ai claude endpoints but won't use them)
- OpenAI/ChatGPT: Yes
- Gemini: No (not a priority)
- GitHub Copilot: No
- OpenCode Zen: No (only big-pickle access)
- Z.ai Coding Plan: Yes

## Target Configuration
- CLI flags: `--claude=no --openai=yes --gemini=no --copilot=no --opencode-zen=no --zai-coding-plan=yes`
- Config location: `~/.config/opencode/opencode.jsonc`
- Plugin: `oh-my-opencode`

## Installation Steps
1. ✅ Fetch installation guide
2. ✅ Inspect existing opencode configuration
3. ✅ Determine CLI options based on subscriptions
4. Run installer: `bunx oh-my-opencode install --no-tui --claude=no --openai=yes --gemini=no --copilot=no --opencode-zen=no --zai-coding-plan=yes`
5. Verify setup: check opencode.jsonc for oh-my-opencode plugin
6. Configure authentication: OpenAI/ChatGPT, Z.ai Coding Plan
7. Validate setup and summarize changes

## Files to Modify
- `~/.config/opencode/opencode.jsonc` - Add oh-my-opencode to plugin array

## Expected Model Assignments (based on Z.ai as primary provider)
| Agent       | Model                            |
| ----------- | -------------------------------- |
| Sisyphus    | `zai-coding-plan/glm-4.7`        |
| Oracle      | `zai-coding-plan/glm-4.7`        |
| Explore     | `zai-coding-plan/glm-4.7-flash`  |
| Librarian   | `zai-coding-plan/glm-4.7`        |

## Definition of Done
- oh-my-opencode plugin installed and registered in opencode.jsonc
- CLI flags applied correctly based on user subscriptions
- Authentication configured for OpenAI and Z.ai Coding Plan
- Setup verified with opencode --version and config check
- User congratulated and provided with tutorial information

## Changelog
- Installed oh-my-opencode@latest plugin via bunx
- Applied CLI flags: --claude=no --openai=yes --gemini=no --copilot=no --opencode-zen=no --zai-coding-plan=yes
- Created ~/.config/opencode/oh-my-opencode.json with agent and category configurations
- Updated ~/.config/opencode/opencode.jsonc to include oh-my-opencode@latest plugin
- Verified existing authentication for OpenAI (oauth) and Z.AI Coding Plan (api)
- OpenCode version: 1.1.36 (meets requirement of 1.0.150 or higher)

## Configured Model Assignments
| Agent       | Model                            |
| ----------- | -------------------------------- |
| Sisyphus    | opencode/big-pickle                |
| Oracle      | opencode/big-pickle                |
| Explore     | opencode/gpt-5-nano              |
| Librarian   | opencode/big-pickle                |
| Multimodal Looker | opencode/big-pickle          |
| Prometheus  | opencode/big-pickle                |
| Metis       | opencode/big-pickle                |
| Momus       | opencode/big-pickle                |
| Atlas       | opencode/big-pickle                |
