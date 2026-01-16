variable "environment" {
  description = "Environment name (dev/prod)"
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be dev or prod."
  }
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "francecentral"
}

variable "container_app_environment_id" {
  description = "Existing Container App Environment ID (if empty, a new one will be created)"
  type        = string
  default     = ""
}

variable "resource_group_name" {
  description = "Existing Resource Group name (if empty, a new one will be created)"
  type        = string
  default     = ""
}

variable "image_tag" {
  description = "Docker image tag (commit SHA)"
  type        = string
}

variable "dockerhub_username" {
  description = "Docker Hub username"
  type        = string
}

variable "dockerhub_token" {
  description = "Docker Hub access token"
  type        = string
  sensitive   = true
}

variable "dockerhub_repo" {
  description = "Docker Hub repository name"
  type        = string
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 3000
}

variable "min_replicas" {
  description = "Minimum number of replicas"
  type        = number
  default     = 0
}

variable "max_replicas" {
  description = "Maximum number of replicas"
  type        = number
  default     = 1
}

variable "cpu" {
  description = "CPU allocation"
  type        = number
  default     = 0.25
}

variable "memory" {
  description = "Memory allocation"
  type        = string
  default     = "0.5Gi"
}

variable "app_env_vars" {
  description = "Application environment variables"
  type        = map(string)
  default     = {}
}

variable "app_secrets" {
  description = "Application secrets"
  type        = map(string)
  default     = {}
}
