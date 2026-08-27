import re

with open('Assets/Scenes/StorageBay03_Training.unity', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

def inspect_go(go_id):
    pattern = rf'--- !u!1 &{go_id}\nGameObject:(.*?)(?=\n--- !u!\d+ &\d+|\Z)'
    match = re.search(pattern, text, re.DOTALL)
    if match:
        print(f"=== GameObject {go_id} ===")
        print(match.group(1)[:1200])
        print("...")

inspect_go("1011628188") # Player_NDRF_Responder
inspect_go("2099566038") # Player_FirstPersonResponder
inspect_go("1083513239") # DOOR_Corrugated_RollUp_Shutter
inspect_go("1690250724") # RollUp_Door_Panel
