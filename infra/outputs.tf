output "service_url" {
  description = "Public URL of the app."
  value       = google_cloud_run_v2_service.app.uri
}

output "image" {
  description = "Image the service runs."
  value       = local.image
}

output "runtime_service_account" {
  description = "Service account the app runs as."
  value       = google_service_account.runtime.email
}

output "github_actions_variables" {
  description = "Repository variables for .github/workflows/docker-image.yml (Settings > Secrets and variables > Actions > Variables)."
  value = {
    GCP_PROJECT_ID                 = var.project_id
    GAR_LOCATION                   = local.artifact_registry_location
    GAR_REPOSITORY                 = google_artifact_registry_repository.images.repository_id
    GCP_WORKLOAD_IDENTITY_PROVIDER = google_iam_workload_identity_pool_provider.github.name
    GCP_SERVICE_ACCOUNT            = google_service_account.ci.email
  }
}
