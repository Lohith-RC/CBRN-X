import os
import hashlib

def get_guid(name):
    return hashlib.md5(name.encode('utf-8')).hexdigest()

tex_dir = "Assets/Textures/Generated"

for f in ["Tex_MassiveTank_Albedo.png", "Tex_MassiveTank_Normal.png", "Tex_MassiveTank_Emissive.png"]:
    meta_path = os.path.join(tex_dir, f + ".meta")
    guid = get_guid("CBRS_TEX_" + f)
    is_normal = "Normal" in f
    
    meta_content = f"""fileFormatVersion: 2
guid: {guid}
TextureImporter:
  internalIDToNameTable: []
  externalObjects: {{}}
  serializedVersion: 13
  mipmaps:
    mipMapMode: 0
    enableMipMap: 1
    sRGBTexture: {0 if is_normal else 1}
    linearTexture: 0
    fadeOut: 0
    borderMipMap: 0
    mipMapsPreserveCoverage: 0
    alphaTestReferenceValue: 0.5
    mipMapFadeDistanceStart: 1
    mipMapFadeDistanceEnd: 3
  bumpmap:
    convertToNormalMap: 0
    externalNormalMap: 0
    heightScale: 0.25
    normalMapFilter: 0
    flipGreenChannel: 0
  isReadable: 0
  streamingMipmaps: 0
  streamingMipmapsPriority: 0
  vTOnly: 0
  ignoreMipmapLimit: 0
  grayScaleToAlpha: 0
  generateCubemap: 6
  cubemapConvolution: 0
  seamlessCubemap: 0
  textureFormat: 1
  maxTextureSize: 2048
  textureSettings:
    serializedVersion: 2
    filterMode: 2
    aniso: 4
    mipBias: 0
    wrapU: 0
    wrapV: 0
    wrapW: 0
  nPOTScale: 1
  lightmap: 0
  compressionQuality: 50
  spriteMode: 0
  spriteExtrude: 1
  spriteMeshType: 1
  alignment: 0
  spritePivot: {{x: 0.5, y: 0.5}}
  spritePixelsToUnits: 100
  spriteBorder: {{x: 0, y: 0, z: 0, w: 0}}
  spriteGenerateFallbackPhysicsShape: 1
  alphaUsage: 1
  alphaIsTransparency: 0
  spriteTessellationDetail: -1
  textureType: {1 if is_normal else 0}
  textureShape: 1
  singleChannelComponent: 0
  flipbookRows: 1
  flipbookColumns: 1
  maxTextureSizeSet: 0
  compressionQualitySet: 0
  textureFormatSet: 0
  ignorePngGamma: 0
  applyGammaDecoding: 0
  swizzle: 0
  cookieLightType: 0
  platformSettings: []
  userData: 
  assetBundleName: 
  assetBundleVariant: 
"""
    with open(meta_path, 'w', encoding='utf-8') as mf:
        mf.write(meta_content)

from setup_disaster_materials import write_urp_lit_pbr

g_tank_alb = get_guid("CBRS_TEX_Tex_MassiveTank_Albedo.png")
g_tank_norm = get_guid("CBRS_TEX_Tex_MassiveTank_Normal.png")
g_tank_emiss = get_guid("CBRS_TEX_Tex_MassiveTank_Emissive.png")

write_urp_lit_pbr("Assets/Mat_MassiveTank.mat", "Mat_MassiveTank", g_tank_alb, g_tank_norm, g_tank_emiss, tiling=(2, 1), smoothness=0.78, metallic=0.82, emissive_color=(1.2, 1.2, 1.2, 1.0))

print("Massive Tank Material created successfully!")
