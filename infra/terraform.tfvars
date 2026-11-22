# The live setup of the flexpol project (imported on 2026-11-21; the plan showed no changes).
# Nothing here is secret: values live in Secret Manager. Commit this file so the
# whole team applies the same values.

project_id = "flexpol"
region     = "europe-central2"

# --- Cloud Run ---
service_name = "hedgeflex"
# Deployed from the console by digest; it is the image tagged sha-8888d50, 1.2 and latest.
# To deploy, put the workflow's sha-xxxxxxx tag here and apply.
image_tag = "1.5"

# SPRING_PROFILES_ACTIVE=postgres is already set in the image.
env = {}

# The database-password secret holds the whole JDBC URL, with user and password as
# URL parameters, so DATABASE_USERNAME and DATABASE_PASSWORD are not set.
secret_env = {
  DATABASE_URL   = { secret = "database-password", version = "1" }
  OPENAI_API_KEY = { secret = "openai-api-key", version = "2" }
}

# Exists but the app doesn't read it.
extra_secrets = ["postgres-connection"]

cpu           = "1000m"
memory        = "512Mi"
min_instances = 0
max_instances = 1

allow_public_access        = true
runtime_service_account_id = "hedgeflex-run"

# --- Artifact Registry and GitHub Actions (the repository variables of docker-image.yml) ---
artifact_registry_repository  = "flexpol"
ci_service_account_id         = "github-docker"
workload_identity_pool_id     = "github"
workload_identity_provider_id = "flexpol"
github_repository             = "Gregorooooo02/flexPOL"
