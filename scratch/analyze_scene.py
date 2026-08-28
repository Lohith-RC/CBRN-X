import re

with open('Assets/Scenes/StorageBay03_Training.unity', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Find all GameObject definitions
matches = re.finditer(r'--- !u!1 &(\d+)\nGameObject:[^\n]*\n(?:  [^\n]*\n)*?  m_Name: ([^\n]+)', text)

found = []
for m in matches:
    fid, name = m.group(1), m.group(2).strip()
    if any(k in name.lower() for k in ['responder', 'player', 'camera', 'detector', 'ppe', 'navigation', 'waypoint', 'door', 'barrier', 'manager', 'cctv']):
        found.append((fid, name))

print(f"Found {len(found)} relevant GameObjects:")
for fid, name in found:
    print(f"  [{fid}] {name}")
