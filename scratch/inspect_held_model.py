import re

with open('Assets/Scenes/StorageBay03_Training.unity', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

def get_block(type_id, comp_id):
    pattern = rf'--- !u!{type_id} &{comp_id}\n(.*?)(?=\n--- !u!\d+ &\d+|\Z)'
    m = re.search(pattern, text, re.DOTALL)
    return m.group(1) if m else ""

print("=== GameObject 550471971 (Held_GasDetector_PID) ===")
print(get_block("1", "550471971"))

# Find its transform
m = re.search(r'--- !u!1 &550471971\nGameObject:.*?- component: {fileID: (\d+)}', text, re.DOTALL)
if m:
    trans_id = m.group(1)
    print(f"=== Transform {trans_id} ===")
    t_block = get_block("4", trans_id)
    print(t_block)
    # find children
    child_ids = re.findall(r'- {fileID: (\d+)}', t_block)
    print(f"Children of transform {trans_id}: {child_ids}")
    for cid in child_ids:
        print(f"--- Child transform {cid} ---")
        print(get_block("4", cid))
