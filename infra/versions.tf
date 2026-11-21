terraform {
  # 1.7+: import blocks with expressions and for_each (imports.tf).
  required_version = ">= 1.7"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 8.12"
    }
  }

  # Shared state, so everyone on the team plans against the same picture.
  # The bucket is passed at init: terraform init -backend-config="bucket=<project-id>-tfstate"
  backend "gcs" {
    prefix = "hedgeflex"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
