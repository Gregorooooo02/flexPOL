locals {
  artifact_registry_location = coalesce(var.artifact_registry_location, var.region)
}

# Images pushed by .github/workflows/docker-image.yml.
resource "google_artifact_registry_repository" "images" {
  repository_id = var.artifact_registry_repository
  location      = local.artifact_registry_location
  format        = "DOCKER"

  # No cleanup policies yet; dry run only reports what they would delete.
  cleanup_policy_dry_run = true

  docker_config {
    immutable_tags = false # the workflow moves the latest tag
  }

  depends_on = [google_project_service.enabled]
}
