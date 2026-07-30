import zipfile
import os

dist_dir = r'g:\LTD\fc-dist'
zip_path = r'g:\LTD\fc-deploy.zip'

skip_dirs = {'.cache', '.pnpm', '__pycache__'}

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(dist_dir):
        # Skip unwanted directories
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        
        for f in files:
            full_path = os.path.join(root, f)
            # Calculate relative path from dist_dir
            rel_path = os.path.relpath(full_path, dist_dir)
            # Convert to forward slashes for Linux compatibility
            zip_path_entry = rel_path.replace(os.sep, '/')
            zf.write(full_path, zip_path_entry)
            print(f"  Added: {zip_path_entry}")

size_mb = os.path.getsize(zip_path) / (1024 * 1024)
print(f"\nDone! {zip_path} ({size_mb:.2f} MB)")
