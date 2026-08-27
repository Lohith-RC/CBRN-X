import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

out_dir = "Assets/Textures/Generated"
os.makedirs(out_dir, exist_ok=True)

def normal_from_height(height_map, strength=2.8):
    h_norm = height_map.astype(np.float32) / 255.0
    dx = np.zeros_like(h_norm)
    dy = np.zeros_like(h_norm)
    dx[:, 1:-1] = (h_norm[:, 2:] - h_norm[:, :-2]) * 0.5 * strength
    dy[1:-1, :] = (h_norm[2:, :] - h_norm[:-2, :]) * 0.5 * strength
    dz = np.ones_like(h_norm)
    norm = np.sqrt(dx**2 + dy**2 + dz**2)
    nx = (-dx / norm) * 0.5 + 0.5
    ny = (-dy / norm) * 0.5 + 0.5
    nz = (dz / norm) * 0.5 + 0.5
    rgb = np.stack([nx * 255, ny * 255, nz * 255], axis=2).astype(np.uint8)
    return Image.fromarray(rgb, mode='RGB')

size = 1024
np.random.seed(2026)

# =========================================================================
# 1. MASSIVE INDUSTRIAL STORAGE TANK (15,000 GALLON PRESSURE VESSEL)
# =========================================================================
print("Generating Massive Industrial Storage Tank Textures...")
tank_img = Image.new("RGB", (size, size), color=(210, 215, 225)) # Industrial Galvanized Coated Steel
draw_tank = ImageDraw.Draw(tank_img)
h_tank = np.ones((size, size), dtype=np.uint8) * 128

# Vertical metal sheet weld seams every 256px
for x in [0, 256, 512, 768, 1023]:
    draw_tank.line([(x, 0), (x, size)], fill=(50, 55, 62), width=6)
    draw_tank.line([(x - 2, 0), (x - 2, size)], fill=(240, 245, 255), width=2)
    h_tank[:, max(0, x - 3):min(size, x + 3)] = 70

# Horizontal heavy reinforcement ring bands (every 220px)
for y in [180, 420, 660, 900]:
    draw_tank.rectangle([(0, y - 18), (size, y + 18)], fill=(160, 168, 180), outline=(70, 75, 85))
    h_tank[y - 18:y + 18, :] = 220
    # Heavy industrial bolts along ring
    for bx in range(20, size, 48):
        draw_tank.ellipse([(bx - 6, y - 6), (bx + 6, y + 6)], fill=(225, 230, 240), outline=(40, 42, 48))

# Vibrant Safety Hazard Stencils & Chemical Placards
# NFPA 704 Diamond Placard & UN 1017 Stencil
draw_tank.rectangle([(0, 470), (size, 610)], fill=(240, 205, 15)) # Bright safety yellow band
draw_tank.rectangle([(0, 475), (size, 490)], fill=(20, 20, 20))
draw_tank.rectangle([(0, 590), (size, 605)], fill=(20, 20, 20))

draw_tank.text((60, 505), "DANGER: HIGH PRESSURE CHEMICAL VESSEL - TANK TK-03A", fill=(20, 20, 20))
draw_tank.text((60, 535), "UN 1017 CHLORINE GAS (LIQUEFIED) - CAPACITY: 15,000 GAL (56,700 L)", fill=(20, 20, 20))
draw_tank.text((60, 565), "MAX OPERATING PRESSURE: 25.0 BAR (362 PSI) | CLASS 2.3 TOXIC GAS", fill=(180, 20, 10))

# Level Sight Glass Column along right side
draw_tank.rectangle([(910, 100), (960, 950)], fill=(15, 30, 45), outline=(120, 130, 145))
# Glowing chemical fluid level inside column
draw_tank.rectangle([(920, 380), (950, 940)], fill=(60, 240, 110))

tank_img.save(os.path.join(out_dir, "Tex_MassiveTank_Albedo.png"))
normal_from_height(h_tank, strength=3.0).save(os.path.join(out_dir, "Tex_MassiveTank_Normal.png"))

# Tank Emissive Map (Glowing digital sight glass & hazard warnings)
tank_emiss = Image.new("RGB", (size, size), color=(0, 0, 0))
draw_te = ImageDraw.Draw(tank_emiss)
draw_te.rectangle([(920, 380), (950, 940)], fill=(60, 255, 120))
draw_te.text((60, 565), "MAX OPERATING PRESSURE: 25.0 BAR (362 PSI) | CLASS 2.3 TOXIC GAS", fill=(255, 40, 20))
tank_emiss.save(os.path.join(out_dir, "Tex_MassiveTank_Emissive.png"))

print("Massive Industrial Storage Tank textures generated successfully!")
