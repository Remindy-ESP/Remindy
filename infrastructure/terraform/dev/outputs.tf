output "resource_group_name" {
  description = "Name of the created resource group"
  value       = azurerm_resource_group.main.name
}

output "resource_group_location" {
  description = "Location of the created resource group"
  value       = azurerm_resource_group.main.location
}

output "vm_public_ips" {
  description = "Public IP addresses of the VMs"
  value       = azurerm_public_ip.vm_public_ip[*].ip_address
}

output "vm_private_ips" {
  description = "Private IP addresses of the VMs"
  value       = azurerm_network_interface.main[*].private_ip_address
}

output "vm_names" {
  description = "Names of the created VMs"
  value       = azurerm_linux_virtual_machine.main[*].name
}

output "virtual_network_name" {
  description = "Name of the virtual network"
  value       = azurerm_virtual_network.main.name
}

output "subnet_name" {
  description = "Name of the subnet"
  value       = azurerm_subnet.internal.name
}

output "admin_username" {
  description = "Admin username for VMs"
  value       = var.admin_username
}

output "admin_password" {
  description = "Admin password for VMs"
  value       = var.admin_password != null ? var.admin_password : random_password.vm_password[0].result
  sensitive   = true
}

output "ssh_connection_commands" {
  description = "SSH connection commands for each VM"
  value = [
    for i in range(var.vm_count) :
    "ssh ${var.admin_username}@${azurerm_public_ip.vm_public_ip[i].ip_address}"
  ]
}
