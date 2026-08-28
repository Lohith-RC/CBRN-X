import os
import hashlib

def get_guid(name):
    return hashlib.md5(name.encode('utf-8')).hexdigest()

tex_dir = "Assets/Textures/Generated"

# 1. Generate .meta files for any newly generated textures
for f in os.listdir(tex_dir):
    if f.endswith('.png'):
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

# Helper to write URP Lit Material with optional Normal & Emissive
def write_urp_lit_pbr(mat_path, mat_name, albedo_guid, normal_guid=None, emissive_guid=None, tiling=(1,1), smoothness=0.5, metallic=0.0, base_color=(1,1,1,1), emissive_color=(0,0,0,1)):
    r, g, b, a = base_color
    er, eg, eb, ea = emissive_color
    tx, ty = tiling
    
    keywords = []
    if normal_guid: keywords.append("_NORMALMAP")
    if emissive_guid or (er > 0 or eg > 0 or eb > 0): keywords.append("_EMISSION")
    kw_str = "\n".join([f"  - {kw}" for kw in keywords])
    
    normal_block = f"""    - _BumpMap:
        m_Texture: {{fileID: 2800000, guid: {normal_guid}, type: 3}}
        m_Scale: {{x: {tx}, y: {ty}}}
        m_Offset: {{x: 0, y: 0}}""" if normal_guid else """    - _BumpMap:
        m_Texture: {fileID: 0}
        m_Scale: {x: 1, y: 1}
        m_Offset: {x: 0, y: 0}"""

    emiss_tex_block = f"""    - _EmissionMap:
        m_Texture: {{fileID: 2800000, guid: {emissive_guid}, type: 3}}
        m_Scale: {{x: {tx}, y: {ty}}}
        m_Offset: {{x: 0, y: 0}}""" if emissive_guid else """    - _EmissionMap:
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
{normal_block}
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
{emiss_tex_block}
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
    - _EmissionColor: {{r: {er}, g: {eg}, b: {eb}, a: {ea}}}
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
    print(f"Created/Updated Material: {mat_path}")

# GUIDs
g_ibc_alb = get_guid("CBRS_TEX_Tex_IBCTote_Albedo.png")
g_ibc_norm = get_guid("CBRS_TEX_Tex_IBCTote_Normal.png")
g_box_alb = get_guid("CBRS_TEX_Tex_ChemicalBox_Albedo.png")
g_box_norm = get_guid("CBRS_TEX_Tex_ChemicalBox_Normal.png")
g_spill_alb = get_guid("CBRS_TEX_Tex_CorrosiveCrater_Albedo.png")
g_spill_norm = get_guid("CBRS_TEX_Tex_CorrosiveCrater_Normal.png")
g_spill_emiss = get_guid("CBRS_TEX_Tex_CorrosiveCrater_Emissive.png")
g_pel_alb = get_guid("CBRS_TEX_Tex_PelicanCase_Albedo.png")
g_pel_norm = get_guid("CBRS_TEX_Tex_PelicanCase_Normal.png")
g_scba_alb = get_guid("CBRS_TEX_Tex_SCBATank_Albedo.png")
g_scba_norm = get_guid("CBRS_TEX_Tex_SCBATank_Normal.png")
g_pan_alb = get_guid("CBRS_TEX_Tex_StatusPanel_Albedo.png")
g_pan_emiss = get_guid("CBRS_TEX_Tex_StatusPanel_Emissive.png")
g_truss_alb = get_guid("CBRS_TEX_Tex_TrussSteel_Albedo.png")
g_truss_norm = get_guid("CBRS_TEX_Tex_TrussSteel_Normal.png")
g_hazard_alb = get_guid("CBRS_TEX_Tex_HazardChevron_Albedo.png")

# Create Materials
write_urp_lit_pbr("Assets/Mat_IBCTote.mat", "Mat_IBCTote", g_ibc_alb, g_ibc_norm, None, tiling=(1,1), smoothness=0.75, metallic=0.6)
write_urp_lit_pbr("Assets/Mat_ChemicalBox.mat", "Mat_ChemicalBox", g_box_alb, g_box_norm, None, tiling=(1,1), smoothness=0.42, metallic=0.05)
write_urp_lit_pbr("Assets/Mat_CorrosiveCrater.mat", "Mat_CorrosiveCrater", g_spill_alb, g_spill_norm, g_spill_emiss, tiling=(1,1), smoothness=0.88, metallic=0.1, emissive_color=(0.85, 1.4, 0.15, 1.0))
write_urp_lit_pbr("Assets/Mat_PelicanCase.mat", "Mat_PelicanCase", g_pel_alb, g_pel_norm, None, tiling=(1,1), smoothness=0.68, metallic=0.25)
write_urp_lit_pbr("Assets/Mat_SCBATank.mat", "Mat_SCBATank", g_scba_alb, g_scba_norm, None, tiling=(1,1), smoothness=0.82, metallic=0.85)
write_urp_lit_pbr("Assets/Mat_StatusPanel.mat", "Mat_StatusPanel", g_pan_alb, None, g_pan_emiss, tiling=(1,1), smoothness=0.60, metallic=0.35, emissive_color=(1.2, 1.2, 1.2, 1.0))
write_urp_lit_pbr("Assets/Mat_TrussSteel.mat", "Mat_TrussSteel", g_truss_alb, g_truss_norm, None, tiling=(4,1), smoothness=0.58, metallic=0.78)
write_urp_lit_pbr("Assets/Mat_BermYellow.mat", "Mat_BermYellow", g_hazard_alb, None, None, tiling=(8,1), smoothness=0.70, metallic=0.15, base_color=(1.0, 0.85, 0.05, 1.0))

print("All disaster PBR materials configured successfully!")
