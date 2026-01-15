terraform {
  required_version = ">= 1.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    sops = {
      source  = "carlpett/sops"
      version = "~> 1.0"
    }
  }
}

provider "azurerm" {
  features {}
}

provider "sops" {}

# Read secrets from SOPS encrypted file
data "sops_file" "secrets" {
  source_file = "${path.module}/../../secrets/secrets.yaml"
}
