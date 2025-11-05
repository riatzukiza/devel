#!/usr/bin/env python3
# GPL-3.0-only
"""
Evaluation harness for Lisp-Fixer models.
Tests compilation and runtime correctness across dialects.
"""

import argparse
import json
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Dict, List, Tuple, Any

class LispEvaluator:
    """Evaluates Lisp code fixes across multiple dialects"""
    
    def __init__(self):
        self.dialect_commands = {
            'clj': {
                'compile': ['clojure', '-M', '-e'],
                'test': ['clojure', '-M:test'],
                'file_ext': '.clj'
            },
            'cljs': {
                'compile': ['clojure', '-M:shadow', 'compile'],
                'test': ['clojure', '-M:test'],
                'file_ext': '.cljs'
            },
            'lisp': {
                'compile': ['sbcl', '--script'],
                'test': ['sbcl', '--load'],
                'file_ext': '.lisp'
            },
            'el': {
                'compile': ['emacs', '--batch', '--eval'],
                'test': ['emacs', '--batch', '-l', 'ert', '-f', 'ert-run-tests-batch-and-exit'],
                'file_ext': '.el'
            },
            'scm': {
                'compile': ['guile', '-c'],
                'test': ['guile', '-l'],
                'file_ext': '.scm'
            }
        }
    
    def evaluate_file(self, file_path: Path, dialect: str) -> Dict[str, Any]:
        """Evaluate a single Lisp file"""
        if dialect not in self.dialect_commands:
            return {'error': f'Unsupported dialect: {dialect}'}
        
        config = self.dialect_commands[dialect]
        result = {
            'file': str(file_path),
            'dialect': dialect,
            'compile_success': False,
            'compile_time': 0,
            'test_success': False,
            'test_time': 0,
            'error': None
        }
        
        # Test compilation
        try:
            start_time = time.time()
            compile_cmd = config['compile'] + [str(file_path)]
            compile_result = subprocess.run(
                compile_cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            result['compile_time'] = time.time() - start_time
            result['compile_success'] = compile_result.returncode == 0
            
            if not result['compile_success']:
                result['error'] = compile_result.stderr or compile_result.stdout
                
        except subprocess.TimeoutExpired:
            result['error'] = 'Compilation timeout'
        except Exception as e:
            result['error'] = str(e)
        
        # Test if compilation succeeded
        if result['compile_success']:
            try:
                start_time = time.time()
                test_cmd = config['test'] + [str(file_path)]
                test_result = subprocess.run(
                    test_cmd,
                    capture_output=True,
                    text=True,
                    timeout=60
                )
                result['test_time'] = time.time() - start_time
                result['test_success'] = test_result.returncode == 0
                
                if not result['test_success']:
                    result['error'] = test_result.stderr or test_result.stdout
                    
            except subprocess.TimeoutExpired:
                result['error'] = 'Test timeout'
            except Exception as e:
                result['error'] = str(e)
        
        return result
    
    def evaluate_dataset(self, dataset_path: Path) -> Dict[str, Any]:
        """Evaluate a JSONL dataset of broken→fixed pairs"""
        results = {
            'total_examples': 0,
            'compile_success': 0,
            'test_success': 0,
            'both_success': 0,
            'by_dialect': {},
            'errors': [],
            'examples': []
        }
        
        with open(dataset_path, 'r') as f:
            for line_num, line in enumerate(f, 1):
                try:
                    example = json.loads(line.strip())
                    results['total_examples'] += 1
                    
                    dialect = example.get('dialect', 'unknown')
                    if dialect not in results['by_dialect']:
                        results['by_dialect'][dialect] = {
                            'total': 0,
                            'compile_success': 0,
                            'test_success': 0,
                            'both_success': 0
                        }
                    
                    # Evaluate the fixed code
                    fixed_code = example.get('fixed') or example.get('middle', '')
                    if not fixed_code:
                        continue
                    
                    # Write to temporary file
                    with tempfile.NamedTemporaryFile(
                        mode='w', 
                        suffix=self.dialect_commands.get(dialect, {}).get('file_ext', '.lisp'),
                        delete=False
                    ) as tmp_file:
                        tmp_file.write(fixed_code)
                        tmp_path = Path(tmp_file.name)
                    
                    try:
                        eval_result = self.evaluate_file(tmp_path, dialect)
                        
                        # Update counters
                        if eval_result['compile_success']:
                            results['compile_success'] += 1
                            results['by_dialect'][dialect]['compile_success'] += 1
                        
                        if eval_result['test_success']:
                            results['test_success'] += 1
                            results['by_dialect'][dialect]['test_success'] += 1
                        
                        if eval_result['compile_success'] and eval_result['test_success']:
                            results['both_success'] += 1
                            results['by_dialect'][dialect]['both_success'] += 1
                        
                        results['by_dialect'][dialect]['total'] += 1
                        
                        # Store example result (limit to first 10 for brevity)
                        if len(results['examples']) < 10:
                            results['examples'].append({
                                'line': line_num,
                                'repo': example.get('repo'),
                                'path': example.get('path'),
                                'dialect': dialect,
                                'result': eval_result
                            })
                        
                        if eval_result['error']:
                            results['errors'].append({
                                'line': line_num,
                                'error': eval_result['error']
                            })
                    
                    finally:
                        tmp_path.unlink()  # Clean up temporary file
                        
                except json.JSONDecodeError as e:
                    results['errors'].append({
                        'line': line_num,
                        'error': f'JSON decode error: {e}'
                    })
                except Exception as e:
                    results['errors'].append({
                        'line': line_num,
                        'error': f'Unexpected error: {e}'
                    })
        
        return results
    
    def print_summary(self, results: Dict[str, Any]):
        """Print evaluation summary"""
        total = results['total_examples']
        if total == 0:
            print("No examples to evaluate")
            return
        
        print(f"\n=== Lisp-Fixer Evaluation Results ===")
        print(f"Total examples: {total}")
        print(f"Compile success: {results['compile_success']}/{total} ({results['compile_success']/total*100:.1f}%)")
        print(f"Test success: {results['test_success']}/{total} ({results['test_success']/total*100:.1f}%)")
        print(f"Both success: {results['both_success']}/{total} ({results['both_success']/total*100:.1f}%)")
        
        print(f"\n--- By Dialect ---")
        for dialect, stats in results['by_dialect'].items():
            total_d = stats['total']
            print(f"{dialect}: {stats['both_success']}/{total_d} ({stats['both_success']/total_d*100:.1f}%) both success")
        
        if results['errors']:
            print(f"\n--- Errors ({len(results['errors'])} total) ---")
            for error in results['errors'][:5]:  # Show first 5 errors
                print(f"Line {error['line']}: {error['error']}")
            if len(results['errors']) > 5:
                print(f"... and {len(results['errors']) - 5} more errors")
        
        print(f"\n--- Example Results ---")
        for example in results['examples']:
            status = "✓" if example['result']['compile_success'] and example['result']['test_success'] else "✗"
            print(f"{status} {example['repo']}/{example['path']} ({example['dialect']})")

def main():
    p = argparse.ArgumentParser(description="Lisp-Fixer evaluation harness")
    p.add_argument("--dataset", required=True, help="JSONL dataset to evaluate")
    p.add_argument("--file", help="Single file to evaluate")
    p.add_argument("--dialect", help="Dialect for single file evaluation")
    p.add_argument("--output", help="Output JSON file for results")
    args = p.parse_args()
    
    evaluator = LispEvaluator()
    
    if args.dataset:
        results = evaluator.evaluate_dataset(Path(args.dataset))
        evaluator.print_summary(results)
        
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(results, f, indent=2)
            print(f"\nResults saved to {args.output}")
    
    elif args.file and args.dialect:
        result = evaluator.evaluate_file(Path(args.file), args.dialect)
        print(f"\nFile: {args.file}")
        print(f"Dialect: {args.dialect}")
        print(f"Compile success: {result['compile_success']}")
        print(f"Test success: {result['test_success']}")
        if result['error']:
            print(f"Error: {result['error']}")
    
    else:
        print("Must specify either --dataset or both --file and --dialect")
        exit(1)

if __name__ == "__main__":
    main()