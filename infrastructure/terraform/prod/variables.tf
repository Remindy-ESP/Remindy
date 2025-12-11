variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "location" {
  description = "Azure region where resources will be created"
  type        = string
  default     = "francecentral"
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
  description = "Docker Hub repository (username/repo-name)"
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
  default     = 1
}

variable "max_replicas" {
  description = "Maximum number of replicas"
  type        = number
  default     = 3
}

variable "cpu" {
  description = "CPU allocation"
  type        = number
  default     = 0.5
}

variable "memory" {
  description = "Memory allocation"
  type        = string
  default     = "1Gi"
}

variable "node_env" {
  description = "Node environment"
  type        = string
  default     = "production"
}

variable "neon_database_url_dev" {
  description = "Neon database URL for dev environment"
  type        = string
  sensitive   = true
}

variable "neon_database_url_staging" {
  description = "Neon database URL for staging environment"
  type        = string
  sensitive   = true
}

variable "neon_database_url_prod" {
  description = "Neon database URL for prod environment"
  type        = string
  sensitive   = true
}
