output "application_url" {
  description = "The URL of the deployed application"
  value       = module.container_app.application_url
}

output "container_app_fqdn" {
  description = "The FQDN of the Container App"
  value       = module.container_app.container_app_fqdn
}

output "resource_group_name" {
  description = "Name of the created resource group"
  value       = module.container_app.resource_group_name
}

output "container_app_name" {
  description = "Name of the Container App"
  value       = module.container_app.container_app_name
}

output "container_app_environment_name" {
  description = "Name of the Container App Environment"
  value       = module.container_app.container_app_environment_name
}

output "container_app_environment_id" {
  description = "ID of the Container App Environment (for prod to reuse)"
  value       = module.container_app.container_app_environment_id
}
