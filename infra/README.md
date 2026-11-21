# HedgeFlex infrastructure (Terraform)

The Google Cloud side of the deployment (project `flexpol`, region `europe-central2`) as code. Everything here was created by hand first and imported on 2026-11-21. A plan right after the import showed no changes, so the code describes exactly what runs.

| File | Resources |
|---|---|
| `cloud_run.tf` | Cloud Run service `hedgeflex`: image, env, secrets, scaling (max 1 instance), CPU/memory, public access (invoker IAM check off) |
| `secrets.tf` | Secret Manager secrets and read access for the runtime service account, only to the secrets it uses |
| `service_accounts.tf` | `hedgeflex-run` (the app) and `github-docker` (GitHub Actions) |
| `github_actions.tf` | Workload Identity pool `github` + provider `flexpol`, limited to this repository, and `github-docker`'s push access |
| `artifact_registry.tf` | Docker repository `flexpol` the workflow pushes to |
| `apis.tf` | The APIs these need |
| `terraform.tfvars` | The values. Committed; it holds no secrets |

**Not managed here:** secret *values* (added with `gcloud`, so they never enter the Terraform state), the Supabase database, and building images (`.github/workflows/docker-image.yml`).

State lives in the versioned bucket `gs://flexpol-tfstate`, so the whole team shares it.

## Running Terraform

Run everything from `infra/`. You need an account with access to the project, signed in with `gcloud auth login`.

**With Terraform installed** (1.7 or newer):

```sh
gcloud auth application-default login     # once per machine
terraform init -backend-config="bucket=flexpol-tfstate"
terraform plan
```

**Without installing it**, use Docker and a short-lived token from gcloud (Git Bash; get the token *before* setting `MSYS_NO_PATHCONV`, which breaks the gcloud wrapper):

```sh
export GOOGLE_OAUTH_ACCESS_TOKEN="$(gcloud auth print-access-token)"   # valid for 1 hour
export MSYS_NO_PATHCONV=1
tf() { docker run --rm -it -e GOOGLE_OAUTH_ACCESS_TOKEN -v "$(pwd -W):/w" -w /w hashicorp/terraform:1.17.2 "$@"; }
tf init -backend-config="bucket=flexpol-tfstate"
tf plan
```

Always read the plan before `apply`. Something listed as *destroyed* or *must be replaced* is almost never what you want. The secrets refuse it by design, and Terraform won't delete the service.

## Everyday use

**Deploy a new image.** Run the *Build Docker image* workflow and set `image_tag` in `terraform.tfvars` to the pushed `sha-xxxxxxx` tag (a `sha256:` digest also works). Then `terraform apply` and commit the change. From now on, deploy only through Terraform: a `gcloud run deploy` or console edit is reverted on the next apply, and the plan shows that first.

**Rotate a secret.** The service reads pinned versions (`DATABASE_URL` from `database-password` version 1, `OPENAI_API_KEY` from `openai-api-key` version 2). To change a value:

```sh
printf '%s' "<value>" | gcloud secrets versions add openai-api-key --data-file=-   # prints the new version number
```

Then set that `version` in `secret_env` and apply; this deploys a new revision with the value. With `version = "latest"` instead, new instances pick up new versions without an apply, but you can't tell from the code which value is live.

**Add an environment variable or secret.** Put it in `env`, or in `secret_env` as `{ secret = "...", version = "..." }`. Create the secret's first value before the apply that gives it to the app. A secret the app shouldn't read goes in `extra_secrets`.

**Good to know:** `database-password` actually holds the whole JDBC URL with the user and password as URL parameters. That's why `DATABASE_USERNAME` and `DATABASE_PASSWORD` aren't set. `postgres-connection` exists but nothing reads it.

## Starting from an empty project

Change `project_id` (and the names, if you like) in `terraform.tfvars`, and create a state bucket. The service can't start without an image and secret values, so build in stages:

```sh
terraform apply -target=google_artifact_registry_repository_iam_member.ci_writer \
                -target=google_service_account_iam_member.ci_workload_identity \
                -target=google_secret_manager_secret_iam_member.runtime_access
terraform output github_actions_variables    # set these as GitHub repository variables
# run the Build Docker image workflow, set image_tag, add each secret value with gcloud
terraform apply
```
