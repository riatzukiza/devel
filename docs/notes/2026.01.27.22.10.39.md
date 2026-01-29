I think the idea is the agent can pick what ever model it wants to...
and we have some discord commands that allow us to use all of the same tools very easily
some cli tools that allow us to use it.

I think I want to allow them to change the lists of tools on their own.
But mark some tools as nessisary so they won't be able to remove those tools

We should set up a special direct to the loop TUI repl
the system admin panel, the user can directly inspect the memory
state in a graphical format
using open tui

The tools already have the contracts... the tools can easily map to components on a tui....

## Agent Admin Shell TUI

### Features
- view and update memories and facts
- session manager
  - search
  - delete
  - send message
  - start
  - rename


### New agent tools
- sessions.clone(session-id)
- sessions.start(prompt)
- sessions.send(session-id, promt)
- sessions.check-inbox
- sessions.list(limit)
- sessions.get(session-id)
- sessions.fuzzy-title-search()
- sessions.rename(session-id,new-title)
- sessions.delete(session-id)
