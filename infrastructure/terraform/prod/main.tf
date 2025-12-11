module "container_app" {
  source = "../modules/container-app"

  environment         = var.environment
  location            = var.location
  image_tag           = var.image_tag
  dockerhub_username  = var.dockerhub_username
  dockerhub_token     = var.dockerhub_token
  dockerhub_repo      = var.dockerhub_repo
  container_port      = var.container_port
  min_replicas        = var.min_replicas
  max_replicas        = var.max_replicas
  cpu                 = var.cpu
  memory              = var.memory

  # Environment variables
  app_env_vars = {
    NODE_ENV     = var.node_env
    BACKEND_PORT = tostring(var.container_port)
  }

  # Secrets (database URL)
  app_secrets = {
    NEON_DATABASE_URL_DEV     = var.neon_database_url_dev
    NEON_DATABASE_URL_STAGING = var.neon_database_url_staging
    NEON_DATABASE_URL_PROD    = var.neon_database_url_prod
  }
}

