# Devel

I do my "devel"opment here.

## Cheatsheet


Find a folder/file you deleted from a git:
```bash
git log --all --pretty=oneline -- services/js/health # With commit message and blobs

git log --all -- services/js/broker ## Just the blobs
```


Restore the missing file/folder from a blob:

```bash
git restore --source <blob> -- <path/to/file>
```


POST a json object with curl:

```bash
curl -s -X POST http://hostname:port/path/to/thing \
  -H 'content-type: application/json' \
  -d "{}"
```
