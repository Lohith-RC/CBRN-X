import re

with open('Assets/Scenes/StorageBay03_Training.unity', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

docs = text.split('--- !u!')

for doc in docs:
    if 'FirstPersonResponderController' in doc or 'CharacterController' in doc:
        header = doc.strip().split('\n')[0]
        go_m = re.search(r'm_GameObject:\s*\{fileID:\s*(\d+)\}', doc)
        enabled_m = re.search(r'm_Enabled:\s*(\d+)', doc)
        go_id = go_m.group(1) if go_m else "?"
        enabled = enabled_m.group(1) if enabled_m else "?"
        
        # Find GO details
        go_name = "Unknown"
        go_active = "?"
        for gdoc in docs:
            if f'1 &{go_id}\nGameObject:' in gdoc:
                name_m = re.search(r'm_Name:\s*(.+)', gdoc)
                act_m = re.search(r'm_IsActive:\s*(\d+)', gdoc)
                if name_m: go_name = name_m.group(1)
                if act_m: go_active = act_m.group(1)
        
        print(f"{header} | On GO: {go_id} ({go_name}) | GO Active: {go_active} | Component Enabled: {enabled}")
