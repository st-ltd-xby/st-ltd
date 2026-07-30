import zipfile, os

zip_path = r'g:\LTD\fc-test.zip'
handler_path = r'g:\LTD\fc-test-handler.js'

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.write(handler_path, 'index.js')

print(f"Test zip created: {zip_path} ({os.path.getsize(zip_path)} bytes)")
with zipfile.ZipFile(zip_path, 'r') as zf:
    print(f"Contents: {zf.namelist()}")
