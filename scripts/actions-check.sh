
set -xe

for f in .github/workflows/*.yml; do
    action-validator "$f"
done

zizmor .github/workflows

