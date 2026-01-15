output "resource_group_name" {
  description = "Resource group name for terraform state"
  value       = azurerm_resource_group.tfstate.name
}

output "storage_account_name" {
  description = "Storage account name for terraform state"
  value       = azurerm_storage_account.tfstate.name
}

output "container_name" {
  description = "Storage container name for terraform state"
  value       = azurerm_storage_container.tfstate.name
}

output "backend_config" {
  description = "Backend configuration to use in dev/prod"
  value       = <<-EOT

    # Add this to your backend.tf files:
    terraform {
      backend "azurerm" {
        resource_group_name  = "${azurerm_resource_group.tfstate.name}"
        storage_account_name = "${azurerm_storage_account.tfstate.name}"
        container_name       = "${azurerm_storage_container.tfstate.name}"
        key                  = "remindy-ENV.tfstate"  # Replace ENV with dev or prod
      }
    }

  EOT
}
