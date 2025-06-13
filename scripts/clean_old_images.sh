#!/bin/bash

# Default to keeping 15 images if IMAGES_TO_KEEP is not set
IMAGES_TO_KEEP=${IMAGES_TO_KEEP:-15}

# Get all the images, ordered by date
image_details=$(aws ecr describe-images \
  --region "$AWS_REGION" \
  --repository-name "$ECR_REPOSITORY" \
  --query "sort_by(imageDetails,& imagePushedAt)[*].{digest: imageDigest, date: imagePushedAt}" \
  --output text)

# Get all the digests, except the last IMAGES_TO_KEEP
total_images=$(echo "$image_details" | wc -l)
images_to_delete=$((total_images - IMAGES_TO_KEEP))
if [ $images_to_delete -lt 1 ]; then
  echo "No images to delete. Total images: $total_images, keeping $IMAGES_TO_KEEP."
  exit 0
fi

image_digests=$(echo "$image_details" | awk '{print $2}' | head -n "$images_to_delete")

echo "Deleting $images_to_delete images, keeping the $IMAGES_TO_KEEP most recent."

# Delete the images
for digest in $image_digests; do
  result=$(aws ecr batch-delete-image --region "$AWS_REGION" --repository-name "$ECR_REPOSITORY" --image-ids imageDigest="$digest")
  if echo "$result" | jq -e '.imageIds[0]' > /dev/null 2>&1; then
    echo "Successfully deleted image with digest: $digest"
    echo "$result"
  elif echo "$result" | jq -e '.failures[0]' > /dev/null 2>&1; then
    echo "Failed to delete image with digest: $digest"
    echo "$result"
  else
    echo "Unexpected response for image with digest: $digest"
    echo "$result"
  fi
done 