variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "remindy"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "location" {
  description = "Azure region where resources will be created"
  type        = string
  default     = "West Europe"
}

variable "vm_count" {
  description = "Number of VMs to create"
  type        = number
  default     = 1
}

variable "vm_size" {
  description = "Size of the VMs"
  type        = string
  default     = "Standard_B1s"
}

variable "admin_username" {
  description = "Admin username for VMs"
  type        = string
  default     = "remindy"
}

variable "admin_password" {
  description = "Admin password for VMs"
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  description = "SSH public key for VM access"
  type        = string
}

variable "allowed_ips" {
  description = "List of allowed IP addresses for SSH access"
  type        = list(string)
  default     = ["163.5.3.68/32"]
}

variable "app_port" {
  description = "Application port"
  type        = number
  default     = 3000
}

variable "ansible_ssh_public_key" {
  description = "SSH public key for Ansible user"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "remindy"
    Environment = "dev"
    ManagedBy   = "Terraform"
    Owner       = "DevOps-Team"
  }
}
