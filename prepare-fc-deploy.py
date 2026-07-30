import zipfile, os, shutil

dist_dir = r'g:\LTD\fc-dist'
deploy_dir = r'g:\LTD\fc-deploy-build'
zip_path = r'g:\LTD\fc-deploy.zip'

# 清理
if os.path.exists(deploy_dir):
    shutil.rmtree(deploy_dir)
os.makedirs(deploy_dir)

# 1. 复制 index.js (FC handler)
shutil.copy2(r'g:\LTD\fc-handler.js', os.path.join(deploy_dir, 'index.js'))

# 2. 复制编译后的服务端代码
server_src = r'g:\LTD\packages\server'
server_dst = os.path.join(deploy_dir, 'packages', 'server')
os.makedirs(os.path.join(server_dst, 'dist'), exist_ok=True)
os.makedirs(os.path.join(server_dst, 'prisma'), exist_ok=True)

# 复制 dist（含子目录）
shutil.copytree(os.path.join(server_src, 'dist'), os.path.join(server_dst, 'dist'), dirs_exist_ok=True)

# 复制 prisma schema
for f in os.listdir(os.path.join(server_src, 'prisma')):
    fp = os.path.join(server_src, 'prisma', f)
    if os.path.isfile(fp) and (f.endswith('.prisma') or f.endswith('.ts')):
        shutil.copy2(fp, os.path.join(server_dst, 'prisma', f))

# 3. 复制 package.json（用于 npm install）
shutil.copy2(os.path.join(server_src, 'package.json'), os.path.join(deploy_dir, 'package.json'))

print("Deploy directory prepared. Next step: npm install in", deploy_dir)
print("Run: cd", deploy_dir, "&& npm install --production")
