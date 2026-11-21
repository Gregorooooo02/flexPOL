locals {
  apis = toset([
    "artifactregistry.googleapis.com",
    "iamcredentials.googleapis.com", # service account impersonation from GitHub Actions
    "run.googleapis.com",
    "secretmanager.googleapis.com",
  ])
}

resource "google_project_service" "enabled" {
  for_each = local.apis

  service = each.value
  # Never switch an API off: other things in the project may use it.
  disable_on_destroy = false
}
