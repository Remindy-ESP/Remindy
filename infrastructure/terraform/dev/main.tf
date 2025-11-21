# Random password generation
resource "random_password" "vm_password" {
  count   = var.admin_password == null ? 1 : 0
  length  = 16
  special = true
}

# Resource Group - Create a new one or use existing
# Option 1: Create a new resource group
resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-${var.environment}-rg"
  location = var.location
  tags     = var.tags
}

# Option 2: Use existing resource group (comment out the resource above and uncomment below)
# data "azurerm_resource_group" "main" {
#   name = "your-existing-resource-group-name"
# }

# Virtual Network
resource "azurerm_virtual_network" "main" {
  name                = "${var.project_name}-${var.environment}-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = var.tags
}

# Subnet for VMs
resource "azurerm_subnet" "internal" {
  name                 = "internal"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.2.0/24"]
}

# Network Security Group and rules
resource "azurerm_network_security_group" "main" {
  name                = "${var.project_name}-${var.environment}-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = var.tags

  security_rule {
    name                       = "SSH"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "HTTP"
    priority                   = 1002
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "HTTPS"
    priority                   = 1003
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "App"
    priority                   = 1004
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = tostring(var.app_port)
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

# Associate Network Security Group to subnet
resource "azurerm_subnet_network_security_group_association" "main" {
  subnet_id                 = azurerm_subnet.internal.id
  network_security_group_id = azurerm_network_security_group.main.id
}


# Public IPs for VMs
resource "azurerm_public_ip" "vm_public_ip" {
  count               = var.vm_count
  name                = "${var.project_name}-${var.environment}-vm${count.index + 1}-pip"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Static"
  sku                 = "Standard"
  tags                = var.tags
}

# Network Interfaces for VMs
resource "azurerm_network_interface" "main" {
  count               = var.vm_count
  name                = "${var.project_name}-${var.environment}-vm${count.index + 1}-nic"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = var.tags

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.internal.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.vm_public_ip[count.index].id
  }
}

# Virtual Machines
resource "azurerm_linux_virtual_machine" "main" {
  count                           = var.vm_count
  name                            = "${var.project_name}-${var.environment}-vm${count.index + 1}"
  location                        = azurerm_resource_group.main.location
  resource_group_name             = azurerm_resource_group.main.name
  size                            = var.vm_size
  admin_username                  = var.admin_username
  disable_password_authentication = false
  tags                            = var.tags

  network_interface_ids = [
    azurerm_network_interface.main[count.index].id,
  ]

  admin_password = var.admin_password != null ? var.admin_password : random_password.vm_password[0].result

  admin_ssh_key {
    username   = var.admin_username
    public_key = var.ssh_public_key
  }

  os_disk {
    caching              = "ReadOnly"
    storage_account_type = "Standard_LRS"
    disk_size_gb         = 30
  }

  source_image_reference {
    publisher = "Debian"
    offer     = "debian-12"
    sku       = "12-gen2"
    version   = "latest"
  }

  custom_data = base64encode(templatefile("${path.module}/init-ansible-user.yml", {
    ansible_ssh_public_key = var.ansible_ssh_public_key
    admin_username         = var.admin_username
    admin_ssh_public_key   = var.ssh_public_key
  }))
}

# Null resource pour attendre que toutes les VMs soient prêtes
resource "null_resource" "wait_for_vms" {
  count = var.vm_count

  depends_on = [azurerm_linux_virtual_machine.main]

  # Attendre que SSH soit accessible
  provisioner "local-exec" {
    command = <<-EOT
      echo "⏳ Waiting for VM ${azurerm_linux_virtual_machine.main[count.index].name} to be accessible..."
      for i in {1..30}; do
        if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i ~/.ssh/remindy-ansible ansible@${azurerm_public_ip.vm_public_ip[count.index].ip_address} "echo 'VM ready'" 2>/dev/null; then
          echo "✅ VM ${azurerm_linux_virtual_machine.main[count.index].name} is ready"
          break
        fi
        echo "Attempt $i/30..."
        sleep 10
      done
    EOT
  }
}

# Null resource pour exécuter Ansible une fois toutes les VMs prêtes si plusieurs
resource "null_resource" "run_ansible" {
  depends_on = [null_resource.wait_for_vms]

  # Trigger le provisioner à chaque changement des IPs publiques
  triggers = {
    vm_ips = join(",", azurerm_public_ip.vm_public_ip[*].ip_address)
  }

  # Update Ansible inventory
  provisioner "local-exec" {
    command = <<-EOT
      cd ${path.module}/../../ansible/inventories
      echo "📝 Updating Ansible inventory..."
      ./update_inventory.sh
    EOT
  }

  # Run Ansible playbook
  provisioner "local-exec" {
    command = <<-EOT
      cd ${path.module}/../../ansible
      echo "🚀 Running Ansible playbook..."
      export ANSIBLE_HOST_KEY_CHECKING=False
      ansible-playbook -i inventories/hosts.ini playbooks/deploy-dev-backend.yml -vvv
    EOT
  }
}

