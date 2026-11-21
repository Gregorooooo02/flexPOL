# Identity of the running app: it may only read the secrets it uses.
resource "google_service_account" "runtime" {
  account_id = var.runtime_service_account_id
}

# Impersonated by GitHub Actions (github_actions.tf) to push images.
resource "google_service_account" "ci" {
  account_id = var.ci_service_account_id
}
