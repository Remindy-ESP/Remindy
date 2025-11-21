terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }

  # Uncomment and configure backend for remote state storage
  # backend "azurerm" {
  #   resource_group_name  = "your-resource-group"
  #   storage_account_name = "your-storage-account"
  #   container_name       = "tfstate"
  #   key                  = "remindy-dev.tfstate"
  # }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
    virtual_machine {
      delete_os_disk_on_deletion     = true
      skip_shutdown_and_force_delete = true
    }
  }
}

provider "random" {}
