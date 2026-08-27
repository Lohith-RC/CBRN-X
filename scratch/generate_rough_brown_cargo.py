import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

out_dir = "Assets/Textures/Generated"
os.makedirs(out_dir, exist_ok=True)

def normal_from_height(height_map, strength=4.5):
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

print("Generating Rough Brown Industrial Cargo Textures with Depth Effect...")

# 1. Base Rich Brown Wood / Heavy-Duty Kraft Fiber Planks
wood_base = np.zeros((size, size, 3), dtype=np.float32)
wood_base[:, :, 0] = 135 # Red/Brown
wood_base[:, :, 1] = 90  # Earth Green/Brown
wood_base[:, :, 2] = 52  # Deep Earth

height_map = np.ones((size, size), dtype=np.uint8) * 128
rough_map = np.ones((size, size), dtype=np.uint8) * 215

# Fine wood grain & rough fiber noise
y_coords, x_coords = np.mgrid[0:size, 0:size]
grain = np.sin(y_coords * 0.08 + np.sin(x_coords * 0.02) * 5.0) * 12.0
noise = np.random.normal(0, 15, (size, size))
rough_surface = np.clip(grain + noise, -35, 35)

for c in range(3):
    wood_base[:, :, c] = np.clip(wood_base[:, :, c] + rough_surface * (0.8 if c == 0 else 0.6), 25, 235)

height_map = np.clip(height_map.astype(np.float32) + rough_surface * 1.5, 10, 245).astype(np.uint8)

cargo_img = Image.fromarray(wood_base.astype(np.uint8), mode='RGB')
draw_cargo = ImageDraw.Draw(cargo_img)

# Deep Planking Grooves (Horizontal seams with shadows and highlights)
for py in [0, 256, 512, 768, 1023]:
    draw_cargo.line([(0, py), (size, py)], fill=(35, 22, 12), width=8)
    draw_cargo.line([(0, py + 5), (size, py + 5)], fill=(175, 125, 75), width=2)
    height_map[max(0, py - 4):min(size, py + 4), :] = 40

# Heavy Steel Corner Reinforcement Brackets
bracket_w = 90
for cx, cy in [(0, 0), (size - bracket_w, 0), (0, size - bracket_w), (size - bracket_w, size - bracket_w)]:
    draw_cargo.rectangle([(cx, cy), (cx + bracket_w, cy + bracket_w)], fill=(45, 48, 52), outline=(25, 28, 30))
    height_map[cy:cy + bracket_w, cx:cx + bracket_w] = 210
    rx = cx + bracket_w // 2
    ry = cy + bracket_w // 2
    draw_cargo.ellipse([(rx - 8, ry - 8), (rx + 8, ry + 8)], fill=(120, 125, 130), outline=(20, 20, 20))
    height_map[ry - 6:ry + 6, rx - 6:rx + 6] = 250

# Vertical Metal Tension Straps
for sx in [320, 700]:
    draw_cargo.rectangle([(sx - 16, 0), (sx + 16, size)], fill=(50, 52, 56), outline=(28, 30, 32))
    height_map[:, sx - 16:sx + 16] = 190
    for sy in [128, 384, 640, 896]:
        draw_cargo.rectangle([(sx - 20, sy - 14), (sx + 20, sy + 14)], fill=(130, 135, 142), outline=(20, 20, 20))
        height_map[sy - 14:sy + 14, sx - 20:sx + 20] = 235

# Stamped Industrial Hazard Stencils
draw_cargo.rectangle([(80, 310), (280, 460)], fill=(235, 235, 235), outline=(30, 30, 30))
draw_cargo.rectangle([(85, 315), (275, 385)], fill=(30, 30, 30))
draw_cargo.text((105, 335), "CORROSIVE", fill=(240, 240, 240))
draw_cargo.text((140, 400), "8", fill=(30, 30, 30))

draw_cargo.text((370, 320), "UN 1760 / HAZMAT CLASS 8 / PG II", fill=(25, 20, 15))
draw_cargo.text((370, 350), "NET WT: 850 KG (1,874 LBS) - LOT #B02-884", fill=(25, 20, 15))
draw_cargo.text((370, 380), "BAY 02 CHEMICAL STORAGE LOGISTICS", fill=(25, 20, 15))
draw_cargo.text((370, 410), "CAUTION: HIGH CORROSIVITY - LEVEL B REQUIRED", fill=(160, 25, 15))

draw_cargo.rectangle([(750, 310), (950, 460)], fill=(225, 185, 25), outline=(30, 30, 30))
draw_cargo.text((780, 340), "THIS SIDE UP", fill=(20, 20, 20))
draw_cargo.text((795, 380), "▲ ▲ ▲", fill=(20, 20, 20))
draw_cargo.text((785, 420), "FRAGILE", fill=(20, 20, 20))

cargo_img.save(os.path.join(out_dir, "Tex_CargoRoughBrown_Albedo.png"))
normal_from_height(height_map, strength=4.5).save(os.path.join(out_dir, "Tex_CargoRoughBrown_Normal.png"))

rough_img = Image.fromarray(rough_map, mode='L')
rough_img.save(os.path.join(out_dir, "Tex_CargoRoughBrown_Roughness.png"))

print("Rough Brown Industrial Cargo textures generated successfully!")
