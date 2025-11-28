#!/bin/bash

# Default to keeping 15 images if IMAGES_TO_KEEP is not set
IMAGES_TO_KEEP=${IMAGES_TO_KEEP:-15}

# Get all the images, ordered by date (UTC)
# Format: IMAGE_ID CREATE_TIME
image_details=$(gcloud artifacts docker images list \
  "$ARTIFACT_REGISTRY_REPO/$REPOSITORY_NAME" \
  --format="table(PACKAGE,DIGEST,CREATE_TIME)" \
  --filter="CREATE_TIME" \
  --sort-by="~CREATE_TIME" \
  | tail -n +2 \
  | awk '{
      # Remove SHA256: prefix from DIGEST column
      gsub(/^sha256:/, "", $2);
      print $1 " " $2 " " $3
    }')

# Get all the digests, except the last IMAGES_TO_KEEP
total_images=$(echo "$image_details" | wc -l)
images_to_delete=$((total_images - IMAGES_TO_KEEP))
if [ $images_to_delete -lt 1 ]; then
  echo "No images to delete. Total images: $total_images, keeping $IMAGES_TO_KEEP."
  exit 0
fi

# Extract digests to delete (skip the last IMAGES_TO_KEEP)
image_digests=$(echo "$image_details" | awk '{print $2}' | tail -n +$((IMAGES_TO_KEEP + 1)))

echo "Deleting $images_to_delete images, keeping the $IMAGES_TO_KEEP most recent."

# Delete the images
for digest in $image_digests; do
  echo "Attempting to delete image with digest: $digest"
  if gcloud artifacts docker images delete "$ARTIFACT_REGISTRY_REPO/$REPOSITORY_NAME@sha256:$digest" --quiet > /dev/null 2>&1; then
    echo "Successfully deleted image with digest: $digest"
  else
    echo "Failed to delete image with digest: $digest"
  fi
done
