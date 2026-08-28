import os
import hashlib

def get_guid(name):
    h = hashlib.md5(name.encode('utf-8')).hexdigest()
    return h

tex_dir = "Assets/Textures/Generated"
os.makedirs(tex_dir, exist_ok=True)

# 1. Generate .meta for all textures in Assets/Textures/Generated
files = [f for f in os.listdir(tex_dir) if f.endswith('.png')]

for f in files:
    meta_path = os.path.join(tex_dir, f + ".meta")
    guid = get_guid("CBRS_TEX_" + f)
    is_normal = "Normal" in f or "normal" in f
    tex_type = 1 if is_normal else 0
    srgb = 0 if is_normal else 1
    
    meta_content = f"""fileFormatVersion: 2
guid: {guid}
TextureImporter:
  internalIDToNameTable: []
  externalObjects: {{}}
  serializedVersion: 13
  mipmaps:
    mipMapMode: 0
    enableMipMap: 1
    sRGBTexture: {srgb}
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
  textureType: {tex_type}
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
    print(f"Created meta: {meta_path} [guid: {guid}]")

# Helper to write a URP Lit Material
def create_urp_lit_mat(mat_path, mat_name, albedo_guid, normal_guid=None, tiling=(1, 1), smoothness=0.5, metallic=0.0, base_color=(1,1,1,1)):
    r, g, b, a = base_color
    tx, ty = tiling
    has_normal = normal_guid is not None
    keywords = ["_NORMALMAP"] if has_normal else []
    kw_str = "\n".join([f"  - {kw}" for kw in keywords])
    
    if has_normal:
        normal_tex_block = f"""    - _BumpMap:
        m_Texture: {{fileID: 2800000, guid: {normal_guid}, type: 3}}
        m_Scale: {{x: {tx}, y: {ty}}}
        m_Offset: {{x: 0, y: 0}}"""
    else:
        normal_tex_block = """    - _BumpMap:
        m_Texture: {fileID: 0}
        m_Scale: {x: 1, y: 1}
        m_Offset: {x: 0, y: 0}"""

    mat_content = f"""%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!21 &2100000
Material:
  serializedVersion: 8
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {{fileID: 0}}
  m_PrefabInstance: {{fileID: 0}}
  m_PrefabAsset: {{fileID: 0}}
  m_Name: {mat_name}
  m_Shader: {{fileID: 4800000, guid: 933532a4fcc9baf4fa0491de14d08ed7, type: 3}}
  m_Parent: {{fileID: 0}}
  m_ModifiedSerializedProperties: 0
  m_ValidKeywords:
{kw_str}
  m_InvalidKeywords: []
  m_LightmapFlags: 4
  m_EnableInstancingVariants: 1
  m_DoubleSidedGI: 0
  m_CustomRenderQueue: -1
  stringTagMap:
    RenderType: Opaque
  disabledShaderPasses:
  - MOTIONVECTORS
  m_LockedProperties: 
  m_SavedProperties:
    serializedVersion: 3
    m_TexEnvs:
    - _BaseMap:
        m_Texture: {{fileID: 2800000, guid: {albedo_guid}, type: 3}}
        m_Scale: {{x: {tx}, y: {ty}}}
        m_Offset: {{x: 0, y: 0}}
{normal_tex_block}
    - _DetailAlbedoMap:
        m_Texture: {{fileID: 0}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    - _DetailMask:
        m_Texture: {{fileID: 0}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    - _DetailNormalMap:
        m_Texture: {{fileID: 0}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    - _EmissionMap:
        m_Texture: {{fileID: 0}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    - _MainTex:
        m_Texture: {{fileID: 2800000, guid: {albedo_guid}, type: 3}}
        m_Scale: {{x: {tx}, y: {ty}}}
        m_Offset: {{x: 0, y: 0}}
    - _MetallicGlossMap:
        m_Texture: {{fileID: 0}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    - _OcclusionMap:
        m_Texture: {{fileID: 0}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    - _ParallaxMap:
        m_Texture: {{fileID: 0}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    - _SpecGlossMap:
        m_Texture: {{fileID: 0}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    m_Ints: []
    m_Floats:
    - _AlphaClip: 0
    - _AlphaToMask: 0
    - _Blend: 0
    - _BlendModePreserveSpecular: 1
    - _BumpScale: 1
    - _ClearCoatMask: 0
    - _ClearCoatSmoothness: 0
    - _Cull: 2
    - _Cutoff: 0.5
    - _DetailAlbedoMapScale: 1
    - _DetailNormalMapScale: 1
    - _DstBlend: 0
    - _DstBlendAlpha: 0
    - _EnvironmentReflections: 1
    - _GlossMapScale: 0
    - _Glossiness: {smoothness}
    - _GlossyReflections: 0
    - _Metallic: {metallic}
    - _OcclusionStrength: 1
    - _Parallax: 0.005
    - _QueueOffset: 0
    - _ReceiveShadows: 1
    - _Smoothness: {smoothness}
    - _SmoothnessTextureChannel: 0
    - _SpecularHighlights: 1
    - _SrcBlend: 1
    - _SrcBlendAlpha: 1
    - _Surface: 0
    - _WorkflowMode: 1
    - _ZWrite: 1
    m_Colors:
    - _BaseColor: {{r: {r}, g: {g}, b: {b}, a: {a}}}
    - _Color: {{r: {r}, g: {g}, b: {b}, a: {a}}}
    - _EmissionColor: {{r: 0, g: 0, b: 0, a: 1}}
    - _SpecColor: {{r: 0.2, g: 0.2, b: 0.2, a: 1}}
  m_BuildTextureStacks: []
  m_AllowLocking: 1
--- !u!114 &1115161048
MonoBehaviour:
  m_ObjectHideFlags: 11
  m_CorrespondingSourceObject: {{fileID: 0}}
  m_PrefabInstance: {{fileID: 0}}
  m_PrefabAsset: {{fileID: 0}}
  m_GameObject: {{fileID: 0}}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {{fileID: 11500000, guid: d0353a89b1f911e48b9e16bdc9f2e058, type: 3}}
  m_Name: 
  m_EditorClassIdentifier: Unity.RenderPipelines.Universal.Editor::UnityEditor.Rendering.Universal.AssetVersion
  version: 10
"""
    with open(mat_path, 'w', encoding='utf-8') as f:
        f.write(mat_content)
    print(f"Updated Material: {mat_path}")

# GUID Lookups
guid_floor_alb = get_guid("CBRS_TEX_Tex_WarehouseFloor_Albedo.png")
guid_floor_norm = get_guid("CBRS_TEX_Tex_WarehouseFloor_Normal.png")
guid_floor_dark = get_guid("CBRS_TEX_Tex_WarehouseFloor_Dark_Albedo.png")
guid_wall_alb = get_guid("CBRS_TEX_Tex_CorrugatedWall_Albedo.png")
guid_wall_norm = get_guid("CBRS_TEX_Tex_CorrugatedWall_Normal.png")
guid_drum_alb = get_guid("CBRS_TEX_Tex_ChemicalDrum_Albedo.png")
guid_drum_norm = get_guid("CBRS_TEX_Tex_ChemicalDrum_Normal.png")
guid_drum_leak = get_guid("CBRS_TEX_Tex_ChemicalDrum_Leaking_Albedo.png")
guid_steel_alb = get_guid("CBRS_TEX_Tex_BrushedSteel_Albedo.png")
guid_steel_norm = get_guid("CBRS_TEX_Tex_BrushedSteel_Normal.png")
guid_hazard_alb = get_guid("CBRS_TEX_Tex_HazardChevron_Albedo.png")
guid_rack_b_alb = get_guid("CBRS_TEX_Tex_RackSteel_Blue_Albedo.png")
guid_rack_o_alb = get_guid("CBRS_TEX_Tex_RackSteel_Orange_Albedo.png")
guid_pallet_alb = get_guid("CBRS_TEX_Tex_WoodPallet_Albedo.png")
guid_pallet_norm = get_guid("CBRS_TEX_Tex_WoodPallet_Normal.png")
guid_shutter_alb = get_guid("CBRS_TEX_Tex_RollUpShutter_Albedo.png")
guid_shutter_norm = get_guid("CBRS_TEX_Tex_RollUpShutter_Normal.png")

# Configure Materials
create_urp_lit_mat("Assets/Mat_ConcreteFloor.mat", "Mat_ConcreteFloor", guid_floor_alb, guid_floor_norm, tiling=(6, 7), smoothness=0.42, metallic=0.05)
create_urp_lit_mat("Assets/Mat_ConcreteDark.mat", "Mat_ConcreteDark", guid_floor_dark, guid_floor_norm, tiling=(4, 3), smoothness=0.35, metallic=0.05)
create_urp_lit_mat("Assets/Mat_IndustrialWall.mat", "Mat_IndustrialWall", guid_wall_alb, guid_wall_norm, tiling=(8, 2), smoothness=0.55, metallic=0.60)
create_urp_lit_mat("Assets/Mat_ChemicalDrum.mat", "Mat_ChemicalDrum", guid_drum_alb, guid_drum_norm, tiling=(1, 1), smoothness=0.65, metallic=0.75)
create_urp_lit_mat("Assets/Mat_LeakingDrum.mat", "Mat_LeakingDrum", guid_drum_leak, guid_drum_norm, tiling=(1, 1), smoothness=0.75, metallic=0.70)
create_urp_lit_mat("Assets/Mat_StainlessSteel.mat", "Mat_StainlessSteel", guid_steel_alb, guid_steel_norm, tiling=(2, 2), smoothness=0.88, metallic=0.92)
create_urp_lit_mat("Assets/Mat_SafetyYellow.mat", "Mat_SafetyYellow", guid_hazard_alb, None, tiling=(6, 1), smoothness=0.45, metallic=0.10)
create_urp_lit_mat("Assets/Mat_RackBlue.mat", "Mat_RackBlue", guid_rack_b_alb, None, tiling=(1, 4), smoothness=0.52, metallic=0.65)
create_urp_lit_mat("Assets/Mat_RackOrange.mat", "Mat_RackOrange", guid_rack_o_alb, None, tiling=(4, 1), smoothness=0.52, metallic=0.65)
create_urp_lit_mat("Assets/Mat_PalletWood.mat", "Mat_PalletWood", guid_pallet_alb, guid_pallet_norm, tiling=(1, 1), smoothness=0.22, metallic=0.0)
create_urp_lit_mat("Assets/Mat_SteelBeam.mat", "Mat_SteelBeam", guid_shutter_alb, guid_shutter_norm, tiling=(2, 1), smoothness=0.68, metallic=0.85)

print("All impressive PBR materials configured successfully!")
