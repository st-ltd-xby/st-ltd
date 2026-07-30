import zipfile, os

deploy_dir = r'g:\LTD\fc-deploy-build'
zip_path = r'g:\LTD\fc-deploy.zip'

skip_dirs = {'.cache', '.pnpm', '__pycache__'}
skip_packages = {'typescript', 'tsx', 'prisma', '.bin'}

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    count = 0
    for root, dirs, files in os.walk(deploy_dir):
        rel = os.path.relpath(root, deploy_dir).replace(os.sep, '/')

        if rel == 'node_modules':
            dirs[:] = [d for d in dirs if d not in skip_dirs]
        elif rel.startswith('node_modules/'):
            parts = rel.split('/')
            if len(parts) >= 2 and parts[1] in skip_packages:
                dirs.clear()
                continue
            dirs[:] = [d for d in dirs if d not in skip_dirs]
        else:
            dirs[:] = [d for d in dirs if d not in skip_dirs]

        for f in files:
            if f.endswith(('.map', '.d.ts', '.tsbuildinfo', '.dll.node')):
                continue
            if f in {'README.md', 'LICENSE', 'CHANGELOG.md', 'package-lock.json'}:
                continue
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, deploy_dir)
            zip_entry = rel_path.replace(os.sep, '/')
            zf.write(full_path, zip_entry)
            count += 1

with zipfile.ZipFile(zip_path, 'r') as zf:
    names = zf.namelist()
    print(f"Total files: {len(names)}")
    for check in [
        'index.js',
        'packages/server/dist/app.js',
        'node_modules/express/index.js',
        'node_modules/body-parser/index.js',
        'node_modules/@prisma/client/index.js',
        'node_modules/.prisma/client/index.js',
    ]:
        status = "OK" if check in names else "MISSING"
        print(f"  {status}: {check}")

size_mb = os.path.getsize(zip_path) / (1024 * 1024)
print(f"\nDone! {zip_path} ({size_mb:.2f} MB)")
