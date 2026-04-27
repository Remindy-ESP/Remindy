/# Stratégie de Merge - Remindy

## Vue d'ensemble

Ce document explique comment merger le code "sain" de `develop` vers `preprod` et `master` en utilisant la stratégie "ours" pour éviter les conflits.

---

## Stratégie de branches

```
develop (code sain) → preprod (staging) → master (production)
```

**Principe :**
- `develop` contient toujours le code source de vérité
- `preprod` et `master` acceptent TOUJOURS les changements de develop (stratégie "ours")
- Pas de merge inverse (jamais de preprod → develop ou master → develop)

---

## Première fois : Initialiser preprod et master

### Étape 1 : Créer et pousser preprod

```bash
# Assure-toi d'être sur develop avec le dernier code
git checkout develop
git pull origin develop

# Créer la branche preprod depuis develop
git checkout -b preprod
git push -u origin preprod
```

### Étape 2 : Créer et pousser master

```bash
# Créer la branche master depuis preprod
git checkout -b master
git push -u origin master

# Revenir sur develop
git checkout develop
```

---

## Workflow quotidien

### 1. Merger develop → preprod (avec stratégie "ours")

```bash
# Checkout preprod
git checkout preprod
git pull origin preprod

# Merger develop en utilisant la stratégie "ours"
# "ours" = en cas de conflit, garde TOUJOURS la version de develop
git merge develop -X ours -m "Merge develop into preprod"

# Pousser vers GitHub
git push origin preprod
```

**Que se passe-t-il ?**
- ✅ Tous les nouveaux commits de `develop` sont appliqués
- ✅ En cas de conflit, la version de `develop` est automatiquement choisie
- ✅ Pas de résolution manuelle de conflit

### 2. Merger preprod → master (avec stratégie "ours")

```bash
# Checkout master
git checkout master
git pull origin master

# Merger preprod en utilisant la stratégie "ours"
git merge preprod -X ours -m "Merge preprod into master"

# Pousser vers GitHub
git push origin master
```

---

## Commandes rapides (alias recommandés)

Ajoute ces alias dans ton `.gitconfig` :

```bash
git config --global alias.merge-to-preprod '!git checkout preprod && git pull origin preprod && git merge develop -X ours && git push origin preprod && git checkout develop'

git config --global alias.merge-to-master '!git checkout master && git pull origin master && git merge preprod -X ours && git push origin master && git checkout develop'
```

**Utilisation :**
```bash
# Merger develop → preprod
git merge-to-preprod

# Merger preprod → master
git merge-to-master
```

---

## Scénarios spécifiques

### Si preprod ou master ont divergé (problème rare)

Si jamais `preprod` ou `master` contiennent des commits qui ne sont pas dans `develop` (ce qui ne devrait JAMAIS arriver), tu peux forcer la synchronisation :

```bash
# ATTENTION : Ceci écrase complètement preprod avec develop
git checkout preprod
git reset --hard develop
git push --force origin preprod
```

⚠️ **Utilise cette commande SEULEMENT si tu es sûr que develop contient le bon code !**

### Créer une Pull Request au lieu de merge direct

Si tu préfères utiliser des Pull Requests (recommandé pour la traçabilité) :

1. **Develop → Preprod :**
```bash
git checkout develop
gh pr create --base preprod --head develop --title "Release to staging" --body "Automatic release from develop to preprod"
```

2. **Preprod → Master :**
```bash
git checkout preprod
gh pr create --base master --head preprod --title "Release to production" --body "Automatic release from preprod to master"
```

Ensuite, merge les PR sur GitHub avec l'option "Merge commit" (pas squash ni rebase).

---

## Workflow complet (exemple)

```bash
# 1. Développement sur une feature branch
git checkout develop
git pull origin develop
git checkout -b feature/nouvelle-fonctionnalite

# ... développement ...

git add .
git commit -m "feat: ajout nouvelle fonctionnalité"
git push origin feature/nouvelle-fonctionnalite

# 2. Créer une PR vers develop
gh pr create --base develop --head feature/nouvelle-fonctionnalite

# 3. Après merge de la PR, merger develop → preprod
git checkout develop
git pull origin develop
git checkout preprod
git pull origin preprod
git merge develop -X ours -m "Release to staging"
git push origin preprod

# 4. Tests sur l'environnement staging OK, merger preprod → master
git checkout master
git pull origin master
git merge preprod -X ours -m "Release to production"
git push origin master

# 5. Revenir sur develop
git checkout develop
```

---

## Configuration GitHub (Protection des branches)

### Protéger develop

```
Settings → Branches → Add branch protection rule

Branch name pattern: develop
☑ Require pull request before merging
☑ Require approvals (1 minimum)
☑ Require status checks to pass (CI pipeline)
☐ Allow force pushes
☐ Allow deletions
```

### Protéger preprod

```
Settings → Branches → Add branch protection rule

Branch name pattern: preprod
☑ Require pull request before merging
☑ Require approvals (1 minimum)
☑ Require status checks to pass (Full CI pipeline)
☐ Allow force pushes
☐ Allow deletions
```

### Protéger master

```
Settings → Branches → Add branch protection rule

Branch name pattern: master
☑ Require pull request before merging
☑ Require approvals (2 minimum)
☑ Require status checks to pass (CD pipeline)
☐ Allow force pushes
☐ Allow deletions
```

---

## Vérification

Pour vérifier que tout est bien synchronisé :

```bash
# Comparer develop et preprod
git log develop..preprod
# → Devrait être vide ou ne montrer que les merge commits

# Comparer preprod et master
git log preprod..master
# → Devrait être vide ou ne montrer que les merge commits
```

---

## Troubleshooting

### "conflict: merge conflict in file.txt"

Si tu vois un conflit malgré la stratégie "ours", c'est que :
1. La commande n'utilisait pas `-X ours`
2. Annule et recommence :

```bash
git merge --abort
git merge develop -X ours -m "Merge develop into preprod"
```

### "Your branch is behind 'origin/preprod'"

Quelqu'un a poussé sur preprod pendant ton merge :

```bash
git pull --rebase origin preprod
git push origin preprod
```

### "fatal: refusing to merge unrelated histories"

Cela arrive si preprod/master ont été créés indépendamment :

```bash
git merge develop -X ours --allow-unrelated-histories -m "Merge develop into preprod"
```

---

## Bonnes pratiques

1. ✅ **Toujours** merger dans cet ordre : develop → preprod → master
2. ✅ **Jamais** merger dans le sens inverse
3. ✅ **Toujours** utiliser `-X ours` pour preprod et master
4. ✅ **Tester** sur staging (preprod) avant de merger vers master
5. ✅ **Utiliser des PR** pour la traçabilité
6. ✅ **Tag** les releases sur master :
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

---

**Créé pour Remindy - Stratégie Git**