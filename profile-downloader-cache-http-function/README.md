
```
> gcloud info
Project: [customization-profile]
```
```
> gcloud run deploy profile-downloader-cache-http-function \
    --source . \
    --function profile-downloader-cache-http-function \
    --base-image nodejs22 \
    --region europe-west1
```
s