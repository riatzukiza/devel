# Shared agent DSL examples (real-world scenarios)

## Scope
These examples are intended to live in `promethean-agent-system` and be imported by downstream projects (Discord bridge, benchmarks, Lineara contracts).

## Example 1: Discord responder + benchcase
```clojure
(def-tool discord_send
  (doc "Send a message to a Discord channel")
  (domain :discord)
  (tags :discord :messaging)
  (params
    [channel_id :string "Discord channel id"]
    [text :string "Message body"])
  (impl [{:keys [channel_id text]}]
    (discord-rpc/send! {:channel-id channel_id :text text}))
  (bench
    (benchcase "discord/send/reply"
      (prompt "Reply in #general: 'hello from promethean'")
      (args {:channel_id "123" :text "hello from promethean"})
      (policy :best))))
```

## Example 2: Tool-choice scenario (bench DSL)
```clojure
(def-scenario discord-context-first
  (step :fetch-history
    :expect (expect :calls :tool "discord.channel.messages" :args {:channel_id "123" :limit 20}))
  (step :respond
    :expect (expect :calls :tool "discord.send" :args {:channel_id "123" :text "..."})))
```

## Example 3: Benchmark suite (tool choice)
```clojure
(def-benchmark discord-tool-choice
  (suite "send-only"
    (case "send/1" :prompt "Say hi" :expect (calls "discord.send" {:text "hi"})))
  (suite "history-first"
    (case "history/1" :prompt "Summarize recent chat" :expect (calls "discord.channel.messages" {:limit 20}))))
```

## Example 4: Lineara event emission
```clojure
{:kind :cap/call
 :payload {:cap :discord
           :call :send
           :args {:channel-id "123" :text "hello"}
           :replay/key "rpk:sha256:..."
           :mode :real}}
```

## Definition of done
- Examples compile under the shared DSL in `promethean-agent-system`.
- Examples are referenced by downstream READMEs when the DSL is adopted.
