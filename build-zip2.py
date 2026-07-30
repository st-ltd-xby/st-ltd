import zipfile
import os
import shutil

dist_dir = r'g:\LTD\fc-dist'
flat_dir = r'g:\LTD\fc-flat'
zip_path = r'g:\LTD\fc-deploy.zip'

# 清理并创建平铺目录
if os.path.exists(flat_dir):
    shutil.rmtree(flat_dir)
os.makedirs(flat_dir)

# 复制所有文件到同一层（保留 node_modules 和 packages 子目录结构）
# 但把 index.js 和 app.js 的引用关系改成同目录
# 方案：把所有文件按原结构复制，确保路径正确

for item in os.listdir(dist_dir):
    src = os.path.join(dist_dir, item)
    dst = os.path.join(flat_dir, item)
    if os.path.isdir(src):
        shutil.copytree(src, dst, ignore=shutil.ignore_patterns('.cache', '.pnpm'))
    else:
        shutil.copy2(src, dst)

# 现在用 Python zipfile 打包（正斜杠）
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(flat_dir):
        dirs[:] = [d for d in dirs if d not in {'.cache', '.pnpm', '__pycache__'}]
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, flat_dir)
            zip_entry = rel_path.replace(os.sep, '/')
            zf.write(full_path, zip_entry)

# 验证 zip 内容
print("=== Verifying zip ===")
with zipfile.ZipFile(zip_path, 'r') as zf:
    names = zf.namelist()
    print(f"Total files: {len(names)}")
    # 检查关键文件
    for check in ['index.js', 'packages/server/dist/app.js', 'packages/server/dist/common/seed.js']:
        if check in names:
            print(f"  OK: {check}")
        else:
            print(f"  MISSING: {check}")
    # 显示前10个条目
    print("\nFirst 10 entries:")
    for n in names[:10]:
        print(f"  {n}")

size_mb = os.path.getsize(zip_path) / (1024 * 1024)
print(f"\nDone! {zip_path} ({size_mb:.2f} MB)")
