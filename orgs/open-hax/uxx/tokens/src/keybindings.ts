/**
 * Design Tokens - Keybindings
 * 
 * Spacemacs-inspired modal keybinding system.
 * 
 * Every action has a button. Every button has a chord.
 * The chord overlay shows available bindings contextually.
 * 
 * Modes:
 *   - normal: navigation and selection (like vim normal mode)
 *   - insert: text input (like vim insert mode)
 *   - command: spacemacs-style leader chords
 *   - visual: selection mode
 * 
 * Chords:
 *   - leader + key (like spacemacs SPC)
 *   - Ctrl+key (standard shortcuts)
 *   - / for search, : for command palette
 */

export const leaderKey = ' ' as const; // space

export type ModalMode = 'normal' | 'insert' | 'command' | 'visual';

export interface ChordBinding {
  keys: string[];           // e.g., ['leader', 'f', 'f'] = SPC f f
  action: string;           // semantic action name
  description: string;      // human-readable
  mode: ModalMode | ModalMode[];
  icon?: string;
}

// Default chord map (spacemacs-style)
export const defaultChords: ChordBinding[] = [
  // === Navigation (SPC group) ===
  { keys: ['leader', 'f'], action: 'file.open', description: 'Open file', mode: ['normal', 'command'] },
  { keys: ['leader', 'f', 'f'], action: 'file.find', description: 'Find file', mode: ['normal', 'command'] },
  { keys: ['leader', 'f', 's'], action: 'file.save', description: 'Save file', mode: ['normal'] },
  { keys: ['leader', 'b'], action: 'buffer.group', description: 'Buffers', mode: ['normal', 'command'] },
  { keys: ['leader', 'b', 'b'], action: 'buffer.switch', description: 'Switch buffer', mode: ['normal'] },
  { keys: ['leader', 'b', 'k'], action: 'buffer.kill', description: 'Kill buffer', mode: ['normal'] },
  { keys: ['leader', 's'], action: 'search.group', description: 'Search', mode: ['normal', 'command'] },
  { keys: ['leader', 's', 's'], action: 'search.workspace', description: 'Search workspace', mode: ['normal'] },
  { keys: ['leader', 'g'], action: 'git.group', description: 'Git', mode: ['normal', 'command'] },
  { keys: ['leader', 'g', 's'], action: 'git.status', description: 'Git status', mode: ['normal'] },
  { keys: ['leader', 'p'], action: 'project.group', description: 'Project', mode: ['normal', 'command'] },
  { keys: ['leader', 'w'], action: 'window.group', description: 'Windows', mode: ['normal', 'command'] },
  { keys: ['leader', 'w', '/'], action: 'window.split.vertical', description: 'Split right', mode: ['normal'] },
  { keys: ['leader', 'w', '-'], action: 'window.split.horizontal', description: 'Split down', mode: ['normal'] },
  { keys: ['leader', 'w', 'h'], action: 'window.focus.left', description: 'Focus left', mode: ['normal'] },
  { keys: ['leader', 'w', 'j'], action: 'window.focus.down', description: 'Focus down', mode: ['normal'] },
  { keys: ['leader', 'w', 'k'], action: 'window.focus.up', description: 'Focus up', mode: ['normal'] },
  { keys: ['leader', 'w', 'l'], action: 'window.focus.right', description: 'Focus right', mode: ['normal'] },
  { keys: ['leader', 'l'], action: 'layer.group', description: 'Lake/Layer', mode: ['normal', 'command'] },
  { keys: ['leader', 'l', 's'], action: 'layer.select', description: 'Select lake/layer', mode: ['normal'] },
  { keys: ['leader', 'l', 'q'], action: 'layer.query', description: 'Query current lake', mode: ['normal'] },
  { keys: ['leader', 'q'], action: 'quit', description: 'Quit', mode: ['normal'] },
  
  // === Standard shortcuts ===
  { keys: ['/', ''], action: 'search.focus', description: 'Focus search', mode: ['normal'] },
  { keys: [':', ''], action: 'command.palette', description: 'Command palette', mode: ['normal'] },
  { keys: ['Escape'], action: 'mode.normal', description: 'Normal mode', mode: ['insert', 'visual', 'command'] },
  { keys: ['i'], action: 'mode.insert', description: 'Insert mode', mode: ['normal'] },
  { keys: ['v'], action: 'mode.visual', description: 'Visual mode', mode: ['normal'] },
  { keys: ['j'], action: 'cursor.down', description: 'Down', mode: ['normal'] },
  { keys: ['k'], action: 'cursor.up', description: 'Up', mode: ['normal'] },
  { keys: ['h'], action: 'cursor.left', description: 'Left', mode: ['normal'] },
  { keys: ['l'], action: 'cursor.right', description: 'Right', mode: ['normal'] },
  { keys: ['g', 'g'], action: 'cursor.top', description: 'Go to top', mode: ['normal'] },
  { keys: ['G'], action: 'cursor.bottom', description: 'Go to bottom', mode: ['normal'] },
  { keys: ['Ctrl+d'], action: 'scroll.down', description: 'Scroll down', mode: ['normal'] },
  { keys: ['Ctrl+u'], action: 'scroll.up', description: 'Scroll up', mode: ['normal'] },
  
  // === Chat/Query chords ===
  { keys: ['leader', 'c'], action: 'chat.group', description: 'Chat', mode: ['normal', 'command'] },
  { keys: ['leader', 'c', 'c'], action: 'chat.open', description: 'Open chat', mode: ['normal'] },
  { keys: ['leader', 'c', 'n'], action: 'chat.new', description: 'New chat', mode: ['normal'] },
  { keys: ['leader', 'c', 'l'], action: 'chat.label', description: 'Label this', mode: ['normal'] },
  { keys: ['leader', 't'], action: 'tag.group', description: 'Tags/Label', mode: ['normal', 'command'] },
  { keys: ['leader', 't', 'a'], action: 'tag.approve', description: 'Approve', mode: ['normal'] },
  { keys: ['leader', 't', 'r'], action: 'tag.reject', description: 'Reject', mode: ['normal'] },
  { keys: ['leader', 't', 'e'], action: 'tag.edit', description: 'Edit gold answer', mode: ['normal'] },
];

// Visual mode indicator colors
export const modeColors: Record<ModalMode, string> = {
  normal: '#a6e22e',    // cyan/green — "ready"
  insert: '#fd971f',    // orange — "typing"
  command: '#66d9ef',   // blue — "thinking"
  visual: '#ae81ff',    // magenta — "selecting"
};

export type ChordToken = typeof defaultChords;
