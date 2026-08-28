import os, glob, re

files = glob.glob('Assets/Scripts/**/*.cs', recursive=True) + glob.glob('Assets/Editor/**/*.cs', recursive=True)
print(f'Scanning {len(files)} C# files for Unity 6 deprecations...')

updated_count = 0

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    # Replace FindFirstObjectByType with FindAnyObjectByType
    new_content = re.sub(r'\bFindFirstObjectByType\b', 'FindAnyObjectByType', new_content)
    
    # Replace FindObjectsByType<T>(FindObjectsSortMode.None) with FindObjectsByType<T>()
    new_content = re.sub(r'FindObjectsByType<([^>]+)>\(FindObjectsSortMode\.None\)', r'FindObjectsByType<\1>()', new_content)
    new_content = re.sub(r'FindObjectsByType<([^>]+)>\(FindObjectsInactive\.Exclude, FindObjectsSortMode\.None\)', r'FindObjectsByType<\1>()', new_content)

    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        updated_count += 1
        print(f'[OK] Cleaned: {file_path}')

print(f'Total files updated: {updated_count}')
