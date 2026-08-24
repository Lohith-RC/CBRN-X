#!/usr/bin/env python3
"""
Unity Asset Store Automation Pipeline (CLI Tool)
Streamlines discovery, indexing, extraction, and project integration of Unity Packages.
"""

import os
import sys
import tarfile
import shutil
import json
import argparse
import platform
from pathlib import Path

def get_asset_store_cache_path() -> Path:
    """Returns the default Unity Asset Store download cache directory based on OS."""
    system = platform.system()
    if system == "Windows":
        app_data = os.environ.get("APPDATA")
        if app_data:
            return Path(app_data) / "Unity" / "Asset Store-5.x"
    elif system == "Darwin":  # macOS
        return Path.home() / "Library" / "Unity" / "Asset Store-5.x"
    elif system == "Linux":
        return Path.home() / ".local" / "share" / "unity3d" / "Asset Store-5.x"
    return Path("./")

def scan_cached_assets(cache_dir: Path):
    """Scans and indexes all downloaded .unitypackage files in the cache directory."""
    if not cache_dir.exists():
        print(f"[!] Cache directory does not exist: {cache_dir}")
        return []

    packages = []
    for root, _, files in os.walk(cache_dir):
        for f in files:
            if f.endswith(".unitypackage"):
                full_path = Path(root) / f
                size_mb = full_path.stat().st_size / (1024 * 1024)
                rel_path = full_path.relative_to(cache_dir)
                publisher = rel_path.parts[0] if len(rel_path.parts) > 1 else "Unknown"
                packages.append({
                    "name": f,
                    "publisher": publisher,
                    "size_mb": round(size_mb, 2),
                    "path": str(full_path)
                })
    return packages

def unpack_unitypackage(package_path: Path, output_assets_dir: Path, target_subfolder: str = None) -> int:
    """
    Extracts a .unitypackage tar archive directly into a target Unity Assets folder.
    Preserves original asset relative paths, metadata, and GUIDs.
    """
    if not package_path.exists():
        print(f"[ERROR] Package not found: {package_path}")
        return 0

    temp_extract = output_assets_dir.parent / "_temp_package_extract"
    if temp_extract.exists():
        shutil.rmtree(temp_extract, ignore_errors=True)
    temp_extract.mkdir(parents=True, exist_ok=True)

    print(f"[*] Extracting package archive: {package_path.name}...")
    with tarfile.open(package_path, "r:*") as tar:
        tar.extractall(path=temp_extract)

    extracted_count = 0
    for guid_dir in temp_extract.iterdir():
        if not guid_dir.is_dir():
            continue

        pathname_file = guid_dir / "pathname"
        asset_file = guid_dir / "asset"
        meta_file = guid_dir / "asset.meta"

        if not pathname_file.exists():
            continue

        try:
            with open(pathname_file, "r", encoding="utf-8", errors="ignore") as pf:
                original_asset_rel_path = pf.read().strip().replace("\\", "/")
        except Exception:
            continue

        # Adjust target destination
        if target_subfolder:
            # If original path starts with "Assets/", insert target_subfolder
            if original_asset_rel_path.startswith("Assets/"):
                rel_part = original_asset_rel_path[len("Assets/"):]
                dest_asset_path = output_assets_dir / target_subfolder / rel_part
            else:
                dest_asset_path = output_assets_dir / target_subfolder / original_asset_rel_path
        else:
            if original_asset_rel_path.startswith("Assets/"):
                rel_part = original_asset_rel_path[len("Assets/"):]
                dest_asset_path = output_assets_dir / rel_part
            else:
                dest_asset_path = output_assets_dir / original_asset_rel_path

        dest_asset_path.parent.mkdir(parents=True, exist_ok=True)

        # Copy main asset file
        if asset_file.exists():
            shutil.copy2(asset_file, dest_asset_path)
            extracted_count += 1

        # Copy .meta file
        if meta_file.exists():
            dest_meta_path = dest_asset_path.parent / f"{dest_asset_path.name}.meta"
            shutil.copy2(meta_file, dest_meta_path)

    # Cleanup temp directory
    shutil.rmtree(temp_extract, ignore_errors=True)
    print(f"[+] Successfully integrated {extracted_count} assets into {output_assets_dir}")
    return extracted_count

def main():
    parser = argparse.ArgumentParser(description="Unity Asset Store Acquisition & Integration Pipeline")
    subparsers = parser.add_subparsers(dest="command", help="Pipeline commands")

    # List Command
    list_parser = subparsers.add_parser("list", help="List all downloaded Unity packages in local cache")
    list_parser.add_argument("--cache-dir", type=str, default=None, help="Custom cache directory")

    # Import Command
    import_parser = subparsers.add_parser("import", help="Import a .unitypackage into a Unity project")
    import_parser.add_argument("package_name_or_path", type=str, help="Package filename or absolute path")
    import_parser.add_argument("--project-dir", type=str, default=".", help="Path to Unity project root")
    import_parser.add_argument("--subfolder", type=str, default=None, help="Optional subfolder under Assets/")

    args = parser.parse_args()

    if args.command == "list":
        cache_dir = Path(args.cache_dir) if args.cache_dir else get_asset_store_cache_path()
        print(f"[*] Scanning cache at: {cache_dir}\n")
        packages = scan_cached_assets(cache_dir)
        if not packages:
            print("No packages found.")
            return

        print(f"{'Package Name':<45} | {'Publisher':<20} | {'Size (MB)':<10}")
        print("-" * 80)
        for p in packages:
            print(f"{p['name']:<45} | {p['publisher']:<20} | {p['size_mb']:<10}")
        print(f"\nTotal: {len(packages)} packages found.")

    elif args.command == "import":
        target_pkg = Path(args.package_name_or_path)
        if not target_pkg.is_file():
            # Search in default cache
            cache_dir = get_asset_store_cache_path()
            matches = list(cache_dir.rglob(f"*{args.package_name_or_path}*"))
            if matches:
                target_pkg = matches[0]
            else:
                print(f"[ERROR] Could not find package: {args.package_name_or_path}")
                sys.exit(1)

        project_dir = Path(args.project_dir).resolve()
        assets_dir = project_dir / "Assets"
        if not assets_dir.exists():
            print(f"[ERROR] Invalid Unity project (Assets folder not found at {assets_dir})")
            sys.exit(1)

        unpack_unitypackage(target_pkg, assets_dir, args.subfolder)

    else:
        parser.print_help()

if __name__ == "__main__":
    main()
