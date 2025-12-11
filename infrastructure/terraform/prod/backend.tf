# Backend configuration for Terraform state
# Uncomment and configure this file to use remote state storage in Azure Storage Account

# terraform {
#   backend "azurerm" {
#     resource_group_name  = "tfstate-rg"
#     storage_account_name = "remindytfstate"
#     container_name       = "tfstate"
#     key                  = "remindy-prod.tfstate"
#   }
# }

# To create the backend storage:
# az group create --name tfstate-rg --location francecentral
# az storage account create --name remindytfstate --resource-group tfstate-rg --location francecentral --sku Standard_LRS
# az storage container create --name tfstate --account-name remindytfstate
