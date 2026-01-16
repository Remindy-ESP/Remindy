locals {
  resource_group_name = "rg-remindy-backend"  # Shared resource group
  container_app_name  = "ca-remindy-backend-${var.environment}"
  environment_name    = "cae-remindy"  # Shared environment

  # Use external environment if provided, otherwise use the one we create
  container_app_environment_id = var.container_app_environment_id != "" ? var.container_app_environment_id : azurerm_container_app_environment.main[0].id
}

# Resource Group (only create if not using external environment)
resource "azurerm_resource_group" "main" {
  count    = var.container_app_environment_id == "" ? 1 : 0
  name     = local.resource_group_name
  location = var.location

  tags = {
    project    = "remindy"
    managed_by = "terraform"
  }
}

# Container Apps Environment (only create if not using external environment)
resource "azurerm_container_app_environment" "main" {
  count               = var.container_app_environment_id == "" ? 1 : 0
  name                = local.environment_name
  location            = azurerm_resource_group.main[0].location
  resource_group_name = azurerm_resource_group.main[0].name

  tags = {
    project    = "remindy"
    managed_by = "terraform"
  }
}

# Container App
resource "azurerm_container_app" "main" {
  name                         = local.container_app_name
  container_app_environment_id = local.container_app_environment_id
  resource_group_name          = var.resource_group_name != "" ? var.resource_group_name : azurerm_resource_group.main[0].name
  revision_mode                = "Single"

  template {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

    container {
      name   = "remindy-backend"
      image  = "${var.dockerhub_repo}:${var.image_tag}"
      cpu    = var.cpu
      memory = var.memory

      # Environment variables
      dynamic "env" {
        for_each = var.app_env_vars
        content {
          name  = env.key
          value = env.value
        }
      }

      # Secrets as environment variables
      dynamic "env" {
        for_each = var.app_secrets
        content {
          name        = env.key
          secret_name = lower(replace(env.key, "_", "-"))
        }
      }
    }
  }

  # Registry configuration for private Docker Hub
  registry {
    server               = "docker.io"
    username             = var.dockerhub_username
    password_secret_name = "dockerhub-token"
  }

  # Secrets
  dynamic "secret" {
    for_each = var.app_secrets
    content {
      name  = lower(replace(secret.key, "_", "-"))
      value = secret.value
    }
  }

  secret {
    name  = "dockerhub-token"
    value = var.dockerhub_token
  }

  # Ingress configuration
  ingress {
    external_enabled = true
    target_port      = var.container_port
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  tags = {
    environment = var.environment
    project     = "remindy"
    managed_by  = "terraform"
    image_tag   = var.image_tag
  }
}
