locals {
  image_repository = "${local.artifact_registry_location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.images.repository_id}/${var.image_name}"
  # A digest is pinned with @, a tag with :.
  image = startswith(var.image_tag, "sha256:") ? "${local.image_repository}@${var.image_tag}" : "${local.image_repository}:${var.image_tag}"
}

resource "google_cloud_run_v2_service" "app" {
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  # Public without an identity token (instead of an allUsers invoker binding).
  invoker_iam_disabled = var.allow_public_access

  # Terraform refuses to delete the service; set to false first if you really mean it.
  deletion_protection = true

  # Instance limits for the whole service, across revisions.
  scaling {
    min_instance_count = var.min_instances
    max_instance_count = var.max_instances
  }

  template {
    service_account = google_service_account.runtime.email

    containers {
      name  = "hedgeflex-1"
      image = local.image

      # Cloud Run passes this as PORT; server.port reads it.
      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
        cpu_idle          = true # CPU only while handling requests
        startup_cpu_boost = true # faster Spring Boot + Flyway start
      }

      dynamic "env" {
        for_each = var.env
        content {
          name  = env.key
          value = env.value
        }
      }

      # Resolved when an instance starts; with "latest", a new secret version reaches new instances.
      dynamic "env" {
        for_each = var.secret_env
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.app[env.value.secret].secret_id
              version = env.value.version
            }
          }
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    # Set by gcloud and the console on every deploy; not configuration.
    ignore_changes = [client, client_version]

    precondition {
      condition     = length(setintersection(keys(var.env), keys(var.secret_env))) == 0
      error_message = "A variable can't be in both env and secret_env."
    }
  }

  # A revision fails to start if its service account can't read the secrets yet.
  depends_on = [
    google_project_service.enabled,
    google_secret_manager_secret_iam_member.runtime_access,
  ]
}
