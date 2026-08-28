import re

with open('Assets/Scenes/StorageBay03_Training.unity', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

def get_block(type_id, comp_id):
    pattern = rf'--- !u!{type_id} &{comp_id}\n(.*?)(?=\n--- !u!\d+ &\d+|\Z)'
    m = re.search(pattern, text, re.DOTALL)
    return m.group(1) if m else ""

# Inspect RollUp_Door_Panel transform
print("=== RollUp_Door_Panel Transform ===")
print(get_block("4", "1690250725"))

# Inspect RollUp_Door_Panel Colliders
print("=== RollUp_Door_Panel Colliders / Components ===")
for cid in ["1690250728", "1690250727", "1690250726"]:
    print(get_block(r"\d+", cid))

# Inspect Player_FirstPersonResponder Transform
print("=== Player_FirstPersonResponder Transform (4, 2099566041) ===")
print(get_block("4", "2099566041"))

# Inspect Player_FirstPersonResponder components (2099566040, 2099566039, 2099566042)
print("=== Player_FirstPersonResponder Components ===")
for cid in ["2099566040", "2099566039", "2099566042"]:
    print(get_block(r"\d+", cid))
