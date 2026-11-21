variable "project_id" {
  description = "Google Cloud project ID."
  type        = string
}

variable "region" {
  description = "Region of the Cloud Run service."
  type        = string
  default     = "europe-central2"
}

# --- Cloud Run -----------------------------------------------------------------

variable "service_name" {
  description = "Cloud Run service name."
  type        = string
  default     = "hedgeflex"
}

variable "image_name" {
  description = "Image name inside the Artifact Registry repository (IMAGE_NAME in docker-image.yml)."
  type        = string
  default     = "hedgeflex"
}

variable "image_tag" {
  description = "Image to run: a tag such as sha-1234567 from the Build Docker image workflow, or a digest (sha256:...). Changing it deploys a new revision."
  type        = string
}

variable "env" {
  description = "Plain environment variables. SPRING_PROFILES_ACTIVE=postgres is already set in the image."
  type        = map(string)
  default     = {}
}

variable "secret_env" {
  description = "Environment variable name => Secret Manager secret and version (a number, or latest). Terraform creates the secrets; their values are added with gcloud and never pass through Terraform."
  type = map(object({
    secret  = string
    version = optional(string, "latest")
  }))
  default = {}
}

variable "extra_secrets" {
  description = "Secrets Terraform keeps (and protects from deletion) that the app does not read."
  type        = set(string)
  default     = []
}

variable "cpu" {
  description = "vCPU limit per instance."
  type        = string
  default     = "1000m"
}

variable "memory" {
  description = "Memory limit per instance."
  type        = string
  default     = "512Mi"
}

variable "min_instances" {
  description = "Minimum instances for the whole service (0 scales to zero when idle)."
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum instances for the whole service. Each opens up to DATABASE_POOL_SIZE (default 5) connections to the Supabase session pooler, which has a per-user connection limit."
  type        = number
  default     = 1
}

variable "allow_public_access" {
  description = "Let anyone call the service without an identity token (Cloud Run's invoker IAM check is turned off)."
  type        = bool
  default     = true
}

variable "runtime_service_account_id" {
  description = "Account ID (the part before @) of the service account the Cloud Run service runs as."
  type        = string
  default     = "hedgeflex-run"
}

# --- Artifact Registry and GitHub Actions ----------------------------------------

variable "artifact_registry_repository" {
  description = "Docker repository in Artifact Registry (GAR_REPOSITORY)."
  type        = string
  default     = "flexpol"
}

variable "artifact_registry_location" {
  description = "Artifact Registry location (GAR_LOCATION). Defaults to region."
  type        = string
  default     = null
}

variable "ci_service_account_id" {
  description = "Account ID of the service account GitHub Actions impersonates to push images (GCP_SERVICE_ACCOUNT)."
  type        = string
  default     = "github-docker"
}

variable "workload_identity_pool_id" {
  description = "Workload Identity pool for GitHub Actions."
  type        = string
  default     = "github"
}

variable "workload_identity_provider_id" {
  description = "OIDC provider in that pool."
  type        = string
  default     = "flexpol"
}

variable "github_repository" {
  description = "owner/name of the only GitHub repository allowed to use the pool. Case-sensitive, as GitHub spells it."
  type        = string
  default     = "Gregorooooo02/flexPOL"
}
