output "application_url" {
  description = "The FQDN of the Container App"
  value       = "https://${azurerm_container_app.main.ingress[0].fqdn}"
}

output "container_app_fqdn" {
  description = "The FQDN of the Container App"
  value       = azurerm_container_app.main.ingress[0].fqdn
}

output "resource_group_name" {
  description = "The name of the resource group"
  value       = var.resource_group_name != "" ? var.resource_group_name : azurerm_resource_group.main[0].name
}

output "container_app_name" {
  description = "The name of the Container App"
  value       = azurerm_container_app.main.name
}

output "container_app_environment_name" {
  description = "The name of the Container App Environment"
  value       = var.container_app_environment_id != "" ? "external" : azurerm_container_app_environment.main[0].name
}

output "container_app_environment_id" {
  description = "The ID of the Container App Environment"
  value       = local.container_app_environment_id
}
