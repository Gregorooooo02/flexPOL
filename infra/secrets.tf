locals {
  # Secrets the app reads, each once even if two variables share it.
  app_secrets = toset([for ref in values(var.secret_env) : ref.secret])
}

# Terraform owns the secrets, not their values: versions are added with
#   printf '%s' "$VALUE" | gcloud secrets versions add <secret-id> --data-file=-
# so no password or API key ever ends up in the Terraform state.
resource "google_secret_manager_secret" "app" {
  for_each = setunion(local.app_secrets, var.extra_secrets)

  secret_id = each.value

  replication {
    auto {}
  }

  # Deleting or replacing a secret destroys its values; refuse instead.
  lifecycle {
    prevent_destroy = true
  }

  depends_on = [google_project_service.enabled]
}

resource "google_secret_manager_secret_iam_member" "runtime_access" {
  for_each = local.app_secrets

  secret_id = google_secret_manager_secret.app[each.value].id
  role      = "roles/secretmanager.secretAccessor"
  member    = google_service_account.runtime.member
}
