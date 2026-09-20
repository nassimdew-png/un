import os
import re

SRC = r'e:\3\frontend\src'
broken_imports = []

for root, dirs, files in os.walk(SRC):
    for f in files:
        if f.endswith(('.js', '.jsx')):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                lines = file.readlines()
            for line_no, line in enumerate(lines, 1):
                m = re.search(r"from\s+['\"](\.[^'\"]+)['\"]", line)
                if m:
                    target = m.group(1)
                    target_dir = os.path.dirname(filepath)
                    resolved = os.path.normpath(os.path.join(target_dir, target))
                    candidates = [
                        resolved,
                        resolved + '.js',
                        resolved + '.jsx',
                        resolved + '.json',
                        resolved + '.css',
                        os.path.join(resolved, 'index.js'),
                        os.path.join(resolved, 'index.jsx')
                    ]
                    if not any(os.path.exists(c) for c in candidates):
                        broken_imports.append((filepath, line_no, target, line.strip()))

print(f"Total broken local imports found: {len(broken_imports)}")
for b in broken_imports:
    print(f"  {os.path.relpath(b[0], SRC)}:{b[1]} -> {b[2]}")
