#!/bin/bash

# Script simple pour découvrir les VMs Azure et générer hosts.ini
# Usage: ./update_inventory.sh

# Load variables from parent .env file
if [[ -f "../.env" ]]; then
    source ../.env
fi

# Default variables
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-your-resource-group}"
ANSIBLE_USER="${ANSIBLE_USER:-ansible}"
SSH_KEY="${ANSIBLE_SSH_KEY:-~/.ssh/remindy-ansible}"

echo "🔍 Découverte des VMs dans le resource group: $RESOURCE_GROUP"

# Configuration de la subscription si définie
if [[ -n "$AZURE_SUBSCRIPTION_ID" ]]; then
    az account set --subscription "$AZURE_SUBSCRIPTION_ID"
fi

# Découverte des VMs et leurs IPs
VM_LIST=$(az vm list-ip-addresses --resource-group "$RESOURCE_GROUP" --query "[].{name:virtualMachine.name, ip:virtualMachine.network.publicIpAddresses[0].ipAddress || virtualMachine.network.privateIpAddresses[0]}" -o tsv)

if [[ -z "$VM_LIST" ]]; then
    echo "❌ Aucune VM trouvée dans le resource group $RESOURCE_GROUP"
    exit 1
fi

# Comptage des VMs
VM_COUNT=$(echo "$VM_LIST" | wc -l)
echo "✅ $VM_COUNT VMs découvertes"

# Sauvegarde de l'ancien inventaire
if [[ -f "hosts.ini" ]]; then
    cp hosts.ini hosts.ini.backup.$(date +%Y%m%d_%H%M%S)
    echo "💾 Sauvegarde créée: hosts.ini.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Génération du nouveau hosts.ini
echo "📝 Génération du nouveau inventaire..."

cat > hosts.ini << EOF
# Inventaire généré automatiquement le $(date)
# Resource Group: $RESOURCE_GROUP
# Nombre de VMs: $VM_COUNT

[app_servers]
EOF

# Ajout de chaque VM
while IFS=$'\t' read -r vm_name vm_ip; do
    if [[ -n "$vm_name" && -n "$vm_ip" && "$vm_ip" != "None" ]]; then
        echo "$vm_name ansible_host=$vm_ip" >> hosts.ini
        echo "  ✅ Ajouté: $vm_name ($vm_ip)"
    fi
done <<< "$VM_LIST"

# Ajout des variables communes
cat >> hosts.ini << EOF

[app_servers:vars]
ansible_user=$ANSIBLE_USER
ansible_ssh_private_key_file=$SSH_KEY
ansible_ssh_common_args='-o StrictHostKeyChecking=no'
ansible_python_interpreter=/usr/bin/python3
EOF

echo ""
echo "✅ Inventaire mis à jour: hosts.ini"
echo ""
echo "fichier généré:"
echo "=========================="
cat hosts.ini
echo ""
echo "🧪 Test de connectivité:"
echo "   ansible all -m ping"