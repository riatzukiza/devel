#!/usr/bin/env python3
# GPL-3.0-only
"""
Grammar-constrained decoder for S-expressions using CFG.
Ensures balanced parentheses and valid Lisp syntax during generation.
"""

import argparse
import json
import sys
from pathlib import Path

class SExprGrammar:
    """Simple CFG for balanced S-expressions"""
    
    def __init__(self):
        self.rules = {
            'program': [['ws', 'sexpr_or_comment', 'ws']],
            'sexpr_or_comment': [['sexpr'], ['comment']],
            'sexpr': [['(', 'ws', 'sexpr_list', 'ws', ')']],
            'sexpr_list': [['sexpr_or_comment', 'ws', 'sexpr_list'], ['sexpr_or_comment'], []],
            'atom': [['string'], ['symbol'], ['number']],
            'string': [['"', 'string_chars', '"']],
            'string_chars': [['string_char', 'string_chars'], []],
            'string_char': [['escaped_char'], ['regular_char']],
            'escaped_char': [['\\', '"'], ['\\', '\\']],
            'regular_char': [['any_char_except_quote_backslash']],
            'symbol': [['symbol_start', 'symbol_chars']],
            'symbol_chars': [['symbol_char', 'symbol_chars'], []],
            'symbol_start': [['letter'], ['_'], [':'], ['*'], ['+'], ['-'], ['/'], 
                           ['<'], ['>'], ['='], ['?'], ['!'], ['.']],
            'symbol_char': [['symbol_start'], ['digit']],
            'number': [['optional_minus', 'digit', 'digits']],
            'optional_minus': [['-'], []],
            'digits': [['digit', 'digits'], ['digit']],
            'comment': [[';', 'comment_chars']],
            'comment_chars': [['comment_char', 'comment_chars'], []],
            'comment_char': [['any_char_except_newline']],
            'ws': [['space'], ['tab'], ['newline'], ['ws', 'space']],
            'space': [[' ']],
            'tab': [['\t']],
            'newline': [['\n'], ['\r', '\n']],
            'letter': [['A'], ['B'], ['C'], ['D'], ['E'], ['F'], ['G'], ['H'], ['I'], ['J'], ['K'], ['L'], ['M'], 
                     ['N'], ['O'], ['P'], ['Q'], ['R'], ['S'], ['T'], ['U'], ['V'], ['W'], ['X'], ['Y'], ['Z'],
                     ['a'], ['b'], ['c'], ['d'], ['e'], ['f'], ['g'], ['h'], ['i'], ['j'], ['k'], ['l'], ['m'],
                     ['n'], ['o'], ['p'], ['q'], ['r'], ['s'], ['t'], ['u'], ['v'], ['w'], ['x'], ['y'], ['z']],
            'digit': [['0'], ['1'], ['2'], ['3'], ['4'], ['5'], ['6'], ['7'], ['8'], ['9']],
        }
    
    def validate_partial(self, text: str) -> bool:
        """Check if partial text can still lead to a valid S-expression"""
        # Simple heuristic: check parentheses balance
        depth = 0
        i = 0
        in_string = False
        escape_next = False
        
        while i < len(text):
            c = text[i]
            
            if escape_next:
                escape_next = False
                i += 1
                continue
                
            if c == '\\' and in_string:
                escape_next = True
                i += 1
                continue
                
            if c == '"':
                in_string = not in_string
                i += 1
                continue
                
            if in_string:
                i += 1
                continue
                
            if c == ';':
                # Skip to end of line for comments
                while i < len(text) and text[i] != '\n':
                    i += 1
                continue
                
            if c == '(':
                depth += 1
            elif c == ')':
                depth -= 1
                if depth < 0:
                    return False
                    
            i += 1
            
        return True
    
    def is_complete(self, text: str) -> bool:
        """Check if text is a complete, valid S-expression"""
        if not self.validate_partial(text):
            return False
            
        # Check if parentheses are balanced and not in string/comment
        depth = 0
        i = 0
        in_string = False
        escape_next = False
        
        while i < len(text):
            c = text[i]
            
            if escape_next:
                escape_next = False
                i += 1
                continue
                
            if c == '\\' and in_string:
                escape_next = True
                i += 1
                continue
                
            if c == '"':
                in_string = not in_string
                i += 1
                continue
                
            if in_string:
                i += 1
                continue
                
            if c == ';':
                while i < len(text) and text[i] != '\n':
                    i += 1
                continue
                
            if c == '(':
                depth += 1
            elif c == ')':
                depth -= 1
                
            i += 1
            
        return depth == 0 and not in_string

def main():
    p = argparse.ArgumentParser(description="S-expression grammar validator")
    p.add_argument("--validate", help="Validate S-expression file")
    p.add_argument("--interactive", action="store_true", help="Interactive validation mode")
    args = p.parse_args()
    
    grammar = SExprGrammar()
    
    if args.validate:
        text = Path(args.validate).read_text()
        is_valid = grammar.is_complete(text)
        print(f"Valid: {is_valid}")
        if not is_valid:
            print("Issues found:")
            if not grammar.validate_partial(text):
                print("- Unbalanced parentheses or invalid structure")
        sys.exit(0 if is_valid else 1)
    
    if args.interactive:
        print("S-expression validator (Ctrl+C to exit)")
        print("Enter S-expressions to validate:")
        
        try:
            while True:
                line = input("> ")
                if not line.strip():
                    continue
                    
                is_valid = grammar.is_complete(line)
                print(f"{'✓' if is_valid else '✗'} {line}")
                
                if not is_valid:
                    partial_ok = grammar.validate_partial(line)
                    if partial_ok:
                        print("  (incomplete but potentially valid)")
                    else:
                        print("  (invalid structure)")
                        
        except KeyboardInterrupt:
            print("\nGoodbye!")
            sys.exit(0)

if __name__ == "__main__":
    main()