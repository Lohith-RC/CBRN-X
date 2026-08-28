import os
import hashlib

def get_guid(name):
    return hashlib.md5(name.encode('utf-8')).hexdigest()

tex_dir = "Assets/Textures/Generated"

# 1. Generate .meta files for lighting textures
for f in os.listdir(tex_dir):
    if f.endswith('.png') and ('Cookie' in f or 'Volumetric' in f or 'Light' in f):
        meta_path = os.path.join(tex_dir, f + ".meta")
        guid = get_guid("CBRS_TEX_" + f)
        
        is_cookie = "Cookie" in f
        
        meta_content = f"""fileFormatVersion: 2
guid: {guid}
TextureImporter:
  internalIDToNameTable: []
  externalObjects: {{}}
  serializedVersion: 13
  mipmaps:
    mipMapMode: 0
    enableMipMap: 1
    sRGBTexture: {0 if is_cookie else 1}
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
    wrapU: {1 if is_cookie else 0}
    wrapV: {1 if is_cookie else 0}
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
  alphaIsTransparency: 1
  spriteTessellationDetail: -1
  textureType: {0 if not is_cookie else 4}
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
  cookieLightType: {1 if is_cookie else 0}
  platformSettings: []
  userData: 
  assetBundleName: 
  assetBundleVariant: 
"""
        with open(meta_path, 'w', encoding='utf-8') as mf:
            mf.write(meta_content)

def write_volumetric_mat(mat_path, mat_name, tex_guid, color=(1, 1, 1, 0.45), blend_mode=1):
    r, g, b, a = color
    dst_blend = 1 if blend_mode == 1 else 10
    src_blend = 1 if blend_mode == 1 else 5
    
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
  m_Shader: {{fileID: 4800000, guid: 0406db5a14f94604a8c57ccfbc9f3b46, type: 3}}
  m_Parent: {{fileID: 0}}
  m_ModifiedSerializedProperties: 0
  m_ValidKeywords:
  - _SURFACE_TYPE_TRANSPARENT
  m_InvalidKeywords: []
  m_LightmapFlags: 4
  m_EnableInstancingVariants: 0
  m_DoubleSidedGI: 0
  m_CustomRenderQueue: 3100
  stringTagMap:
    RenderType: Transparent
  disabledShaderPasses:
  - DepthOnly
  - SHADOWCASTER
  m_LockedProperties: 
  m_SavedProperties:
    serializedVersion: 3
    m_TexEnvs:
    - _BaseMap:
        m_Texture: {{fileID: 2800000, guid: {tex_guid}, type: 3}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    - _BumpMap:
        m_Texture: {{fileID: 0}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    - _EmissionMap:
        m_Texture: {{fileID: 0}}
        m_Scale: {{x: 1, y: 1}}
        m_Offset: {{x: 0, y: 0}}
    m_Ints: []
    m_Floats:
    - _AlphaClip: 0
    - _AlphaToMask: 0
    - _Blend: {blend_mode}
    - _BlendOp: 0
    - _CameraFadingEnabled: 0
    - _CameraFarFadeDistance: 2
    - _CameraNearFadeDistance: 1
    - _ColorMode: 0
    - _Cull: 0
    - _Cutoff: 0.5
    - _DistortionBlend: 0.5
    - _DistortionEnabled: 0
    - _DistortionStrength: 1
    - _DistortionStrengthScaled: 0.1
    - _DstBlend: {dst_blend}
    - _DstBlendAlpha: {dst_blend}
    - _FlipbookBlending: 0
    - _FlipbookMode: 0
    - _Mode: 0
    - _QueueOffset: 0
    - _SoftParticlesEnabled: 1
    - _SoftParticlesFarFadeDistance: 2.0
    - _SoftParticlesNearFadeDistance: 0
    - _SrcBlend: {src_blend}
    - _SrcBlendAlpha: 1
    - _Surface: 1
    - _ZWrite: 0
    m_Colors:
    - _BaseColor: {{r: {r}, g: {g}, b: {b}, a: {a}}}
    - _BaseColorAddSubDiff: {{r: 0, g: 0, b: 0, a: 0}}
    - _CameraFadeParams: {{r: 0, g: Infinity, b: 0, a: 0}}
    - _Color: {{r: {r}, g: {g}, b: {b}, a: {a}}}
    - _EmissionColor: {{r: 0, g: 0, b: 0, a: 1}}
    - _SoftParticleFadeParams: {{r: 0, g: 2.0, b: 0, a: 0}}
  m_BuildTextureStacks: []
  m_AllowLocking: 1
--- !u!114 &690540803846291991
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
    print(f"Created Volumetric Material: {mat_path}")

g_beam = get_guid("CBRS_TEX_Tex_VolumetricLight_Shaft.png")

# 1. Warm Industrial Luminaire Cone (High-Bay Downlight Shaft)
write_volumetric_mat("Assets/Mat_VolumetricLight_Cone.mat", "Mat_VolumetricLight_Cone", g_beam, color=(1.0, 0.95, 0.85, 0.35), blend_mode=1)

# 2. Cool Skylight Dust Beam
write_volumetric_mat("Assets/Mat_VolumetricLight_Skylight.mat", "Mat_VolumetricLight_Skylight", g_beam, color=(0.85, 0.92, 1.0, 0.28), blend_mode=1)

# 3. Toxic Hazard Zone Vapor Beam
write_volumetric_mat("Assets/Mat_VolumetricLight_ToxicZone.mat", "Mat_VolumetricLight_ToxicZone", g_beam, color=(0.75, 1.0, 0.35, 0.40), blend_mode=1)

print("Volumetric lighting materials configured successfully!")
