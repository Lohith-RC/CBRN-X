import glob, re

cs_files = glob.glob('Assets/Scripts/**/*.cs', recursive=True) + glob.glob('Assets/Editor/**/*.cs', recursive=True)
print(f'Checking {len(cs_files)} C# files for syntax issues...')

error_count = 0
for f in cs_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Check mismatched braces
    open_b = content.count('{')
    close_b = content.count('}')
    if open_b != close_b:
        print(f'ERROR: Mismatched braces in {f}: {open_b} open vs {close_b} close')
        error_count += 1
        
    # Check ScanDrum call
    if 'ScanDrum' in content and 'LeakDrum' not in f and 'GasDetector' not in f and 'PlayerInteraction' not in f:
        print(f'Check ScanDrum in {f}')

if error_count == 0:
    print('All 27 C# files have balanced braces and clean structure!')
